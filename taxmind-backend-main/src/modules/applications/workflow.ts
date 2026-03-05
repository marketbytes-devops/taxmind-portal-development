import { eq, and, isNull } from 'drizzle-orm';
import { db, models } from '@/database';
import { serviceHandler } from '@/utils/serviceHandler';
import ApiError from '@/utils/apiError';
import * as maya from '@/integrations/maya';
import * as openai from '@/integrations/openai';
import * as s3 from '@/integrations/awsS3';
import { hashWithHMAC } from '@/utils/crypto';
import logger from '@/logger';
import { processTaxReturnSchema, confirmTaxReturnSchema } from './validations';
import { applicationStatuses, paymentStatuses } from '@/constants';
import * as revolut from '@/integrations/revolut';
import { mail } from '@/mail/handler';

/**
 * Service to process a tax return document:
 * 1. Download original from S3
 * 2. Send to Maya for anonymization
 * 3. Extract text from masked PDF
 * 4. Generate AI summary
 * 5. Return summary to admin for review
 */
export const processTaxReturn = serviceHandler(
    processTaxReturnSchema,
    async (req, res) => {
        const { applicationId } = req.params;

        // 1. Fetch application and original document
        const app = await db.query.applications.findFirst({
            where: and(isNull(models.applications.deletedAt), eq(models.applications.id, applicationId)),
            with: {
                taxReturnDocument: true,
            }
        });

        if (!app) throw new ApiError('Application not found', 404);
        if (!app.taxReturnDocumentId || !app.taxReturnDocument) {
            throw new ApiError('No tax return document found for this application', 400);
        }

        const { key, fileName } = app.taxReturnDocument;
        const finalFileName = fileName || 'document.pdf';

        try {
            // 2. Download from S3
            const fileBuffer = await s3.getFileBuffer(key);

            // 3. Maya Anonymization
            const requestId = await maya.anonymizeTaxPDF(fileBuffer, finalFileName);
            if (!requestId) throw new Error('Failed to get requestId from Maya');

            // wait for completion
            await maya.waitForJobCompletion(requestId);

            // download masked pdf
            const maskedBuffer = await maya.downloadAnonymizedFile(requestId);

            // 4. Upload Masked PDF back to S3
            const maskedFileName = `masked_${finalFileName}`;
            const maskedKey = await s3.uploadFile(maskedBuffer, maskedFileName);

            if (!maskedKey) throw new Error('Failed to upload masked file to S3');

            // 5. Create file record for the masked document
            const [maskedFile] = await db.insert(models.files).values({
                key: maskedKey,
                hashedKey: hashWithHMAC(maskedKey),
                fileName: maskedFileName,
                fileType: 'tax_return_document',
                mimeType: 'application/pdf',
                status: 'active',
                uploadedBy: req.admin.id,
                uploaderType: 'admin',
                uploadedAt: new Date().toISOString(),
                fileSize: maskedBuffer.length.toString(),
            }).returning();

            // 6. AI Summary (Robust handling - if this fails, we still return the masked file)
            let summary = '';
            try {
                const extractedText = await openai.extractTextFromPDF(maskedBuffer);
                summary = await openai.generateTaxDocumentSummary(extractedText);
            } catch (aiError: any) {
                logger.warn('AI Summarization failed but process will continue', aiError);
                summary = 'Automated summary failed. Please enter the details manually from the masked document.';
            }

            // 7. Store the summary in the application
            await db.update(models.applications)
                .set({
                    automatedSummary: summary,
                    updatedAt: new Date(),
                })
                .where(eq(models.applications.id, applicationId));

            // 8. Clean up Maya
            await maya.deleteAnonymizedFile(requestId).catch(e => logger.warn('Maya cleanup failed', e));

            return res.success('Tax return processed successfully', {
                summary,
                maskedFileId: maskedFile.id,
                maskedFileUrl: await s3.getPresignedGetObjectUrl(maskedKey)
            });

        } catch (error: any) {
            logger.error('Tax return processing error', error);
            throw new ApiError(`Processing failed: ${error.message}`, 500);
        }
    }
);

/**
 * Service to confirm the finalized summary and masked document:
 * 1. Update application with final summary
 * 2. Set the masked document as the official tax return document
 * 3. Enable visibility for client (customer)
 */
export const confirmTaxReturn = serviceHandler(
    confirmTaxReturnSchema,
    async (req, res) => {
        const { applicationId } = req.params;
        const { summary, maskedFileId } = req.body;

        const app = await db.query.applications.findFirst({
            where: and(isNull(models.applications.deletedAt), eq(models.applications.id, applicationId)),
            with: {
                user: true,
                taxReturnDocument: true,
            }
        });

        if (!app) throw new ApiError('Application not found', 404);

        // 1. Update application with finalized summary and status
        const updateData: any = {
            taxReturnSummary: summary,
            updatedAt: new Date(),
        };

        if (maskedFileId) {
            updateData.taxReturnDocumentId = maskedFileId;
        }

        await db.update(models.applications)
            .set(updateData)
            .where(eq(models.applications.id, applicationId));

        // 2. Generate Payment Link if amount is pending
        let paymentUrl = '';
        const finalAmount = Number(app.finalAmount || 0);

        if (finalAmount > 0 && app.paymentStatus !== paymentStatuses.COMPLETED) {
            try {
                // Ensure revolut customer exists
                let revolutCustomerId = app.user.revolutCustomerId;
                if (!revolutCustomerId) {
                    const customer = await revolut.createCustomer({
                        name: app.user.name,
                        email: app.user.email,
                        phone: app.user.phone,
                        dob: app.user.dob,
                    });
                    revolutCustomerId = customer.id;
                    await db.update(models.users)
                        .set({ revolutCustomerId })
                        .where(eq(models.users.id, app.user.id));
                }

                // Create Order
                const order = await revolut.createOrder({
                    amount: Math.round(finalAmount * 100),
                    currency: 'EUR',
                    customer: {
                        name: app.user.name,
                        email: app.user.email,
                        phone: app.user.phone,
                    },
                    revolutCustomerId: revolutCustomerId as string,
                    userId: app.user.id,
                    application: {
                        id: app.id,
                        applicationNo: app.applicationNo,
                        year: app.year as number,
                        finalAmount: app.finalAmount,
                    }
                });

                if (order && order.checkout_url) {
                    paymentUrl = order.checkout_url;
                }
            } catch (err) {
                logger.error('Failed to generate payment link in confirmation', err);
                // We continue even if payment link fails, to not block the summary confirmation
            }
        }

        // 3. Send Email Notification
        try {
            await mail.taxReturnProcessed({
                recipient: app.user.email,
                replacements: {
                    name: app.user.name,
                    summary: summary.replace(/\n/g, '<br>'), // Simple formatting for HTML
                    year: app.year,
                    paymentUrl: paymentUrl
                }
            });
        } catch (err) {
            logger.error('Failed to send confirmation email', err);
        }

        return res.success('Tax return confirmed and finalized. Notification sent to client.');
    }
);
