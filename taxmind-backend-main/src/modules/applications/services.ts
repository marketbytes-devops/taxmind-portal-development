import { randomBytes } from 'crypto';
import { SQL, and, desc, eq, inArray, isNull, ne, not, or, sql } from 'drizzle-orm';
import { Request, Response } from 'express';

import {
  applicationStatuses,
  currentSteps,
  paymentMethods,
  paymentStatuses,
  stepKeys,
} from '@/constants';
import { activityLogEntityNames } from '@/constants';
import { db, models } from '@/database';
import { getPresignedGetObjectUrl } from '@/integrations/awsS3';
import { createCustomer, createOrder, getCustomer, getOrder } from '@/integrations/revolut';
import { activityLog } from '@/logger/activityLog';
import { mail } from '@/mail';
import { notificationHandler } from '@/notifications';
import { notificationTemplates } from '@/notifications/templates';
import ApiError from '@/utils/apiError';
import { hashSearchKeyword, hashTrigrams, hashWithHMAC } from '@/utils/crypto';
import { generateAlphaNumCode } from '@/utils/generateAlphaNumCode';
import { generateTaxPdf } from '@/utils/generateTaxPdf';
import { serviceHandler } from '@/utils/serviceHandler';

import {
  approveOfflinePaymentRequestSchema,
  calculateApplicationAmountsSchema,
  checkDocumentsUploadedStatusSchema,
  createApplicationNoteSchema,
  createApplicationReviewSchema,
  createDocumentRequestSchema,
  createOfflinePaymentRequestSchema,
  createPaymentCheckoutSchema,
  getApplicationReviewSchema,
  getApplicationSchema,
  getApplicationStepSchema,
  listApplicationNotesSchema,
  listApplicationReviewsSchema,
  listApplicationsAdminSchema,
  listApplicationsOfUserSchema,
  listApplicationsSchema,
  listCompletedPaymentsSchema,
  listPendingOfflinePaymentRequestsSchema,
  listRejectedOfflinePaymentRequestsSchema,
  rejectOfflinePaymentRequestSchema,
  setDocumentsVerifiedStatusSchema,
  setReviewedStatusSchema,
  startApplicationSchema,
  submitApplicationAmountsSchema,
  updateApplicationReviewStatusSchema,
  updateDocumentRequestStatusSchema,
} from './validations';

// Helper function to format text: first character uppercase, underscores as spaces
function formatText(text: string | null | undefined): string {
  if (text == null) return '';
  const formatted = text.replace(/_/g, ' ').toLowerCase();
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// Admin: Document Requests

export const createDocumentRequest = serviceHandler(
  createDocumentRequestSchema,
  async (req, res) => {
    const adminId = req.admin.id;
    const { applicationId, documentCategoryId, isRequired, note } = req.body;

    // Validate application
    const app = await db.query.applications.findFirst({
      where: and(isNull(models.applications.deletedAt), eq(models.applications.id, applicationId)),
      columns: { id: true },
      with: {
        applicationStatusHistories: { columns: { status: true } },
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            fcmToken: true,
            isAppNotificationEnabled: true,
          },
        },
      },
    });
    if (!app) throw new ApiError('Application not found', 404);

    const appStatusHistorySet = new Set(app.applicationStatusHistories.map((h) => h.status));
    if (appStatusHistorySet.has(applicationStatuses.DOCUMENTS_VERIFIED)) {
      throw new ApiError('Cannot request document: application document already verified', 409);
    }

    // Validate document category
    const docCat = await db.query.documentCategories.findFirst({
      where: and(
        isNull(models.documentCategories.deletedAt),
        eq(models.documentCategories.id, documentCategoryId)
      ),
      columns: { id: true, name: true },
    });
    if (!docCat) throw new ApiError('Document category not found', 404);

    // Avoid duplicate requests for the same app+category if one exists and is not withdrawn
    const existing = await db.query.applicationDocumentCategories.findFirst({
      where: and(
        eq(models.applicationDocumentCategories.applicationId, applicationId),
        eq(models.applicationDocumentCategories.documentCategoryId, documentCategoryId),
        isNull(models.applicationDocumentCategories.deletedAt)
      ),
      columns: { id: true, status: true },
    });
    if (existing && existing.status !== 'withdrawn') {
      throw new ApiError('A request for this document category already exists', 409);
    }

    const documentRequest = await db.transaction(async (tx) => {
      const [documentRequest] = await tx
        .insert(models.applicationDocumentCategories)
        .values({
          applicationId,
          documentCategoryId,
          isRequired,
          note: note ?? null,
          adminId,
          isAdditionalDocument: true,
          status: 'pending',
        })
        .returning();
      if (isRequired) {
        await tx
          .update(models.applications)
          .set({ status: applicationStatuses.DOCUMENTS_UPLOAD_PENDING })
          .where(eq(models.applications.id, applicationId));

        if (!appStatusHistorySet.has(applicationStatuses.DOCUMENTS_UPLOAD_PENDING)) {
          await tx.insert(models.applicationStatusHistories).values({
            applicationId,
            status: applicationStatuses.DOCUMENTS_UPLOAD_PENDING,
          });
        }
      }
      return documentRequest;
    });

    // send email to user notify additional document request
    await mail.additionalDocumentRequest({
      recipient: app.user.email,
      replacements: {
        name: app.user.name,
        documentCategory: docCat.name,
      },
    });
    // if (app.user.fcmToken) {
    //   sendNotification({
    //     tokens: [app.user.fcmToken],
    //     payload: {
    //       title: notificationTemplates.additionalDocumentRequest.title,
    //       body: notificationTemplates.additionalDocumentRequest.body,
    //     },
    //     data: {
    //       type: notificationTemplates.additionalDocumentRequest.type,
    //     },
    //   });
    // }
    notificationHandler({
      tokens: app.user.fcmToken?.split(','),
      payload: notificationTemplates.additionalDocumentRequest,
      data: {
        type: notificationTemplates.additionalDocumentRequest.type,
      },
      userId: app.user.id,
      appNotificationsEnabled: app.user.isAppNotificationEnabled,
    });
    return res.success('Document request created', documentRequest);
  }
);

export const updateDocumentRequestStatus = serviceHandler(
  updateDocumentRequestStatusSchema,
  async (req, res) => {
    const adminId = req.admin.id;
    const { applicationDocumentCategoryId } = req.params;
    const { status, rejectedReason } = req.body;

    const existing = await db.query.applicationDocumentCategories.findFirst({
      where: and(
        isNull(models.applicationDocumentCategories.deletedAt),
        eq(models.applicationDocumentCategories.id, applicationDocumentCategoryId)
      ),
      with: {
        application: {
          columns: { id: true },
          with: {
            applicationStatusHistories: { columns: { status: true } },
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                fcmToken: true,
                isAppNotificationEnabled: true,
              },
            },
          },
        },
      },
    });
    if (!existing) throw new ApiError('Document request not found', 404);

    // Disallow updates once the request is no longer pending
    // if (existing.status && existing.status !== 'pending') {
    //   throw new ApiError('Status cannot be updated after it has been processed', 409);
    // }

    if (existing.status && existing.status === 'withdrawn') {
      throw new ApiError('Status cannot be updated after it has been withdrawn', 409);
    }

    const appStatusHistorySet = new Set(
      existing.application.applicationStatusHistories.map((h) => h.status)
    );
    if (appStatusHistorySet.has(applicationStatuses.DOCUMENTS_VERIFIED)) {
      throw new ApiError(
        'Cannot update request status: application document already verified',
        409
      );
    }

    // if (status !== 'withdrawn' &&!appStatusHistorySet.has(applicationStatuses.DOCUMENTS_UPLOADED)) {
    //   throw new ApiError('Cannot proceed: Documents are pending submission from the user', 409);
    // }

    // if (
    //   status !== 'withdrawn' &&
    //   appStatusHistorySet.has(applicationStatuses.DOCUMENTS_UPLOAD_PENDING)
    // ) {
    //   throw new ApiError(
    //     'Cannot proceed: Documents are pending submission from the user',
    //     409
    //   );
    // }

    // Determine if the user has uploaded any files for this request
    const docFiles = await db.query.applicationDocumentCategoryFiles.findMany({
      where: eq(
        models.applicationDocumentCategoryFiles.applicationDocumentCategoryId,
        applicationDocumentCategoryId
      ),
      with: {
        file: { columns: { id: true, uploaderType: true } },
      },
      columns: { applicationDocumentCategoryId: false, fileId: false, createdAt: false },
    });
    // const userUploadedCount = docFiles.filter((f) => f.file?.uploaderType === 'user').length;
    const totalFileCount = docFiles.length;
    // Business rules: Changed since admin have provision to upload files as well
    // - Accept/Reject ONLY if the user has uploaded at least one file.
    // - Withdraw ONLY if the user has NOT uploaded any file yet.
    if ((status === 'accepted' || status === 'rejected') && totalFileCount === 0) {
      throw new ApiError(
        'Unable to accept or reject this request as no file has been associated',
        409
      );
    }
    if (status === 'withdrawn' && totalFileCount > 0) {
      throw new ApiError('Cannot withdraw this request after files have been uploaded', 409);
    }

    // Enforce rejected reason when rejecting
    if (status === 'rejected' && !rejectedReason) {
      throw new ApiError('Rejected reason is required when rejecting a document request', 400);
    }

    const updatedDocumentRequest = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(models.applicationDocumentCategories)
        .set({
          status,
          rejectedReason: status === 'rejected' ? (rejectedReason ?? null) : null,
          adminId, // track last admin touching the request
          updatedAt: new Date(),
        })
        .where(eq(models.applicationDocumentCategories.id, applicationDocumentCategoryId))
        .returning();

      if (status === 'rejected') {
        await db
          .update(models.applications)
          .set({ status: applicationStatuses.DOCUMENTS_UPLOAD_PENDING })
          .where(eq(models.applications.id, existing.applicationId));
        if (!appStatusHistorySet.has(applicationStatuses.DOCUMENTS_UPLOAD_PENDING)) {
          await db.insert(models.applicationStatusHistories).values({
            applicationId: existing.applicationId,
            status: applicationStatuses.DOCUMENTS_UPLOAD_PENDING,
          });
        }
      }

      return updated;
    });

    if (status === 'withdrawn') {
      const categories = await db.query.applicationDocumentCategories.findMany({
        where: and(
          eq(models.applicationDocumentCategories.applicationId, existing.applicationId),
          not(eq(models.applicationDocumentCategories.status, 'withdrawn')),
          isNull(models.applicationDocumentCategories.deletedAt)
        ),
        columns: {
          id: true,
          isRequired: true,
          status: true,
          note: true,
          rejectedReason: true,
          isAdditionalDocument: true,
          createdAt: true,
          updatedAt: true,
        },

        orderBy: (t, { asc }) => [asc(t.createdAt)],
      });
      console.log('categories', categories);
      const anyAdditionalRequiredPending = categories.some((cat) => {
        return cat.isRequired && cat.isAdditionalDocument;
      });

      if (!anyAdditionalRequiredPending) {
        if (appStatusHistorySet.has(applicationStatuses.DOCUMENTS_UPLOAD_PENDING)) {
          console.log('Deleting DOCUMENTS_UPLOAD_PENDING status history');
          await db
            .delete(models.applicationStatusHistories)
            .where(
              and(
                eq(
                  models.applicationStatusHistories.status,
                  applicationStatuses.DOCUMENTS_UPLOAD_PENDING
                ),
                eq(models.applicationStatusHistories.applicationId, existing.applicationId)
              )
            );
        }

        const complete = await areRequiredDocumentsComplete(existing.applicationId, true, true);
        if (complete) {
          console.log('Updating application status to DOCUMENTS_UPLOADED');
          await db
            .update(models.applications)
            .set({ status: applicationStatuses.DOCUMENTS_UPLOADED })
            .where(eq(models.applications.id, existing.applicationId));
        }

        // const anyRequiredPending = categories.some((cat) => {
        //   return cat.isRequired && !cat.isAdditionalDocument;
        // });
        // console.log('anyRequiredPending', anyRequiredPending);
        // if (!anyRequiredPending) {
        //   console.log('Updating application status to DOCUMENTS_UPLOADED');
        //   await db
        //     .update(models.applications)
        //     .set({ status: applicationStatuses.DOCUMENTS_UPLOADED })
        //     .where(eq(models.applications.id, existing.applicationId));
        // }
      }
    }

    if (status === 'rejected') {
      await mail.documentRejected({
        recipient: existing.application.user.email,
        replacements: {
          name: existing.application.user.name,
          reason: rejectedReason || 'Not specified',
        },
      });
      // if (existing.application.user.fcmToken) {
      //   sendNotification({
      //     tokens: [existing.application.user.fcmToken],

      //     payload: {
      //       title: notificationTemplates.documentRejected.title,
      //       body: notificationTemplates.documentRejected.body,
      //     },
      //     data: {
      //       type: notificationTemplates.documentRejected.type,
      //     },
      //   });
      // }

      notificationHandler({
        tokens: existing.application.user.fcmToken?.split(','),
        payload: notificationTemplates.documentRejected,
        data: {
          type: notificationTemplates.documentRejected.type,
        },
        userId: existing.application.user.id,
        appNotificationsEnabled: existing.application.user.isAppNotificationEnabled,
      });
    }

    return res.success('Document request status updated', updatedDocumentRequest);
  }
);

export const downloadApplicationData = serviceHandler(getApplicationSchema, async (req, res) => {
  const { applicationId } = req.params;

  // Fetch application with questionnaire response and user details in a single query
  const application = await db.query.applications.findFirst({
    where: and(isNull(models.applications.deletedAt), eq(models.applications.id, applicationId)),
    columns: {
      id: true,
      applicationNo: true,
      createdAt: true,
    },
    with: {
      questionnaireResponse: {
        columns: {
          id: true,
          questionnaireId: true,
          submittedAt: true,
        },
      },
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          ppsNumber: true,
          dob: true,
          profession: true,
          phone: true,
          eircode: true,
          address: true,
          maritalStatus: true,
          parentId: true,
        },
      },
    },
  });

  if (!application) throw new ApiError('Application not found', 404);

  if (!application.questionnaireResponse) {
    throw new ApiError('No questionnaire response found for this application', 404);
  }

  // Fetch questions with answers and category metadata in a single optimized query
  const rows = await db
    .select({
      questionId: models.questions.id,
      questionText: models.questions.questionText,
      answerValue: models.questionResponses.value,
      categoryName: models.questionCategories.name,
      categoryCreatedAt: models.questionCategories.createdAt,
      questionCreatedAt: models.questions.createdAt,
      questionType: models.questions.questionType,
    })
    .from(models.questions)
    .leftJoin(
      models.questionResponses,
      and(
        eq(models.questionResponses.questionId, models.questions.id),
        eq(models.questionResponses.questionnaireResponseId, application.questionnaireResponse.id),
        isNull(models.questionResponses.deletedAt)
      )
    )
    .leftJoin(
      models.questionCategories,
      eq(models.questionCategories.id, models.questions.categoryId)
    )
    .where(eq(models.questions.questionnaireId, application.questionnaireResponse.questionnaireId))
    .orderBy(models.questionCategories.createdAt, models.questions.createdAt);

  // Efficiently group questions by category using a Map
  const categoriesMap = new Map<
    string,
    {
      name: string;
      createdAt: Date | null;
      questions: Array<{ question: string; answer: string }>;
    }
  >();

  for (const row of rows) {
    if (!row.categoryName) continue;

    if (!categoriesMap.has(row.categoryName)) {
      categoriesMap.set(row.categoryName, {
        name: row.categoryName,
        createdAt: row.categoryCreatedAt as unknown as Date,
        questions: [],
      });
    }

    categoriesMap.get(row.categoryName)!.questions.push({
      question: row.questionText,
      answer:
        row.answerValue != null
          ? row.questionType === 'date'
            ? new Date(row.answerValue).toISOString().split('T')[0]
            : String(row.answerValue).replace(/_/g, ' ')
          : '-',
    });
  }

  // Convert Map to sorted array
  const questionnaire = Array.from(categoriesMap.values())
    .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0))
    .map((cat) => ({
      category: cat.name,
      questions: cat.questions,
    }));

  // Format dates once with helper function
  const formatDateLocale = (date: Date | null) =>
    date
      ? new Date(date).toLocaleString('en-IE', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : '';

  const submittedDate =
    formatDateLocale(application.questionnaireResponse.submittedAt) ||
    formatDateLocale(application.createdAt);

  const formattedDob = application.user.dob
    ? new Date(application.user.dob).toISOString().split('T')[0]
    : '';

  let spouse = null;
  let filters: (SQL | undefined)[] = [];

  // If user is a parent (parentId is null), find child as spouse
  if (!application.user.parentId) {
    filters.push(eq(models.users.parentId, application.user.id));
    filters.push(isNull(models.users.deletedAt));
  } else {
    // If user is a child (has parentId), find parent as spouse
    filters.push(eq(models.users.id, application.user.parentId));
    filters.push(isNull(models.users.deletedAt));
  }

  spouse = await db.query.users.findFirst({
    where: and(...filters),
    columns: {
      id: true,
      name: true,
      email: true,
      ppsNumber: true,
      dob: true,
      profession: true,
      phone: true,
      eircode: true,
      address: true,
    },
  });

  const data = {
    application: {
      applicationNo: application.applicationNo,
      submittedOn: submittedDate,
    },
    personalDetails: {
      name: application.user.name || '',
      email: application.user.email || '',
      phone: application.user.phone || '',
      dob: formattedDob,
      profession: application.user.profession || '',
      ppsNumber: application.user.ppsNumber || '',
      eircode: application.user.eircode || '',
      address: application.user.address || '',
      maritalStatus: formatText(application.user.maritalStatus),
      spouse: spouse
        ? {
            name: spouse.name || '',
            email: spouse.email || '',
            phone: spouse.phone || '',
            dob: spouse.dob ? new Date(spouse.dob).toISOString().split('T')[0] : '',
            profession: spouse.profession || '',
            ppsNumber: spouse.ppsNumber || '',
            eircode: spouse.eircode || '',
            address: spouse.address || '',
          }
        : null,
    },
    questionnaire,
  };

  await generateTaxPdf(data, res);
});

// Crockford Base32 (no 0/O/I/1 to avoid confusion)
const APP_NO_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(length = 10) {
  const buf = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    // Map each byte to an index in alphabet
    out += APP_NO_ALPHABET[buf[i] % APP_NO_ALPHABET.length];
  }
  return out;
}

async function generateUniqueApplicationNo(year: number, attempts = 5): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    const candidate = `TXM-${year}-${randomCode(10)}`;
    const exists = await db.query.applications.findFirst({
      where: eq(models.applications.applicationNo, candidate),
      columns: { id: true },
    });
    if (!exists) return candidate;
  }
  throw new ApiError('Could not allocate a unique application number. Please retry.', 500);
}

/**
 * Determines the current step of an application based on business rules
 * @param application - The application with questionnaire response and user data
 * @param docCats - Document categories for the application
 * @param statusHistory - Application status history records
 * @returns The current step string
 */
async function determineCurrentStep(
  application: {
    id: string;
    status: string;
    questionnaireResponse?: { status: string } | null;
    user: { isTaxAgentVerificationCompleted: boolean | null };
  },
  docCats: Array<{ status: string | null }>,
  statusHistory: Array<{ status: string }>
): Promise<string> {
  const statusSet = new Set(statusHistory.map((h) => h.status));

  // Determine current step based on the specified business rules (order matters)
  let currentStep = currentSteps.INITIAL_REVIEW_AND_ENQUIRY; // Default starting step

  // Rule 1: If questionnaire status is draft → initial_review_and_enquiry
  if (application.questionnaireResponse?.status === 'draft') {
    currentStep = currentSteps.INITIAL_REVIEW_AND_ENQUIRY;
  }
  // Rule 2: If questionnaire status is submitted → documents_upload
  else if (application.questionnaireResponse?.status === 'submitted') {
    currentStep = currentSteps.DOCUMENTS_UPLOAD;
  }

  // Rule 3: If user uploaded documents and agent verification is not completed → agent_activation
  if (
    statusSet.has(applicationStatuses.DOCUMENTS_UPLOADED) &&
    application.user.isTaxAgentVerificationCompleted === false
  ) {
    currentStep = currentSteps.AGENT_ACTIVATION;
  }

  // Rule 4: If user tax agent verification is completed → review
  if (
    statusSet.has(applicationStatuses.DOCUMENTS_UPLOADED) &&
    application.user.isTaxAgentVerificationCompleted === true
  ) {
    currentStep = currentSteps.REVIEW;
  }

  // Rule 5: If application status is DOCUMENTS_UPLOAD_PENDING → documents_upload_review
  if (application.status === applicationStatuses.DOCUMENTS_UPLOAD_PENDING) {
    currentStep = currentSteps.DOCUMENTS_UPLOAD_REVIEW;
  }

  // Rule 6: If status history contains DOCUMENTS_VERIFIED → processing
  if (
    statusSet.has(applicationStatuses.DOCUMENTS_VERIFIED) &&
    application.status !== applicationStatuses.DOCUMENTS_UPLOAD_PENDING
  ) {
    currentStep = currentSteps.PROCESSING;
  }

  // Rule 7: If application status is REFUND_COMPLETED → refund_completed
  if (application.status === applicationStatuses.REFUND_COMPLETED) {
    currentStep = currentSteps.REFUND_COMPLETED;
  }

  return currentStep;
}

// Start or resume an application for a year; also ensure a questionnaire response exists
export const startApplication = serviceHandler(startApplicationSchema, async (req, res) => {
  const userId = req.user.id;
  const { year, isAmendment, parentApplicationId } = req.body;

  // Check user verification requirements before allowing application start
  const currentUser = await db.query.users.findFirst({
    where: and(isNull(models.users.deletedAt), eq(models.users.id, userId)),
    columns: {
      id: true,
      parentId: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      isSignatureConsentCompleted: true,
      maritalStatus: true,
    },
  });

  if (!currentUser) throw new ApiError('User not found', 404);

  // Check current user verification requirements
  if (!currentUser.emailVerifiedAt) {
    throw new ApiError('Please verify your email before starting an application', 400);
  }
  if (!currentUser.phoneVerifiedAt) {
    throw new ApiError('Please verify your phone number before starting an application', 400);
  }
  if (!currentUser.isSignatureConsentCompleted) {
    throw new ApiError('Please complete signature consent before starting an application', 400);
  }

  // Check spouse verification requirements based on parent-child relationship
  if (currentUser.maritalStatus === 'married') {
    let spouse = null;

    // If current user is parent (parentId is null), find child as spouse
    if (!currentUser.parentId) {
      spouse = await db.query.users.findFirst({
        where: and(eq(models.users.parentId, userId), isNull(models.users.deletedAt)),
        columns: {
          id: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          isSignatureConsentCompleted: true,
        },
      });
    } else {
      // If current user is child (has parentId), find parent as spouse
      spouse = await db.query.users.findFirst({
        where: and(eq(models.users.id, currentUser.parentId), isNull(models.users.deletedAt)),
        columns: {
          id: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          isSignatureConsentCompleted: true,
        },
      });
    }

    // Check spouse verification requirements if spouse exists
    if (spouse) {
      if (!spouse.emailVerifiedAt) {
        throw new ApiError(
          'Spouse email verification is required before starting an application',
          400
        );
      }
      if (!spouse.phoneVerifiedAt) {
        throw new ApiError(
          'Spouse phone verification is required before starting an application',
          400
        );
      }
      if (!spouse.isSignatureConsentCompleted) {
        throw new ApiError(
          'Spouse signature consent is required before starting an application',
          400
        );
      }
    }
  }

  // Get published questionnaire for year
  const questionnaire = await db.query.questionnaires.findFirst({
    where: and(
      eq(models.questionnaires.taxYear, year),
      eq(models.questionnaires.status, 'published')
    ),
  });
  if (!questionnaire) throw new ApiError('No published questionnaire for selected year', 404);

  if (!isAmendment) {
    let refundCompletedApplicationExist = await db.query.applications.findFirst({
      where: and(
        eq(models.applications.userId, userId),
        eq(models.applications.year, year),
        eq(models.applications.status, applicationStatuses.REFUND_COMPLETED),
        isNull(models.applications.deletedAt)
      ),
    });
    if (refundCompletedApplicationExist) {
      throw new ApiError(
        'You have already submitted an application for the selected year. Please click on ‘Amendment’ to submit a new request for the same year.',
        409
      );
    }
  }

  let submittedApplicationExist = await db.query.applications.findFirst({
    where: and(
      eq(models.applications.userId, userId),
      eq(models.applications.year, year),
      isNull(models.applications.deletedAt),
      not(
        inArray(models.applications.status, [
          applicationStatuses.DRAFT,
          applicationStatuses.REFUND_COMPLETED,
        ])
      )
    ),
  });
  if (submittedApplicationExist) {
    throw new ApiError(
      'An application for the selected year is already submitted or in progress. Please continue with your existing application.',
      409
    );
  }

  // Find existing draft application for user+year (avoid duplicates)
  let application = await db.query.applications.findFirst({
    where: and(
      eq(models.applications.userId, userId),
      eq(models.applications.year, year),
      eq(models.applications.status, 'draft'),
      isNull(models.applications.deletedAt)
    ),
    columns: {
      id: true,
      applicationNo: true,
      year: true,
      status: true,
      isAmendment: true,
      parentId: true,
      createdAt: true,
    },
  });

  if (!application) {
    const appNo = await generateUniqueApplicationNo(year);
    const applicationNoTrigramHashes = hashTrigrams(appNo.toLowerCase());
    const [created] = await db
      .insert(models.applications)
      .values({
        applicationNo: appNo,
        hashedApplicationNo: hashWithHMAC(appNo.toLowerCase()),
        applicationNoTrigramHashes,
        userId,
        year,
        status: applicationStatuses.DRAFT,
        isAmendment: !!isAmendment,
        parentId: parentApplicationId ?? null,
      })
      .returning({
        id: models.applications.id,
        applicationNo: models.applications.applicationNo,
        year: models.applications.year,
        status: models.applications.status,
        isAmendment: models.applications.isAmendment,
        parentId: models.applications.parentId,
        createdAt: models.applications.createdAt,
      });
    application = created;

    // Record initial status history as draft
    await db.insert(models.applicationStatusHistories).values({
      applicationId: application.id,
      status: applicationStatuses.DRAFT,
    });
  }

  // Ensure questionnaire response exists for this application and questionnaire
  let response = await db.query.questionnaireResponses.findFirst({
    where: and(
      eq(models.questionnaireResponses.applicationId, application.id),
      eq(models.questionnaireResponses.questionnaireId, questionnaire.id),
      isNull(models.questionnaireResponses.deletedAt)
    ),
  });

  if (!response) {
    const firstCategory = await db.query.questionCategories.findFirst({
      where: eq(models.questionCategories.questionnaireId, questionnaire.id),
      orderBy: models.questionCategories.sortOrder,
    });

    const [createdResp] = await db
      .insert(models.questionnaireResponses)
      .values({
        questionnaireId: questionnaire.id,
        applicationId: application.id,
        currentCategoryId: firstCategory?.id ?? null,
        status: 'draft',
      })
      .returning();
    response = createdResp;
  }

  return res.success('Application started', {
    application,
    // questionnaireId: questionnaire.id,
    questionnaireResponseId: response.id,
  });
});

export const listApplications = serviceHandler(listApplicationsSchema, async (req, res) => {
  const userId = req.user.id;
  const { limit, offset, page, size } = req.pagination;

  const [total, applications] = await Promise.all([
    db.$count(
      models.applications,
      and(eq(models.applications.userId, userId), isNull(models.applications.deletedAt))
    ),
    db.query.applications.findMany({
      where: and(eq(models.applications.userId, userId), isNull(models.applications.deletedAt)),
      orderBy: desc(models.applications.createdAt),
      with: {
        questionnaireResponse: {
          with: { questionResponses: { columns: { id: true }, limit: 1 } },
          columns: {
            id: true,
            status: true,
            completionPercentage: true,
            submittedAt: true,
            createdAt: true,
          },
        },
        user: {
          columns: {
            id: true,
            isTaxAgentVerificationCompleted: true,
            taxAgentVerificationCompletedAt: true,
          },
        },
      },
      columns: { applicationNoTrigramHashes: false, hashedApplicationNo: false },
      limit,
      offset,
    }),
  ]);

  if (applications.length === 0) {
    return res.data('Applications retrieved', [], { page, size, total });
  }

  // Bulk compute steps for all applications in page
  const appIds = applications.map((a) => a.id);

  // Questionnaire responses per application (pick latest by updatedAt)
  const qResponses = await db.query.questionnaireResponses.findMany({
    where: and(
      isNull(models.questionnaireResponses.deletedAt),
      inArray(models.questionnaireResponses.applicationId, appIds)
    ),
    columns: {
      id: true,
      applicationId: true,
      status: true,
      completionPercentage: true,
      updatedAt: true,
    },
  });
  const latestQRespByApp = new Map<string, (typeof qResponses)[number]>();
  for (const r of qResponses) {
    const prev = latestQRespByApp.get(r.applicationId);
    if (!prev || (r.updatedAt && prev.updatedAt && r.updatedAt > prev.updatedAt)) {
      latestQRespByApp.set(r.applicationId, r);
    }
  }

  // Document categories and file links per application
  const docCats = await db.query.applicationDocumentCategories.findMany({
    where: and(
      inArray(models.applicationDocumentCategories.applicationId, appIds),
      ne(models.applicationDocumentCategories.status, 'withdrawn'),
      isNull(models.applicationDocumentCategories.deletedAt)
    ),
    columns: { id: true, applicationId: true, isRequired: true, status: true },
  });
  const catIds = docCats.map((c) => c.id);
  const fileLinks = catIds.length
    ? await db.query.applicationDocumentCategoryFiles.findMany({
        where: inArray(
          models.applicationDocumentCategoryFiles.applicationDocumentCategoryId,
          catIds
        ),
        columns: { applicationDocumentCategoryId: true, fileId: true },
      })
    : [];
  const filesByCat = new Map<string, number>();
  for (const link of fileLinks) {
    filesByCat.set(
      link.applicationDocumentCategoryId,
      (filesByCat.get(link.applicationDocumentCategoryId) ?? 0) + 1
    );
  }
  const requiredCountByApp = new Map<string, number>();
  const uploadedRequiredByApp = new Map<string, number>();
  let uploadOptionalByApp = new Map<string, number>();

  for (const c of docCats) {
    if (c.isRequired) {
      requiredCountByApp.set(c.applicationId, (requiredCountByApp.get(c.applicationId) ?? 0) + 1);
      if (filesByCat.get(c.id) && c.status !== 'rejected') {
        uploadedRequiredByApp.set(
          c.applicationId,
          (uploadedRequiredByApp.get(c.applicationId) ?? 0) + 1
        );
      }
    } else {
      if (filesByCat.get(c.id) && c.status !== 'rejected') {
        uploadOptionalByApp.set(
          c.applicationId,
          (uploadOptionalByApp.get(c.applicationId) ?? 0) + 1
        );
      }
    }
  }
  const applicationChats =
    appIds.length > 0
      ? await db.query.chats.findMany({
          where: and(
            inArray(models.chats.applicationId, appIds),
            eq(models.chats.senderType, 'admin'),
            eq(models.chats.isRead, false),
            isNull(models.chats.readAt),
            isNull(models.chats.deletedAt)
          ),
          columns: { id: true, applicationId: true },
        })
      : [];

  const chatsOnApp = new Map<string, number>();
  for (const chat of applicationChats) {
    if (!chat.applicationId) continue;
    chatsOnApp.set(chat.applicationId, (chatsOnApp.get(chat.applicationId) ?? 0) + 1);
  }

  // Get status history for all applications for currentStep calculation
  const allStatusHistory =
    appIds.length > 0
      ? await db.query.applicationStatusHistories.findMany({
          where: inArray(models.applicationStatusHistories.applicationId, appIds),
          columns: { applicationId: true, status: true },
        })
      : [];

  const statusHistoryByApp = new Map<string, Array<{ status: string }>>();
  for (const hist of allStatusHistory) {
    const existing = statusHistoryByApp.get(hist.applicationId) || [];
    existing.push({ status: hist.status });
    statusHistoryByApp.set(hist.applicationId, existing);
  }

  // Group document categories by applicationId for currentStep calculation
  const docCatsByApp = new Map<string, Array<{ status: string | null }>>();
  for (const docCat of docCats) {
    const existing = docCatsByApp.get(docCat.applicationId) || [];
    existing.push({ status: docCat.status });
    docCatsByApp.set(docCat.applicationId, existing);
  }

  const enriched = await Promise.all(
    applications.map(async (app) => {
      const q = latestQRespByApp.get(app.id);
      const requiredDocsCount = requiredCountByApp.get(app.id) ?? 0;
      const uploadRequiredDocsCount = uploadedRequiredByApp.get(app.id) ?? 0;
      const uploadOptionalDocsCount = uploadOptionalByApp.get(app.id) ?? 0;

      // Check if application has chats
      const hasUnreadMessages = (chatsOnApp.get(app.id) ?? 0) > 0;
      const unreadMessagesCount = chatsOnApp.get(app.id) ?? 0;

      // Get currentStep for this application
      const appDocCats = docCatsByApp.get(app.id) || [];
      const appStatusHistory = statusHistoryByApp.get(app.id) || [];
      const currentStep = await determineCurrentStep(app, appDocCats, appStatusHistory);

      const appStatusHistorySet = new Set(appStatusHistory.map((h) => h.status));

      const docsCompleted =
        uploadRequiredDocsCount === requiredDocsCount &&
        appStatusHistorySet.has(applicationStatuses.DOCUMENTS_UPLOADED);

      const docsProgress =
        requiredDocsCount === 0 && appStatusHistorySet.has(applicationStatuses.DOCUMENTS_UPLOADED)
          ? 100
          : Math.round((uploadRequiredDocsCount / requiredDocsCount) * 100);

      const isQuestionnaireSubmitted =
        app.questionnaireResponse?.status === applicationStatuses.SUBMITTED;
      const isDocsUploaded =
        appStatusHistorySet.has(applicationStatuses.DOCUMENTS_UPLOADED) &&
        app.status !== applicationStatuses.DOCUMENTS_UPLOAD_PENDING;
      const isDocsVerified = appStatusHistorySet.has(applicationStatuses.DOCUMENTS_VERIFIED);
      const isAppReviewCompleted = appStatusHistorySet.has(applicationStatuses.REVIEWED);
      const isRefundCompleted = appStatusHistorySet.has(applicationStatuses.REFUND_COMPLETED);

      const steps = [
        {
          key: stepKeys.QUESTIONNAIRE,
          title: 'Questionnaire Submitted',
          status: isQuestionnaireSubmitted,
          data: {
            questionnaireResponseId: app.questionnaireResponse?.id ?? null,
            createdAt: app.questionnaireResponse?.createdAt ?? null,
            submittedAt: app.questionnaireResponse?.submittedAt ?? null,
            progress: q?.completionPercentage ?? 0,
            status:
              app.questionnaireResponse?.status === 'submitted'
                ? 'completed'
                : app?.questionnaireResponse?.questionResponses?.length
                  ? 'in_progress'
                  : 'not_started',
          },
          stageIndex: 0,
        },
        {
          key: stepKeys.DOCUMENTS,
          title: 'Document Upload',
          status: isDocsUploaded,
          data: {
            requiredCount: requiredDocsCount,
            uploadedRequired: uploadRequiredDocsCount,
            progress: docsProgress,
            status: docsCompleted
              ? 'completed'
              : uploadRequiredDocsCount > 0 || uploadOptionalDocsCount > 0
                ? 'in_progress'
                : 'not_started',
          },
          stageIndex: 1,
        },
        {
          key: stepKeys.AGENT_ACTIVATION,
          title: 'Agent Activation',
          status:
            isQuestionnaireSubmitted &&
            isDocsUploaded &&
            (app.user.isTaxAgentVerificationCompleted ||
              app.status === applicationStatuses.REFUND_COMPLETED),
          data: {
            status: app.user.isTaxAgentVerificationCompleted ? 'completed' : 'pending',
          },
          stageIndex: 2,
        },
        {
          key: stepKeys.REVIEW,
          title: 'Review By Tax Agent',
          status: isDocsVerified,
          data: {
            status: isDocsVerified ? 'completed' : 'pending',
          },
          stageIndex: 3,
        },
        {
          key: stepKeys.PROCESSING,
          title: 'Revenue Processing Tax Filing',
          status: isAppReviewCompleted,
          data: {
            status: isAppReviewCompleted ? 'completed' : 'pending',
          },
          stageIndex: 4,
        },
        {
          key: stepKeys.REFUND,
          title: 'Refund Approved',
          status: isRefundCompleted,
          data: {
            status: isRefundCompleted ? 'completed' : 'pending',
          },
          stageIndex: 5,
        },
      ];

      const application = {
        id: app.id,
        applicationNo: app.applicationNo,
        year: app.year,
        status: app.status,
        isAmendment: app.isAmendment,
        parentId: app.parentId,
        createdAt: app.createdAt,
        hasUnreadMessages,
        unreadMessagesCount,
        currentStep,
      };

      return {
        ...application,
        steps,
      };
    })
  );

  return res.data('Applications retrieved', enriched, { page, size, total });
});

// Admin: list applications with filters
export const adminListApplications = serviceHandler(
  listApplicationsAdminSchema,
  async (req, res) => {
    const { limit, offset, page, size } = req.pagination;
    const { status, year, userId, search, paymentStatus, ignoreRefundCompleted } = req.query;

    const filters: (SQL | undefined)[] = [isNull(models.applications.deletedAt)];

    if (ignoreRefundCompleted === 'true')
      filters.push(not(eq(models.applications.status, applicationStatuses.REFUND_COMPLETED)));

    if (status) filters.push(eq(models.applications.status, status));
    if (year) filters.push(eq(models.applications.year, year));
    if (userId) filters.push(eq(models.applications.userId, userId));
    if (search) {
      const searchTerm = search.toLowerCase();

      // For application number, use trigram search with exact matching
      const searchHashes = hashSearchKeyword(searchTerm);

      // For user fields, use trigram search with 60% similarity threshold
      const minMatches = Math.ceil(searchHashes.length * 0.6);

      filters.push(
        or(
          // Fuzzy trigram search for application number
          sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.applications.applicationNoTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`,
          // Fuzzy trigram search for email
          sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.emailTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`,
          // Fuzzy trigram search for phone
          sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.phoneTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`,
          // Fuzzy trigram search for PPS number
          sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.ppsNumberTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`,
          // Fuzzy trigram search for name
          sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.nameTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`
        )
      );
    }
    if (paymentStatus) {
      filters.push(eq(models.applications.status, applicationStatuses.REFUND_COMPLETED));
      filters.push(eq(models.applications.paymentStatus, paymentStatus));
    } 

    // For search functionality with user fields, we need to use a join
    let query = db
      .select({
        id: models.applications.id,
        applicationNo: models.applications.applicationNo,
        status: models.applications.status,
        paymentStatus: models.applications.paymentStatus,
        finalAmount: models.applications.finalAmount,
        year: models.applications.year,
        createdAt: models.applications.createdAt,
        updatedAt: models.applications.updatedAt,
        user: {
          id: models.users.id,
          name: models.users.name,
          email: models.users.email,
          ppsNumber: models.users.ppsNumber,
          dob: models.users.dob,
          profession: models.users.profession,
          phone: models.users.phone,
          eircode: models.users.eircode,
          address: models.users.address,
          maritalStatus: models.users.maritalStatus,
        },
      })
      .from(models.applications)
      .leftJoin(models.users, eq(models.applications.userId, models.users.id))
      .where(and(...filters.filter(Boolean)));

    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(models.applications)
      .leftJoin(models.users, eq(models.applications.userId, models.users.id))
      .where(and(...filters.filter(Boolean)));

    // if (filters.length) {
    //   const whereClause = and(...filters.filter(Boolean));
    //   query = query.where(whereClause);
    //   countQuery = countQuery.where(whereClause);
    // }

    const [totalResult, rows] = await Promise.all([
      countQuery,
      query.orderBy(desc(models.applications.createdAt)).limit(limit).offset(offset),
    ]);

    const total = totalResult[0]?.count ?? 0;

    // Get questionnaire responses for the applications
    const appIds = rows.map((a) => a.id);
    const questionnaireResponses = appIds.length
      ? await db.query.questionnaireResponses.findMany({
          where: and(
            isNull(models.questionnaireResponses.deletedAt),
            inArray(models.questionnaireResponses.applicationId, appIds)
          ),
          columns: { id: true, status: true, completionPercentage: true, applicationId: true },
        })
      : [];

    const qRespByApp = new Map<string, (typeof questionnaireResponses)[number]>();
    for (const qResp of questionnaireResponses) {
      qRespByApp.set(qResp.applicationId, qResp);
    }

    // Get application chats for hasNotes field
    const applicationChats =
      appIds.length > 0
        ? await db
            .select({ id: models.chats.id, applicationId: models.chats.applicationId })
            .from(models.chats)
            .leftJoin(
              models.adminReadChats,
              and(
                eq(models.adminReadChats.chatId, models.chats.id),
                eq(models.adminReadChats.adminId, req.admin.id)
              )
            )
            .where(
              and(
                inArray(models.chats.applicationId, appIds),
                isNull(models.adminReadChats.chatId),
                eq(models.chats.senderType, 'user'),
                sql`admin_read_chats.chat_id IS NULL`
              )
            )
        : [];

    const chatsOnApp = new Map<string, number>();
    for (const chat of applicationChats) {
      if (!chat.applicationId) continue;
      chatsOnApp.set(chat.applicationId, (chatsOnApp.get(chat.applicationId) ?? 0) + 1);
    }

    return res.data(
      'Applications retrieved',
      rows.map((a) => ({
        id: a.id,
        applicationNo: a.applicationNo,
        status: formatText(a.status),
        paymentStatus: formatText(a.paymentStatus),
        finalAmount: a.finalAmount,
        year: a.year,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        user: a.user,
        questionnaire: qRespByApp.get(a.id) || null,
        hasUnreadMessages: (chatsOnApp.get(a.id) ?? 0) > 0,
        unreadMessagesCount: chatsOnApp.get(a.id) ?? 0,
      })),
      { page, size, total }
    );
  }
);
// Admin: list applications of a particular user
export const applicationListOfUser = serviceHandler(
  listApplicationsOfUserSchema,
  async (req, res) => {
    const { limit, offset, page, size } = req.pagination;
    const { userId, status } = req.query;
    const filters: (SQL | undefined)[] = [isNull(models.applications.deletedAt)];

    if (!userId) {
      throw new ApiError('userId is required', 400);
    } else {
      filters.push(eq(models.applications.userId, userId));
    }

    if (status) filters.push(eq(models.applications.status, status));

    const where = filters.length ? and(...filters.filter(Boolean)) : undefined;

    const [total, rows] = await Promise.all([
      db.$count(models.applications, where),
      db.query.applications.findMany({
        where,
        columns: { applicationNoTrigramHashes: false, hashedApplicationNo: false },
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        limit,
        offset,
      }),
    ]);

    return res.data('User Applications retrieved', rows, { page, size, total });
  }
);

//User : Claim History - User applications list with status refund_completed and payment_status paid
export const claimHistory = serviceHandler(listApplicationsSchema, async (req, res) => {
  const userId = req.user.id;
  const { limit, offset, page, size } = req.pagination;

  const filters: (SQL | undefined)[] = [
    eq(models.applications.userId, userId),
    eq(models.applications.status, applicationStatuses.REFUND_COMPLETED),
    eq(models.applications.paymentStatus, paymentStatuses.COMPLETED),
    isNull(models.applications.deletedAt),
  ];

  const where = filters.length ? and(...filters.filter(Boolean)) : undefined;

  const [total, applications] = await Promise.all([
    db.$count(models.applications, where),
    db.query.applications.findMany({
      where,
      orderBy: desc(models.applications.createdAt),

      limit,
      offset,
    }),
  ]);
  const appIds = applications.map((a) => a.id);

  const onlinePayments = await db.query.payments.findMany({
    where: and(
      inArray(models.payments.applicationId, appIds),
      eq(models.payments.status, paymentStatuses.COMPLETED),
      isNull(models.payments.deletedAt)
    ),
    columns: {
      id: true,
      applicationId: true,
      amount: true,
      status: true,
      createdAt: true,
      paymentMethod: true,
    },
    orderBy: desc(models.payments.createdAt),
  });
  // Create maps for the latest payment per application
  const onlinePaymentByApp = new Map<string, (typeof onlinePayments)[0]>();

  // Find the latest online payment for each application
  for (const payment of onlinePayments) {
    if (payment.applicationId && !onlinePaymentByApp.has(payment.applicationId)) {
      onlinePaymentByApp.set(payment.applicationId, payment);
    }
  }

  // Enrich applications with payment data
  const enrichedApplications = applications.map((app) => {
    const onlinePayment = onlinePaymentByApp.get(app.id);

    let paymentData = null;
    let paymentMethod = null;

    if (onlinePayment) {
      paymentData = {
        id: onlinePayment.id,
        amount: onlinePayment.amount,
        status: onlinePayment.status,
        createdAt: onlinePayment.createdAt,
      };
      paymentMethod = onlinePayment.paymentMethod;
    }

    return {
      ...app,
      payment: paymentData,
      paymentMethod,
    };
  });

  return res.data('Applications retrieved', enrichedApplications, { page, size, total });
});
export const getApplicationDetails = serviceHandler(getApplicationSchema, async (req, res) => {
  const { applicationId } = req.params as { applicationId: string };

  // Load single application with minimal relations required for steps
  const app = await db.query.applications.findFirst({
    where: and(isNull(models.applications.deletedAt), eq(models.applications.id, applicationId)),
    columns: { applicationNoTrigramHashes: false, hashedApplicationNo: false },
    with: {
      questionnaireResponse: {
        with: { questionResponses: { columns: { id: true }, limit: 1 } },
        columns: {
          id: true,
          status: true,
          completionPercentage: true,
          submittedAt: true,
          createdAt: true,
        },
      },
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          ppsNumber: true,
          dob: true,
          profession: true,
          phone: true,
          eircode: true,
          address: true,
          maritalStatus: true,
          isTaxAgentVerificationCompleted: true,
          taxAgentVerificationCompletedAt: true,
          parentId: true,
        },
        with: { agentActivation: true },
      },
      taxReturnDocument: {
        columns: { id: true, key: true, fileName: true, mimeType: true, uploadedAt: true },
      },
      applicationStatusHistories: {
        columns: { status: true, createdAt: true },
        orderBy: (t, { asc }) => [asc(t.createdAt)],
      },
    },
  });

  if (!app) throw new ApiError('Application not found', 404);

  // Questionnaire responses for this application (pick latest by updatedAt)
  const qResponses = await db.query.questionnaireResponses.findMany({
    where: and(
      isNull(models.questionnaireResponses.deletedAt),
      eq(models.questionnaireResponses.applicationId, applicationId)
    ),
    columns: {
      id: true,
      applicationId: true,
      status: true,
      completionPercentage: true,
      updatedAt: true,
    },
  });
  let latestQResp: (typeof qResponses)[number] | undefined;
  for (const r of qResponses) {
    if (
      !latestQResp ||
      (r.updatedAt && latestQResp.updatedAt && r.updatedAt > latestQResp.updatedAt)
    ) {
      latestQResp = r;
    }
  }

  // Document categories and file links for this application
  const docCats = await db.query.applicationDocumentCategories.findMany({
    where: and(
      eq(models.applicationDocumentCategories.applicationId, applicationId),
      not(eq(models.applicationDocumentCategories.status, 'withdrawn')),
      isNull(models.applicationDocumentCategories.deletedAt)
    ),
    columns: {
      id: true,
      applicationId: true,
      isRequired: true,
      status: true,
      isAdditionalDocument: true,
    },
  });
  const catIds = docCats.map((c) => c.id);
  const fileLinks = catIds.length
    ? await db.query.applicationDocumentCategoryFiles.findMany({
        where: inArray(
          models.applicationDocumentCategoryFiles.applicationDocumentCategoryId,
          catIds
        ),
        columns: { applicationDocumentCategoryId: true, fileId: true },
      })
    : [];

  const filesByCat = new Map<string, number>();
  for (const link of fileLinks) {
    filesByCat.set(
      link.applicationDocumentCategoryId,
      (filesByCat.get(link.applicationDocumentCategoryId) ?? 0) + 1
    );
  }

  const requiredDocsCount = docCats.filter((c) => c.isRequired).length;
  let uploadRequiredDocsCount = 0;
  let uploadOptionalDocsCount = 0;
  let isAllRequiredDocsUploaded = await areRequiredDocumentsComplete(applicationId, true, true);
  for (const c of docCats) {
    if (c.isRequired && filesByCat.get(c.id) && c.status !== 'rejected') uploadRequiredDocsCount++;
    if (!c.isRequired && filesByCat.get(c.id) && c.status !== 'rejected') uploadOptionalDocsCount++;
  }
  // Calculate upload pending documents count (documents with 'pending' status and no files)
  const pendingDocsCount = docCats.filter(
    (doc) => doc.status === 'pending' && !filesByCat.get(doc.id) && !doc.isAdditionalDocument
  ).length;
  const pendingAdditionalDocsCount = docCats.filter(
    (doc) => doc.status === 'pending' && !filesByCat.get(doc.id) && doc.isAdditionalDocument
  ).length;
  const uploadPendingDocumentsCount = pendingDocsCount + pendingAdditionalDocsCount;

  // Calculate unread messages count for this application
  let unreadMessagesCount = 0;
  if (req.admin) {
    // For admin: count user messages that haven't been read by this admin
    const unreadChats = await db
      .select({ id: models.chats.id })
      .from(models.chats)
      .leftJoin(
        models.adminReadChats,
        and(
          eq(models.adminReadChats.chatId, models.chats.id),
          eq(models.adminReadChats.adminId, req.admin.id)
        )
      )
      .where(
        and(
          eq(models.chats.applicationId, applicationId),
          isNull(models.chats.deletedAt),
          eq(models.chats.senderType, 'user'),
          sql`admin_read_chats.chat_id IS NULL`
        )
      );
    unreadMessagesCount = unreadChats.length;
  } else if (req.user) {
    // For user: count admin messages they haven't read
    const unreadChats = await db.query.chats.findMany({
      where: and(
        eq(models.chats.applicationId, applicationId),
        isNull(models.chats.deletedAt),
        eq(models.chats.senderType, 'admin'),
        eq(models.chats.isRead, false),
        isNull(models.chats.readAt)
      ),
      columns: { id: true },
    });
    unreadMessagesCount = unreadChats.length;
  }

  // Get application status history for currentStep logic
  const statusHistory = app.applicationStatusHistories;

  // Determine current step using reusable function
  const currentStep = await determineCurrentStep(app, docCats, statusHistory);

  const appStatusHistorySet = new Set(statusHistory.map((h) => h.status));
  const isQuestionnaireSubmitted =
    app.questionnaireResponse?.status === applicationStatuses.SUBMITTED;
  const isDocsUploaded =
    appStatusHistorySet.has(applicationStatuses.DOCUMENTS_UPLOADED) &&
    app.status !== applicationStatuses.DOCUMENTS_UPLOAD_PENDING;
  const isDocsVerified = appStatusHistorySet.has(applicationStatuses.DOCUMENTS_VERIFIED);
  const isAppReviewCompleted = appStatusHistorySet.has(applicationStatuses.REVIEWED);
  const isRefundCompleted = appStatusHistorySet.has(applicationStatuses.REFUND_COMPLETED);

  const docsCompleted =
    uploadRequiredDocsCount === requiredDocsCount &&
    appStatusHistorySet.has(applicationStatuses.DOCUMENTS_UPLOADED);

  const docsProgress =
    requiredDocsCount === 0 && appStatusHistorySet.has(applicationStatuses.DOCUMENTS_UPLOADED)
      ? 100
      : Math.round((uploadRequiredDocsCount / requiredDocsCount) * 100);

  if (
    isAllRequiredDocsUploaded &&
    appStatusHistorySet.has(applicationStatuses.DOCUMENTS_UPLOADED) &&
    !appStatusHistorySet.has(applicationStatuses.DOCUMENTS_UPLOAD_PENDING)
  ) {
    isAllRequiredDocsUploaded = false;
  }

  const steps = [
    {
      key: stepKeys.QUESTIONNAIRE,
      title: 'Questionnaire Submitted',
      status: isQuestionnaireSubmitted,
      data: {
        questionnaireResponseId: app.questionnaireResponse?.id ?? null,
        createdAt: app.questionnaireResponse?.createdAt ?? null,
        submittedAt: app.questionnaireResponse?.submittedAt ?? null,
        progress: latestQResp?.completionPercentage ?? 0,
        status:
          app.questionnaireResponse?.status === 'submitted'
            ? 'completed'
            : app?.questionnaireResponse?.questionResponses?.length
              ? 'in_progress'
              : 'not_started',
      },
      stageIndex: 0,
    },
    {
      key: stepKeys.DOCUMENTS,
      title: 'Document Upload',
      status: isDocsUploaded,
      data: {
        requiredCount: requiredDocsCount,
        uploadedRequired: uploadRequiredDocsCount,
        progress: docsProgress,
        status: docsCompleted
          ? 'completed'
          : uploadRequiredDocsCount > 0 || uploadOptionalDocsCount > 0
            ? 'in_progress'
            : 'not_started',
      },
      stageIndex: 1,
    },
    {
      key: stepKeys.AGENT_ACTIVATION,
      title: 'Agent Activation',
      status:
        isQuestionnaireSubmitted &&
        isDocsUploaded &&
        (app.user.isTaxAgentVerificationCompleted ||
          app.status === applicationStatuses.REFUND_COMPLETED),
      data: {
        status: app.user.isTaxAgentVerificationCompleted ? 'completed' : 'pending',
      },
      stageIndex: 2,
    },
    {
      key: stepKeys.REVIEW,
      title: 'Review by Tax Agent',
      status: isDocsVerified,
      data: {
        status: isDocsVerified ? 'completed' : 'pending',
      },
      stageIndex: 3,
    },
    {
      key: stepKeys.PROCESSING,
      title: 'Revenue Processing Tax Filing',
      status: isAppReviewCompleted,
      data: {
        status: isAppReviewCompleted ? 'completed' : 'pending',
      },
      stageIndex: 4,
    },
    {
      key: stepKeys.REFUND,
      title: 'Refund Approved',
      status: isRefundCompleted,
      data: {
        status: isRefundCompleted ? 'completed' : 'pending',
      },
      stageIndex: 5,
    },
  ];

  let taxReturnDocument: {
    filePath: string;
    id: string;
    key: string;
    fileName: string | null;
    mimeType: string | null;
    uploadedAt: string | null;
  } | null = null;

  if (app.taxReturnDocument && app.taxReturnDocument.key) {
    try {
      const url = await getPresignedGetObjectUrl(app.taxReturnDocument.key);
      taxReturnDocument = { ...app.taxReturnDocument, filePath: url };
    } catch (err) {
      console.warn('Failed to generate presigned URL for key:', app.taxReturnDocument.key, err);
    }
  }

  const application = {
    // id: app.id,
    // applicationNo: app.applicationNo,
    // year: app.year,
    // status: app.status,
    // isAmendment: app.isAmendment,
    // parentId: app.parentId,
    // createdAt: app.createdAt,
    ...app,
    isDocumentReviewCompleted: app.applicationStatusHistories.some(
      (h) => h.status === applicationStatuses.DOCUMENTS_VERIFIED
    ),
    isApplicationReviewCompleted: app.applicationStatusHistories.some(
      (h) => h.status === applicationStatuses.REVIEWED
    ),
    isDocumentsUploaded: isAllRequiredDocsUploaded,
    currentStep,
    taxReturnDocument,
    user: app.user,
    uploadPendingDocumentsCount,
    hasUnreadMessages: unreadMessagesCount > 0,
    unreadMessagesCount,
  };

  let spouse = null;
  let filters: (SQL | undefined)[] = [];

  // If user is a parent (parentId is null), find child as spouse
  if (!application.user.parentId) {
    filters.push(eq(models.users.parentId, application.user.id));
    filters.push(isNull(models.users.deletedAt));
  } else {
    // If user is a child (has parentId), find parent as spouse
    filters.push(eq(models.users.id, application.user.parentId));
    filters.push(isNull(models.users.deletedAt));
  }

  spouse = await db.query.users.findFirst({
    where: and(...filters),
    columns: {
      id: true,
      name: true,
      email: true,
      ppsNumber: true,
      dob: true,
      profession: true,
      phone: true,
      eircode: true,
      address: true,
      maritalStatus: true,
      isTaxAgentVerificationCompleted: true,
      taxAgentVerificationCompletedAt: true,
      parentId: true,
    },
    with: { agentActivation: true },
  });
  (application.user as any).spouse = spouse;

  return res.success('Application retrieved', { ...application, steps });
});

export const adminGetApplicationDocuments = serviceHandler(
  getApplicationSchema,
  async (req, res) => {
    const { applicationId } = req.params;
    const categories = await db.query.applicationDocumentCategories.findMany({
      where: and(
        eq(models.applicationDocumentCategories.applicationId, applicationId),
        not(eq(models.applicationDocumentCategories.status, 'withdrawn')),
        isNull(models.applicationDocumentCategories.deletedAt)
      ),
      columns: {
        id: true,
        isRequired: true,
        status: true,
        note: true,
        rejectedReason: true,
        isAdditionalDocument: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        applicationDocumentCategoryFiles: {
          with: {
            file: {
              columns: {
                id: true,
                key: true,
                fileName: true,
                mimeType: true,
                fileSize: true,
                uploadedAt: true,
                uploaderType: true,
              },
            },
          },
        },
        documentCategory: { columns: { id: true, name: true } },
      },
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });

    if (!categories || categories.length === 0) {
      return res.success('No document categories found for this application', {
        applicationDocumentsStepData: [],
        applicationDocumentsGrouped: {
          toBeReviewed: [],
          pending: [],
          accepted: [],
          rejected: [],
        },
        additionalApplicationDocumentsGrouped: {
          toBeReviewed: [],
          pending: [],
          accepted: [],
          rejected: [],
        },
        applicationDocuments: [],
        uploadPendingDocumentsCount: 0,
      });
    }

    // Format: expose category details and a flat files[] array; omit the bridge table data
    const applicationDocuments = categories.map((c) => ({
      id: c.id,
      isRequired: c.isRequired,
      status: c.status,
      note: c.note,
      rejectedReason: c.rejectedReason,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      documentCategory: c.documentCategory,
      isAdditionalDocument: c.isAdditionalDocument,
      files: (c.applicationDocumentCategoryFiles ?? []).map((link) => ({
        id: link.file.id,
        key: link.file.key,
        fileName: link.file.fileName,
        mimeType: link.file.mimeType,
        fileSize: link.file.fileSize,
        uploadedAt: link.file.uploadedAt,
        uploaderType: link.file.uploaderType,
      })),
    }));

    // Attach presigned URLs for all files in a single batched pass for performance
    const allKeys = new Set<string>();
    for (const doc of applicationDocuments) {
      for (const f of doc.files) {
        if (f.key) allKeys.add(f.key);
      }
    }

    const presignedMap = new Map<string, string>();
    // Presign sequentially here to avoid overloading the storage service; could be chunked if needed
    for (const key of allKeys) {
      try {
        const url = await getPresignedGetObjectUrl(key);
        presignedMap.set(key, url);
      } catch (err) {
        console.warn('Failed to generate presigned URL for key:', key, err);
      }
    }

    const applicationDocumentsWithUrls = applicationDocuments.map((doc) => ({
      ...doc,
      files: doc.files.map((file) => {
        const filePath = file.key ? presignedMap.get(file.key) : undefined;
        return filePath ? { ...file, filePath } : file;
      }),
      isUploaded: doc.files.length > 0,
    }));

    // list each documents and the status if it completed or not
    const applicationDocumentsStepData = applicationDocumentsWithUrls.map((doc) => ({
      id: doc.id,
      status: doc.status === 'accepted',
      documentCategory: doc.documentCategory,
    }));

    // Group documents into requested buckets
    const toBeReviewed = applicationDocumentsWithUrls.filter(
      (doc) =>
        doc.status === 'pending' && doc?.files && doc.files.length > 0 && !doc.isAdditionalDocument
    );
    const pending = applicationDocumentsWithUrls.filter(
      (doc) =>
        doc.status === 'pending' &&
        (!doc?.files || doc.files.length === 0) &&
        !doc.isAdditionalDocument
    );
    const accepted = applicationDocumentsWithUrls.filter(
      (doc) => doc.status === 'accepted' && !doc.isAdditionalDocument
    );
    const rejected = applicationDocumentsWithUrls.filter(
      (doc) => doc.status === 'rejected' && !doc.isAdditionalDocument
    );

    // Group Additional documents into requested buckets
    const toBeReviewedAdditionalDoc = applicationDocumentsWithUrls.filter(
      (doc) =>
        doc.status === 'pending' && doc?.files && doc.files.length > 0 && doc.isAdditionalDocument
    );
    const pendingAdditionalDoc = applicationDocumentsWithUrls.filter(
      (doc) =>
        doc.status === 'pending' &&
        (!doc?.files || doc.files.length === 0) &&
        doc.isAdditionalDocument
    );
    const acceptedAdditionalDoc = applicationDocumentsWithUrls.filter(
      (doc) => doc.status === 'accepted' && doc.isAdditionalDocument
    );
    const rejectedAdditionalDoc = applicationDocumentsWithUrls.filter(
      (doc) => doc.status === 'rejected' && doc.isAdditionalDocument
    );

    const result = {
      applicationDocumentsStepData,
      applicationDocumentsGrouped: {
        toBeReviewed,
        pending,
        accepted,
        rejected,
      },
      additionalApplicationDocumentsGrouped: {
        toBeReviewed: toBeReviewedAdditionalDoc,
        pending: pendingAdditionalDoc,
        accepted: acceptedAdditionalDoc,
        rejected: rejectedAdditionalDoc,
      },
      applicationDocuments: applicationDocumentsWithUrls,
      uploadPendingDocumentsCount: pending.length + pendingAdditionalDoc.length,
    };

    return res.success('Application documents retrieved', result);
  }
);

// Build step objects similar to the UI: 6 steps
type StepKey =
  | typeof stepKeys.QUESTIONNAIRE
  | typeof stepKeys.DOCUMENTS
  | typeof stepKeys.AGENT_ACTIVATION
  | typeof stepKeys.REVIEW
  | typeof stepKeys.PROCESSING
  | typeof stepKeys.REFUND;

export const getApplicationStep = serviceHandler(getApplicationStepSchema, async (req, res) => {
  const userId = req.user.id;
  const { applicationId, key } = req.params as { applicationId: string; key: StepKey };

  const app = await db.query.applications.findFirst({
    where: and(
      eq(models.applications.id, applicationId),
      eq(models.applications.userId, userId),
      isNull(models.applications.deletedAt)
    ),
    columns: {
      deletedAt: false,
      taxReturnDocumentId: false,
      taxReturnDocumentUploadedBy: false,
      parentId: false,
      applicationNoTrigramHashes: false,
      hashedApplicationNo: false,
    },
    with: {
      taxReturnDocument: {
        columns: { id: true, key: true, fileName: true, mimeType: true, uploadedAt: true },
      },
    },
  });
  if (!app) throw new ApiError('Application not found', 404);

  switch (key) {
    case stepKeys.QUESTIONNAIRE: {
      const qResp = await db.query.questionnaireResponses.findFirst({
        where: and(
          isNull(models.questionnaireResponses.deletedAt),
          eq(models.questionnaireResponses.applicationId, applicationId)
        ),
        columns: {
          id: true,
          status: true,
          completionPercentage: true,
          submittedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        with: {
          currentCategory: {
            columns: { id: true, name: true },
            with: { icon: { columns: { key: true } } },
          },
        },
      });
      return res.success('Questionnaire step retrieved successfully', {
        stepType: stepKeys.QUESTIONNAIRE,
        stepData: { ...qResp, status: qResp?.status === 'submitted' },
        application: app,
      });
    }

    case stepKeys.DOCUMENTS:
    case stepKeys.REVIEW: {
      const categories = await db.query.applicationDocumentCategories.findMany({
        where: and(
          eq(models.applicationDocumentCategories.applicationId, applicationId),
          isNull(models.applicationDocumentCategories.deletedAt),
          not(eq(models.applicationDocumentCategories.status, 'withdrawn'))
        ),
        columns: {
          id: true,
          isRequired: true,
          status: true,
          note: true,
          rejectedReason: true,
          isAdditionalDocument: true,
          createdAt: true,
          updatedAt: true,
        },
        with: {
          applicationDocumentCategoryFiles: {
            with: {
              file: {
                columns: {
                  id: true,
                  key: true,
                  fileName: true,
                  mimeType: true,
                  fileSize: true,
                  uploadedAt: true,
                },
              },
            },
          },
          documentCategory: { columns: { id: true, name: true } },
        },
        orderBy: (t, { asc }) => [asc(t.createdAt)],
      });

      // Format: expose category details and a flat files[] array; omit the bridge table data
      const applicationDocuments = categories.map((c) => ({
        id: c.id,
        isRequired: c.isRequired,
        status: c.status,
        note: c.note,
        rejectedReason: c.rejectedReason,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        documentCategory: c.documentCategory,
        isAdditionalDocument: c.isAdditionalDocument,
        files: (c.applicationDocumentCategoryFiles ?? []).map((link) => ({
          id: link.file.id,
          key: link.file.key,
          fileName: link.file.fileName,
          mimeType: link.file.mimeType,
          fileSize: link.file.fileSize,
          uploadedAt: link.file.uploadedAt,
        })),
      }));

      // Attach presigned URLs for all files in a single batched pass for performance
      const allKeys = new Set<string>();
      for (const doc of applicationDocuments) {
        for (const f of doc.files) {
          if (f.key) allKeys.add(f.key);
        }
      }

      const presignedMap = new Map<string, string>();
      // Presign sequentially here to avoid overloading the storage service; could be chunked if needed
      for (const key of allKeys) {
        try {
          const url = await getPresignedGetObjectUrl(key);
          presignedMap.set(key, url);
        } catch (err) {
          console.warn('Failed to generate presigned URL for key:', key, err);
        }
      }

      const applicationDocumentsWithUrls = applicationDocuments.map((doc) => ({
        ...doc,
        files: doc.files.map((file) => {
          const filePath = file.key ? presignedMap.get(file.key) : undefined;
          return filePath ? { ...file, filePath } : file;
        }),
      }));

      return res.success(
        `${key.charAt(0).toUpperCase() + key.slice(1)} step retrieved successfully`,
        {
          stepType: key,
          stepData: {
            applicationDocumentsGrouped: applicationDocumentsWithUrls.filter(
              (doc) => !doc.isAdditionalDocument
            ),
            additionalApplicationDocumentsGrouped: applicationDocumentsWithUrls.filter(
              (doc) => doc.isAdditionalDocument
            ),
            uploadPendingDocumentsCount: applicationDocumentsWithUrls.filter(
              (doc) => doc.status === 'pending' || doc.status === 'rejected'
            ).length,
            isDocumentUploadPending: !!applicationDocumentsWithUrls.filter(
              (doc) => doc.status === 'pending' || doc.status === 'rejected'
            ).length,
          },
          application: app,
        }
      );
    }

    case stepKeys.AGENT_ACTIVATION: {
      return res.success('Agent activation step retrieved successfully', {
        stepType: stepKeys.AGENT_ACTIVATION,
        stepData: {
          status: req.user.isTaxAgentVerificationCompleted,
          taxAgentVerificationCompletedAt: req.user.taxAgentVerificationCompletedAt,
        },
        application: app,
      });
    }

    case stepKeys.PROCESSING: {
      return res.success('Processing step retrieved successfully', {
        stepType: stepKeys.PROCESSING,
        stepData: {
          status:
            app.status !== applicationStatuses.DRAFT &&
            app.status !== applicationStatuses.SUBMITTED &&
            app.status !== applicationStatuses.DOCUMENTS_UPLOADED &&
            app.status !== applicationStatuses.REVIEWED,
        },
        application: app,
      });
    }

    case stepKeys.REFUND: {
      const latestOfflineRequest = await db.query.offlinePaymentRequests.findFirst({
        where: and(
          eq(models.offlinePaymentRequests.applicationId, applicationId),
          isNull(models.offlinePaymentRequests.deletedAt)
        ),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        columns: {
          ipAddress: false,
          userAgent: false,
          requestId: false,
        },
      });
      const latestPaymentData = await db.query.payments.findFirst({
        where: and(
          eq(models.payments.applicationId, applicationId),
          isNull(models.payments.deletedAt)
        ),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        columns: {
          metadata: false,
        },
      });
      const applicationReview = await db.query.applicationReviews.findFirst({
        where: and(
          isNull(models.applicationReviews.deletedAt),
          eq(models.applicationReviews.applicationId, applicationId)
        ),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      });

      // get the presigned url of the tax return document if available
      let taxReturnDocument: {
        filePath: string;
        id: string;
        key: string;
        fileName: string | null;
        mimeType: string | null;
        uploadedAt: string | null;
      } | null = null;

      if (app.taxReturnDocument && app.taxReturnDocument.key) {
        try {
          const url = await getPresignedGetObjectUrl(app.taxReturnDocument.key);
          taxReturnDocument = { ...app.taxReturnDocument, filePath: url };
        } catch (err) {
          console.warn('Failed to generate presigned URL for key:', app.taxReturnDocument.key, err);
        }
      }

      const application = {
        ...app,
        latestOfflinePaymentRequest: latestOfflineRequest || null,
        latestPayment: latestPaymentData || null,
        taxReturnDocument,
        review: applicationReview || null,
      };
      return res.success('Refund step retrieved successfully', {
        stepType: stepKeys.REFUND,
        stepData: {
          status: app.status === applicationStatuses.REFUND_COMPLETED,
          application,
        },
      });
    }

    default:
      throw new ApiError('Invalid step key', 400);
  }
});

// =======================
// Application Notes (Admin)
// =======================

export const createApplicationNote = serviceHandler(
  createApplicationNoteSchema,
  async (req, res) => {
    const adminId = req.admin.id;
    const { note, applicationId } = req.body;

    // Validate application exists
    const application = await db.query.applications.findFirst({
      where: and(isNull(models.applications.deletedAt), eq(models.applications.id, applicationId)),
      columns: { id: true },
    });
    if (!application) throw new ApiError('Application not found', 404);

    const [created] = await db
      .insert(models.applicationNotes)
      .values({ applicationId, adminId, note })
      .returning();
    const activityLogData = {
      entityName: activityLogEntityNames.application_note,
      entityId: created.id,
      action: 'insert' as const,
      modifiedUserId: req.admin.id,
      oldData: null,
      newData: created,
    };
    await activityLog(activityLogData);
    return res.success('Note added', created);
  }
);

export const listApplicationNotes = serviceHandler(listApplicationNotesSchema, async (req, res) => {
  const { applicationId } = req.params;
  const { limit, offset, page, size } = req.pagination;

  // Validate application exists
  const application = await db.query.applications.findFirst({
    where: and(isNull(models.applications.deletedAt), eq(models.applications.id, applicationId)),
    columns: { id: true },
  });
  if (!application) throw new ApiError('Application not found', 404);

  const notes = await db.query.applicationNotes.findMany({
    where: and(
      isNull(models.applicationNotes.deletedAt),
      eq(models.applicationNotes.applicationId, applicationId)
    ),
    orderBy: desc(models.applicationNotes.createdAt),
    limit,
    offset,
    columns: { applicationId: false, updatedAt: false },
    with: {
      admin: {
        columns: { id: true, name: true, email: true },
      },
    },
  });

  const total = await db.$count(
    models.applicationNotes,
    eq(models.applicationNotes.applicationId, applicationId)
  );

  return res.data('Notes retrieved', notes, { page, size, total });
});

// =======================
// Admin: Calculate and Submit Amounts
// =======================

function computeAmounts({
  refundAmount,
  commissionPercentage,
  vatPercentage,
  discountAmount = 0,
}: {
  refundAmount: number;
  commissionPercentage: number;
  vatPercentage: number;
  discountAmount?: number;
}) {
  // Commission amount is percentage of refundAmount
  const commissionAmount = +(refundAmount * (commissionPercentage / 100)).toFixed(2);
  // VAT on commission
  const vatAmount = +(commissionAmount * (vatPercentage / 100)).toFixed(2);
  const totalCommissionAmount = +(commissionAmount + vatAmount).toFixed(2);
  const finalAmount = +(totalCommissionAmount - (discountAmount || 0)).toFixed(2);
  return {
    refundAmount,
    commissionAmount,
    commissionPercentage,
    totalCommissionAmount,
    vatAmount,
    vatPercentage,
    discountAmount: discountAmount || 0,
    finalAmount,
    flatFee: 0,
  };
}

export const calculateApplicationAmounts = serviceHandler(
  calculateApplicationAmountsSchema,
  async (req, res) => {
    const {
      refundAmount,
      discountAmount = 0,
      flatFee = 0,
    } = req.body as {
      refundAmount: number;
      discountAmount?: number;
      flatFee?: number;
    };

    console.log('Calculating amounts with:', { refundAmount, discountAmount, flatFee });

    if (flatFee && flatFee > 0) {
      // If flat fee is provided, use it as final amount directly
      return res.success('Amounts calculated', {
        refundAmount,
        commissionAmount: 0,
        commissionPercentage: 0,
        totalCommissionAmount: 0,
        vatAmount: 0,
        vatPercentage: 0,
        discountAmount: 0,
        flatFee,
        finalAmount: flatFee - (discountAmount || 0),
      });
    }

    // Load commission and VAT from site contents (assumes single row)
    const sc = await db.query.siteContents.findFirst({
      columns: { commissionPercentage: true, vaPercentage: true },
    });
    if (!sc) throw new ApiError('Site contents not configured', 500);

    const data = computeAmounts({
      refundAmount,
      discountAmount,
      commissionPercentage: sc.commissionPercentage,
      vatPercentage: sc.vaPercentage,
    });
    return res.success('Amounts calculated', data);
  }
);

export const submitApplicationAmounts = serviceHandler(
  submitApplicationAmountsSchema,
  async (req, res) => {
    const {
      applicationId,
      refundAmount,
      discountAmount = 0,
      flatFee = 0,
    } = req.body as {
      applicationId: string;
      refundAmount: number;
      discountAmount?: number;
      flatFee?: number;
    };

    const application = await db.query.applications.findFirst({
      where: and(isNull(models.applications.deletedAt), eq(models.applications.id, applicationId)),
      columns: {
        id: true,
        status: true,
        taxReturnDocumentId: true,
        userId: true,
        applicationNo: true,
      },
      with: {
        applicationStatusHistories: { columns: { status: true } },
        user: {
          columns: {
            id: true,
            email: true,
            name: true,
            fcmToken: true,
            isAppNotificationEnabled: true,
          },
        },
      },
    });
    if (!application) throw new ApiError('Application not found', 404);

    // Block updates once refund is completed
    if (application.status === applicationStatuses.REFUND_COMPLETED) {
      throw new ApiError('Application is already refund completed and cannot be updated', 409);
    }

    // Ensure tax return document is uploaded and confirmed before completing
    let taxDoc = null;
    if (application.taxReturnDocumentId) {
      taxDoc = await db.query.files.findFirst({
        where: and(
          eq(models.files.id, application.taxReturnDocumentId),
          eq(models.files.status, 'active')
        ),
        columns: { id: true, key: true, fileName: true },
      });
    }

    // Ensure all previous steps are completed per status history
    const statusHist = application.applicationStatusHistories;
    const statusSet = new Set(statusHist.map((h) => h.status));

    const requiredStatuses = [
      applicationStatuses.SUBMITTED,
      applicationStatuses.DOCUMENTS_UPLOADED,
      applicationStatuses.DOCUMENTS_VERIFIED,
      applicationStatuses.REVIEWED,
      applicationStatuses.PROCESSING,
    ];
    const missing = requiredStatuses.filter((s) => !statusSet.has(s));
    if (missing.length > 0) {
      throw new ApiError(
        `Prerequisite not met: application must complete prior statuses (${missing
          .map((m) => m)
          .join(', ')})`,
        409
      );
    }

    // And current application status should be processing (post-reviewed)
    if (application.status !== applicationStatuses.PROCESSING) {
      throw new ApiError('Prerequisite not met: application must be in processing state', 409);
    }
    let data = null;
    if (flatFee && flatFee > 0) {
      // If flat fee is provided, use it as final amount directly
      data = {
        refundAmount,
        commissionAmount: 0,
        commissionPercentage: 0,
        totalCommissionAmount: 0,
        vatAmount: 0,
        vatPercentage: 0,
        discountAmount,
        flatFee,
        finalAmount: flatFee - (discountAmount || 0),
      };
    } else {
      // Load site config
      const sc = await db.query.siteContents.findFirst({
        columns: { commissionPercentage: true, vaPercentage: true },
      });
      if (!sc) throw new ApiError('Site contents not configured', 500);

      data = computeAmounts({
        refundAmount,
        discountAmount,
        commissionPercentage: sc.commissionPercentage,
        vatPercentage: sc.vaPercentage,
      });
    }
    // Persist calculated fields and set status to refund_completed with history (transactional)
    const updatedApplication = await db.transaction(async (tx) => {
      const [amountsUpdated] = await tx
        .update(models.applications)
        .set({
          refundAmount: String(data.refundAmount),
          commissionPercentage: String(data.commissionPercentage),
          commissionAmount: String(data.commissionAmount),
          vatPercentage: String(data.vatPercentage),
          vatAmount: String(data.vatAmount),
          totalCommissionAmount: String(data.totalCommissionAmount),
          discountAmount: String(data.discountAmount),
          flatFee: String(data.flatFee),
          finalAmount: String(data.finalAmount),
          updatedAt: new Date(),
          status: applicationStatuses.REFUND_COMPLETED,
          // If finalAmount is 0, mark payment as completed
          paymentStatus: data.finalAmount === 0 ? 'completed' : 'pending',
        })
        .where(eq(models.applications.id, applicationId))
        .returning({
          id: models.applications.id,
          applicationNo: models.applications.applicationNo,
          year: models.applications.year,
          isAmendment: models.applications.isAmendment,
          status: models.applications.status,
          createdAt: models.applications.createdAt,
          updatedAt: models.applications.updatedAt,
          taxReturnDocumentUploadedAt: models.applications.taxReturnDocumentUploadedAt,
        });

      await tx.insert(models.applicationStatusHistories).values({
        applicationId,
        status: applicationStatuses.REFUND_COMPLETED,
      });

      // If finalAmount is 0, create a completed payment record
      if (data.finalAmount === 0) {
        const metadata = {
          customer: {
            name: application.user.name,
            email: application.user.email,
          },
          application: {
            id: application.id,
            applicationNo: amountsUpdated.applicationNo,
            year: amountsUpdated.year,
            isAmendment: amountsUpdated.isAmendment,
            refundAmount: String(data.refundAmount),
            totalCommissionAmount: String(data.totalCommissionAmount),
            commissionPercentage: String(data.commissionPercentage),
            commissionAmount: String(data.commissionAmount),
            vatPercentage: String(data.vatPercentage),
            vatAmount: String(data.vatAmount),
            flatFee: String(data.flatFee),
            discountAmount: String(data.discountAmount),
            finalAmount: String(data.finalAmount),
          },
        };

        await tx
          .insert(models.payments)
          .values({
            applicationId,
            userId: application.userId,
            amount: '0',
            currency: 'EUR',
            paymentMethod: paymentMethods.OTHER,
            status: 'completed',
            transactionId: null,
            transactionNo: `TXN-${generateAlphaNumCode()}`,
            metadata,
          })
          .onConflictDoUpdate({
            target: models.payments.applicationId,
            set: {
              amount: '0',
              status: 'completed',
              paymentMethod: paymentMethods.OTHER,
              transactionNo: `TXN-${generateAlphaNumCode()}`,
              metadata,
            },
          });
      }

      await mail.refundCompleted({
        recipient: application.user.email,
        replacements: {
          name: application.user.name,
          amount: data.refundAmount.toFixed(2),
        },
      });
      // if (application.user.fcmToken) {
      //   await sendNotification({
      //     tokens: [application.user.fcmToken],
      //     payload: {
      //       title: notificationTemplates.refundCompleted.title,
      //       body: notificationTemplates.refundCompleted.body,
      //     },
      //     data: {
      //       type: notificationTemplates.refundCompleted.type,
      //     },
      //   });
      // }
      notificationHandler({
        tokens: application.user.fcmToken?.split(','),
        payload: {
          ...notificationTemplates.refundCompleted,
          body: notificationTemplates.refundCompleted.body.replace(
            'APP_NO',
            application.applicationNo
          ),
        },
        data: {
          type: notificationTemplates.refundCompleted.type,
        },
        userId: application.user.id,
        appNotificationsEnabled: application.user.isAppNotificationEnabled,
      });

      return amountsUpdated;
    });

    const result = {
      id: updatedApplication.id,
      applicationNo: updatedApplication.applicationNo,
      year: updatedApplication.year,
      status: updatedApplication.status,
      isAmendment: updatedApplication.isAmendment,
      createdAt: updatedApplication.createdAt,
      updatedAt: updatedApplication.updatedAt,
      taxReturnDocumentUploadedAt: updatedApplication.taxReturnDocumentUploadedAt,
      refundAmount: data.refundAmount,
      commissionPercentage: data.commissionPercentage,
      commissionAmount: data.commissionAmount,
      vatPercentage: data.vatPercentage,
      vatAmount: data.vatAmount,
      totalCommissionAmount: data.totalCommissionAmount,
      flatFee: data.flatFee,
      discountAmount: data.discountAmount,
      finalAmount: data.finalAmount,
      taxReturnDocument: taxDoc,
    };

    return res.success('Application amounts updated', result);
  }
);

// =======================
// Admin: Application status transitions
// =======================

// Helper: ensure all required docs have at least one file and optionally are accepted (no pending or rejected)
async function areRequiredDocumentsComplete(
  applicationId: string,
  validateStatus: boolean,
  checkRejectionStatusOnly: boolean = false
): Promise<boolean> {
  const requiredCats = await db.query.applicationDocumentCategories.findMany({
    where: and(
      eq(models.applicationDocumentCategories.applicationId, applicationId),
      eq(models.applicationDocumentCategories.isRequired, true),
      not(eq(models.applicationDocumentCategories.status, 'withdrawn')),
      isNull(models.applicationDocumentCategories.deletedAt)
    ),
    columns: { id: true, status: true },
  });
  if (requiredCats.length === 0) return true; // no required documents

  // Check if all required documents are accepted (no pending or rejected) - only if validateStatus is true
  if (validateStatus) {
    if (checkRejectionStatusOnly) {
      const hasAnyRejectedDocsCat = requiredCats.some((cat) => cat.status === 'rejected');
      if (hasAnyRejectedDocsCat) return false;
    } else {
      const hasAnyNonAcceptedDocsCat = requiredCats.some(
        (cat) => cat.status === 'pending' || cat.status === 'rejected'
      );
      if (hasAnyNonAcceptedDocsCat) return false;
    }
  }

  // Check if all required documents have at least one file uploaded
  const catIds = requiredCats.map((c) => c.id);
  const links = await db.query.applicationDocumentCategoryFiles.findMany({
    where: inArray(models.applicationDocumentCategoryFiles.applicationDocumentCategoryId, catIds),
    columns: { applicationDocumentCategoryId: true },
  });
  console.log({ catIds });
  const byCat = new Set(links.map((l) => l.applicationDocumentCategoryId));
  return requiredCats.every((c) => byCat.has(c.id));
}

export const setDocumentsVerifiedStatus = serviceHandler(
  setDocumentsVerifiedStatusSchema,
  async (req, res) => {
    const { applicationId } = req.params as { applicationId: string };

    const app = await db.query.applications.findFirst({
      where: and(isNull(models.applications.deletedAt), eq(models.applications.id, applicationId)),
      with: {
        applicationStatusHistories: { columns: { status: true } },
        user: {
          columns: {
            id: true,
            isTaxAgentVerificationCompleted: true,
            isAppNotificationEnabled: true,
            fcmToken: true,
          },
        },
        // applicationDocumentCategories: { columns: { id: true } },
      },
    });
    if (!app) throw new ApiError('Application not found', 404);

    // Ensure required previous statuses exist in history: documents_uploaded
    const statusHist = app.applicationStatusHistories;
    const statusSet = new Set(statusHist.map((h) => h.status));

    if (!statusSet.has(applicationStatuses.SUBMITTED)) {
      throw new ApiError('Prerequisite not met: application must be submitted', 409);
    }

    if (!statusSet.has(applicationStatuses.DOCUMENTS_UPLOADED)) {
      throw new ApiError('Prerequisite not met: documents must be uploaded', 409);
    }

    if (!app.user.isTaxAgentVerificationCompleted) {
      throw new ApiError(
        'Prerequisite not met: user tax agent verification must be completed',
        409
      );
    }

    if (app.status === applicationStatuses.DOCUMENTS_VERIFIED) {
      return res.success('Documents already verified', app);
    }

    const complete = await areRequiredDocumentsComplete(applicationId, true);
    if (!complete) {
      throw new ApiError(
        'Cannot mark as document upload completion until all required documents are uploaded',
        409
      );
    }
    // optimize catalog import process with dynamic batch sizing and logging enhancements

    const updated = await db.transaction(async (tx) => {
      const [updatedApplication] = await tx
        .update(models.applications)
        .set({ status: applicationStatuses.DOCUMENTS_VERIFIED, updatedAt: new Date() })
        .where(eq(models.applications.id, applicationId))
        .returning({
          id: models.applications.id,
          applicationNo: models.applications.applicationNo,
          year: models.applications.year,
          status: models.applications.status,
          isAmendment: models.applications.isAmendment,
          createdAt: models.applications.createdAt,
          updatedAt: models.applications.updatedAt,
        });

      await tx.insert(models.applicationStatusHistories).values({
        applicationId,
        status: applicationStatuses.DOCUMENTS_VERIFIED,
      });
      return updatedApplication;
    });
    // Notify user via fcm notification
    notificationHandler({
      tokens: app.user.fcmToken?.split(','),
      payload: {
        ...notificationTemplates.reviewCompleted,
        body: notificationTemplates.reviewCompleted.body.replace('APP_NO', app.applicationNo),
      },
      data: {
        type: notificationTemplates.reviewCompleted.type,
      },
      userId: app.user.id,
      appNotificationsEnabled: app.user.isAppNotificationEnabled,
    });

    return res.success('Application documents verified', updated);
  }
);

export const checkDocumentsUploadedStatus = serviceHandler(
  checkDocumentsUploadedStatusSchema,
  async (req, res) => {
    const { applicationId } = req.params;

    const app = await db.query.applications.findFirst({
      where: and(
        eq(models.applications.id, applicationId),
        // eq(models.applications.userId, user.id),
        isNull(models.applications.deletedAt)
      ),
      with: {
        applicationStatusHistories: { columns: { status: true } },
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            fcmToken: true,
            isAppNotificationEnabled: true,
          },
        },
      },
    });
    if (!app) throw new ApiError('Application not found', 404);
    console.log('App status:', app.status);

    if (req.user) {
      if (app.user.id !== req.user.id)
        throw new ApiError('Unauthorized access to application', 403);
    }

    // Ensure required previous statuses exist in history: documents_uploaded
    const statusHist = app.applicationStatusHistories;
    const statusSet = new Set(statusHist.map((h) => h.status));
    console.log('Status history:', statusSet);

    if (!statusSet.has(applicationStatuses.SUBMITTED)) {
      throw new ApiError('Prerequisite not met: application must be submitted', 409);
    }

    const complete = await areRequiredDocumentsComplete(applicationId, false);
    if (!complete) {
      throw new ApiError(
        'The application has required documents that have not yet been uploaded or submitted by user',
        409
      );
    }

    const updated = await db.transaction(async (tx) => {
      const [updatedApplication] = await tx
        .update(models.applications)
        .set({ status: applicationStatuses.DOCUMENTS_UPLOADED, updatedAt: new Date() })
        .where(eq(models.applications.id, applicationId))
        .returning({
          id: models.applications.id,
          applicationNo: models.applications.applicationNo,
          year: models.applications.year,
          status: models.applications.status,
          isAmendment: models.applications.isAmendment,
          createdAt: models.applications.createdAt,
          updatedAt: models.applications.updatedAt,
        });

      if (!statusSet.has(applicationStatuses.DOCUMENTS_UPLOADED)) {
        await tx.insert(models.applicationStatusHistories).values({
          applicationId,
          status: applicationStatuses.DOCUMENTS_UPLOADED,
        });
      }
      if (statusSet.has(applicationStatuses.DOCUMENTS_UPLOAD_PENDING)) {
        // remove documents_upload_pending status from history if exists
        await tx
          .delete(models.applicationStatusHistories)
          .where(
            and(
              eq(models.applicationStatusHistories.applicationId, applicationId),
              eq(
                models.applicationStatusHistories.status,
                applicationStatuses.DOCUMENTS_UPLOAD_PENDING
              )
            )
          );
      }

      return updatedApplication;
    });

    await mail.applicationReview({
      recipient: app.user.email,
      replacements: { name: app.user.name },
    });

    // if (app.user.fcmToken) {
    //   await sendNotification({
    //     tokens: [app.user.fcmToken],
    //     payload: {
    //       title: notificationTemplates.applicationReview.title,
    //       body: notificationTemplates.applicationReview.body,
    //     },
    //     data: {
    //       type: notificationTemplates.applicationReview.type,
    //     },
    //   });
    // }
    notificationHandler({
      tokens: app.user.fcmToken?.split(','),
      payload: {
        ...notificationTemplates.applicationReview,
        body: notificationTemplates.applicationReview.body.replace('APP_NO', app.applicationNo),
      },
      data: {
        type: notificationTemplates.applicationReview.type,
      },
      userId: app.user.id,
      appNotificationsEnabled: app.user.isAppNotificationEnabled,
    });

    return res.success('All required documents are uploaded', updated);
  }
);

export const setReviewedStatus = serviceHandler(setReviewedStatusSchema, async (req, res) => {
  const { applicationId } = req.params as { applicationId: string };

  const app = await db.query.applications.findFirst({
    where: and(isNull(models.applications.deletedAt), eq(models.applications.id, applicationId)),
    with: {
      applicationStatusHistories: { columns: { status: true } },
      user: {
        columns: {
          isTaxAgentVerificationCompleted: true,
          name: true,
          email: true,
          fcmToken: true,
          id: true,
          isAppNotificationEnabled: true,
        },
      },
    },
  });
  if (!app) throw new ApiError('Application not found', 404);

  // Ensure required previous statuses exist in history: documents_verified
  const statusHist = app.applicationStatusHistories;
  const statusSet = new Set(statusHist.map((h) => h.status));

  if (statusSet.has(applicationStatuses.REVIEWED)) {
    return res.success('Application is already reviewed', app);
  }

  // Prerequisites: documents_verified must be present
  if (!statusSet.has(applicationStatuses.DOCUMENTS_VERIFIED)) {
    throw new ApiError('Prerequisite not met: documents must be verified before review', 409);
  }

  if (!app.user.isTaxAgentVerificationCompleted) {
    throw new ApiError('Prerequisite not met: user tax agent verification must be completed', 409);
  }

  const updated = await db.transaction(async (tx) => {
    const [updatedApplication] = await tx
      .update(models.applications)
      .set({ status: applicationStatuses.PROCESSING, updatedAt: new Date() })
      .where(eq(models.applications.id, applicationId))
      .returning({
        id: models.applications.id,
        applicationNo: models.applications.applicationNo,
        year: models.applications.year,
        status: models.applications.status,
        isAmendment: models.applications.isAmendment,
        createdAt: models.applications.createdAt,
        updatedAt: models.applications.updatedAt,
      });

    await tx.insert(models.applicationStatusHistories).values([
      {
        applicationId,
        status: applicationStatuses.REVIEWED,
      },
      {
        applicationId,
        status: applicationStatuses.PROCESSING,
      },
    ]);
    return updatedApplication;
  });

  await mail.filingCompleted({
    recipient: app.user.email,
    replacements: {
      name: app.user.name,
    },
  });

  // if (app.user.fcmToken) {
  //   await sendNotification({
  //     tokens: [app.user.fcmToken],
  //     payload: {
  //       title: notificationTemplates.filingCompleted.title,
  //       body: notificationTemplates.filingCompleted.body,
  //     },
  //     data: {
  //       type: notificationTemplates.filingCompleted.type,
  //     },
  //   });
  // }
  notificationHandler({
    tokens: app.user.fcmToken?.split(','),
    payload: {
      ...notificationTemplates.filingCompleted,
      body: notificationTemplates.filingCompleted.body.replace('APP_NO', app.applicationNo),
    },
    data: {
      type: notificationTemplates.filingCompleted.type,
    },
    userId: app.user.id,
    appNotificationsEnabled: app.user.isAppNotificationEnabled,
  });
  return res.success('Application reviewed successfully', updated);
});

// =======================
// User: Offline Payment Request (moved from offline-payments)
// =======================

export const createOfflinePaymentRequest = serviceHandler(
  createOfflinePaymentRequestSchema,
  async (req, res) => {
    const userId = req.user.id;
    const { applicationId } = req.body as { applicationId: string };

    // Validate application exists, belongs to user, and is refund_completed
    const application = await db.query.applications.findFirst({
      where: and(
        eq(models.applications.id, applicationId),
        eq(models.applications.userId, userId),
        isNull(models.applications.deletedAt)
      ),
      columns: { id: true, status: true, finalAmount: true },
    });
    if (!application) throw new ApiError('Application not found', 404);
    if (application.status !== applicationStatuses.REFUND_COMPLETED) {
      throw new ApiError('Offline payment request allowed only after refund is completed', 409);
    }
    // Block if user already made an offline request for this application (Pending/Approved status)
    const approvedOrPendingRequestExist = await db.query.offlinePaymentRequests.findFirst({
      where: and(
        eq(models.offlinePaymentRequests.applicationId, applicationId),
        eq(models.offlinePaymentRequests.userId, userId),
        or(
          eq(models.offlinePaymentRequests.status, 'pending'),
          eq(models.offlinePaymentRequests.status, 'approved')
        ),
        isNull(models.offlinePaymentRequests.deletedAt)
      ),
      columns: { id: true, status: true },
    });
    if (approvedOrPendingRequestExist) {
      if (approvedOrPendingRequestExist.status === 'approved') {
        throw new ApiError(
          'There is already an approved offline payment request for this application',
          409
        );
      } else {
        throw new ApiError(
          'There is already a pending offline payment request for this application',
          409
        );
      }
    }
    // no need to block rejected requests anymore
    // // Block if user already made 5 offline request for this application (rejected status)
    // const existing = await db.query.offlinePaymentRequests.findMany({
    //   where: and(
    //     eq(models.offlinePaymentRequests.applicationId, applicationId),
    //     eq(models.offlinePaymentRequests.userId, userId),
    //     eq(models.offlinePaymentRequests.status, 'rejected')
    //   ),
    //   columns: { id: true },
    // });
    // if (existing && existing.length >= 5) {
    //   throw new ApiError(
    //     'You have reached the maximum number of rejected offline payment requests for this application',
    //     409
    //   );
    // }

    // Derive claimedAmount from application.finalAmount and claimedPaymentDate as now
    const claimedAmountNum = Number(application.finalAmount ?? '0');
    if (!Number.isFinite(claimedAmountNum) || claimedAmountNum <= 0) {
      throw new ApiError('Final amount is not available for this application', 409);
    }

    const [created] = await db
      .insert(models.offlinePaymentRequests)
      .values({
        userId,
        applicationId,
        claimedAmount: String(claimedAmountNum),
        claimedPaymentDate: new Date(),
        status: 'pending',
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        requestId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      })
      .returning();

    return res.success('Offline payment request submitted', {
      id: created.id,
      status: created.status,
      createdAt: created.createdAt,
      claimedAmount: created.claimedAmount,
      claimedPaymentDate: created.claimedPaymentDate,
    });
  }
);

// =======================
// Admin: Approve/Reject Offline Payment Request
// =======================

export const approveOfflinePaymentRequest = serviceHandler(
  approveOfflinePaymentRequestSchema,
  async (req, res) => {
    const adminId = req.admin.id;
    const { offlinePaymentRequestId, paymentMethod, transactionId } = req.body;

    // if payment method is cash or cheque no need of transactionId otherwise mandatory
    if (
      paymentMethod !== paymentMethods.CASH &&
      paymentMethod !== paymentMethods.CHEQUE &&
      !transactionId
    ) {
      throw new ApiError('Transaction ID is required for the selected payment method', 400);
    }

    const opr = await db.query.offlinePaymentRequests.findFirst({
      where: and(
        isNull(models.offlinePaymentRequests.deletedAt),
        eq(models.offlinePaymentRequests.id, offlinePaymentRequestId)
      ),
      columns: { id: true, status: true, userId: true, applicationId: true },
      with: {
        user: {
          columns: {
            email: true,
            name: true,
            fcmToken: true,
            id: true,
            isAppNotificationEnabled: true,
          },
        },
        application: {
          columns: { id: true, applicationNo: true },
        },
      },
    });
    if (!opr) throw new ApiError('Offline payment request not found', 404);
    if (opr.status === 'approved') {
      return res.success('Already approved', opr);
    }
    if (opr.status !== 'pending' && opr.status !== 'under_review') {
      throw new ApiError('Only pending or under_review requests can be approved', 409);
    }

    const updated = await db.transaction(async (tx) => {
      const [oprUpdated] = await tx
        .update(models.offlinePaymentRequests)
        .set({
          status: 'approved',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          verifiedPaymentMethod: paymentMethod,
          verifiedTransactionId: transactionId,
          verifiedPaymentDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(models.offlinePaymentRequests.id, offlinePaymentRequestId))
        .returning();

      // Mark application payment status as completed
      await tx
        .update(models.applications)
        .set({ paymentStatus: 'completed', updatedAt: new Date() })
        .where(eq(models.applications.id, oprUpdated.applicationId));

      await tx
        .insert(models.payments)
        .values({
          applicationId: oprUpdated.applicationId,
          userId: oprUpdated.userId,
          amount: oprUpdated.claimedAmount,
          currency: 'EUR',
          paymentMethod: paymentMethod,
          status: 'completed',
          transactionId: oprUpdated.verifiedTransactionId,
          transactionNo: `TXN-${generateAlphaNumCode()}`,
        })
        .onConflictDoUpdate({
          target: models.payments.applicationId,
          set: {
            userId: oprUpdated.userId,
            amount: oprUpdated.claimedAmount,
            currency: 'EUR',
            paymentMethod: paymentMethod,
            status: 'completed',
            transactionId: oprUpdated.verifiedTransactionId,
            transactionNo: `TXN-${generateAlphaNumCode()}`,
          },
        })
        .returning();

      return oprUpdated;
    });

    notificationHandler({
      tokens: opr.user.fcmToken?.split(','),
      payload: {
        ...notificationTemplates.offlinePaymentAccepted,
        body: notificationTemplates.offlinePaymentAccepted.body.replace(
          'APP_NO',
          opr.application.applicationNo
        ),
      },
      data: {
        type: notificationTemplates.offlinePaymentAccepted.type,
      },
      userId: opr.user.id,
      appNotificationsEnabled: opr.user.isAppNotificationEnabled,
    });

    return res.success('Offline payment request approved', {
      id: updated.id,
      status: updated.status,
      reviewedAt: updated.reviewedAt,
      verifiedPaymentMethod: updated.verifiedPaymentMethod,
      verifiedTransactionId: updated.verifiedTransactionId,
      verifiedPaymentDate: updated.verifiedPaymentDate,
    });
  }
);

export const rejectOfflinePaymentRequest = serviceHandler(
  rejectOfflinePaymentRequestSchema,
  async (req, res) => {
    const adminId = req.admin.id;
    const { offlinePaymentRequestId, rejectionReason, rejectionCategory } = req.body as {
      offlinePaymentRequestId: string;
      rejectionReason: string;
      rejectionCategory?: string;
    };

    const opr = await db.query.offlinePaymentRequests.findFirst({
      where: and(
        isNull(models.offlinePaymentRequests.deletedAt),
        eq(models.offlinePaymentRequests.id, offlinePaymentRequestId)
      ),
      columns: { id: true, status: true, claimedAmount: true, userId: true, applicationId: true },
      with: {
        user: {
          columns: {
            email: true,
            name: true,
            fcmToken: true,
            id: true,
            isAppNotificationEnabled: true,
          },
        },
        application: {
          columns: { id: true, applicationNo: true },
        },
      },
    });
    if (!opr) throw new ApiError('Offline payment request not found', 404);
    if (opr.status === 'rejected') {
      return res.success('Already rejected', opr);
    }
    if (opr.status !== 'pending' && opr.status !== 'under_review') {
      throw new ApiError('Only pending or under_review requests can be rejected', 409);
    }

    const updated = await db.transaction(async (tx) => {
      const [oprUpdated] = await tx
        .update(models.offlinePaymentRequests)
        .set({
          status: 'rejected',
          rejectionReason,
          rejectionCategory: rejectionCategory ?? null,
          rejectedDate: new Date().toISOString(),
          reviewedBy: adminId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(models.offlinePaymentRequests.id, offlinePaymentRequestId))
        .returning();

      // Keep application payment status as pending (explicitly), to reflect rejection
      await tx
        .update(models.applications)
        .set({ paymentStatus: 'pending', updatedAt: new Date() })
        .where(eq(models.applications.id, oprUpdated.applicationId));

      return oprUpdated;
    });

    await mail.offlinePaymentRejected({
      recipient: opr.user.email,
      replacements: { name: opr.user.name, amount: opr.claimedAmount, reason: rejectionReason },
    });

    // if (opr.user.fcmToken) {
    //   await sendNotification({
    //     tokens: [opr.user.fcmToken],
    //     payload: {
    //       title: notificationTemplates.offlinePaymentRejected.title,
    //       body: notificationTemplates.offlinePaymentRejected.body,
    //     },
    //     data: {
    //       type: notificationTemplates.offlinePaymentRejected.type,
    //     },
    //   });
    // }
    notificationHandler({
      tokens: opr.user.fcmToken?.split(','),
      payload: {
        ...notificationTemplates.offlinePaymentRejected,
        body: notificationTemplates.offlinePaymentRejected.body.replace(
          'APP_NO',
          opr.application.applicationNo
        ),
      },
      data: {
        type: notificationTemplates.offlinePaymentRejected.type,
      },
      userId: opr.user.id,
      appNotificationsEnabled: opr.user.isAppNotificationEnabled,
    });

    return res.success('Offline payment request rejected', {
      id: updated.id,
      status: updated.status,
      rejectionReason: updated.rejectionReason,
      rejectionCategory: updated.rejectionCategory,
      rejectedDate: updated.rejectedDate,
      reviewedAt: updated.reviewedAt,
    });
  }
);

export const createPaymentCheckout = serviceHandler(
  createPaymentCheckoutSchema,
  async (req, res) => {
    const { applicationId } = req.body;

    // Validate application exists, belongs to user, and is refund_completed
    const application = await db.query.applications.findFirst({
      where: and(
        eq(models.applications.id, applicationId),
        eq(models.applications.userId, req.user.id),
        isNull(models.applications.deletedAt)
      ),
      columns: {
        id: true,
        status: true,
        finalAmount: true,
        userId: true,
        commissionPercentage: true,
        commissionAmount: true,
        vatPercentage: true,
        vatAmount: true,
        totalCommissionAmount: true,
        flatFee: true,
        discountAmount: true,
        applicationNo: true,
        year: true,
        isAmendment: true,
        paymentStatus: true,
      },
    });
    if (!application) throw new ApiError('Application not found', 404);
    if (application.paymentStatus === 'completed') {
      throw new ApiError('Payment already completed for this application', 409);
    }
    if (application.status !== applicationStatuses.REFUND_COMPLETED) {
      throw new ApiError('Payments are not allowed in this state', 409);
    }

    if (application.userId !== req.user.id) throw new ApiError('Forbidden', 403);

    // check if already exists a pending/completed payment for this application
    const approvedOrPendingRequestExist = await db.query.payments.findFirst({
      where: and(
        eq(models.payments.applicationId, applicationId),
        eq(models.payments.userId, req.user.id),
        or(
          eq(models.payments.status, paymentStatuses.PENDING),
          eq(models.payments.status, paymentStatuses.PROCESSING),
          eq(models.payments.status, paymentStatuses.COMPLETED)
        ),
        isNull(models.payments.deletedAt)
      ),
      columns: { id: true, status: true },
    });
    if (approvedOrPendingRequestExist) {
      if (approvedOrPendingRequestExist.status === paymentStatuses.COMPLETED) {
        throw new ApiError('Payment already completed for this application', 409);
      } else {
        throw new ApiError(
          'Your previous payment for this application is currently being processed. Please try again after 5 minutes.',
          409
        );
      }
    }

    // Derive claimedAmount from application.finalAmount and claimedPaymentDate as now
    const amountToPay = Number(application.finalAmount ?? '0');
    if (!Number.isFinite(amountToPay) || amountToPay <= 0) {
      throw new ApiError('Final amount is not available for this application', 409);
    }

    const revolutCustomer = !req.user.revolutCustomerId
      ? await createCustomer({
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
          dob: req.user.dob,
        })
      : await getCustomer(req.user.revolutCustomerId);

    if (!req.user.revolutCustomerId) {
      await db
        .update(models.users)
        .set({ revolutCustomerId: revolutCustomer.id })
        .where(eq(models.users.id, req.user.id));
    }

    const order = await createOrder({
      amount: Math.round(amountToPay * 100), // convert to minor units if amountToPay is in major units
      currency: 'EUR',
      userId: req.user.id,
      revolutCustomerId: revolutCustomer.id,
      customer: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        dob: req.user.dob,
      },
      application: {
        id: application.id,
        applicationNo: application.applicationNo,
        year: application.year,
        isAmendment: application.isAmendment,
        refundAmount: application.finalAmount,
        totalCommissionAmount: application.totalCommissionAmount,
        commissionPercentage: application.commissionPercentage,
        commissionAmount: application.commissionAmount,
        vatPercentage: application.vatPercentage,
        vatAmount: application.vatAmount,
        discountAmount: application.discountAmount,
        finalAmount: application.finalAmount,
        flatFee: application.flatFee,
      },
    });

    console.log(order);

    if (!order || !order.id || !order.checkout_url) {
      throw new ApiError('Failed to create checkout session', 500);
    }

    const metadata = {
      revolutCustomerId: revolutCustomer.id,
      customer: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        dob: req.user.dob,
      },
      application: {
        id: application.id,
        applicationNo: application.applicationNo,
        year: application.year,
        isAmendment: application.isAmendment,
        refundAmount: application.finalAmount,
        totalCommissionAmount: application.totalCommissionAmount,
        commissionPercentage: application.commissionPercentage,
        commissionAmount: application.commissionAmount,
        vatPercentage: application.vatPercentage,
        vatAmount: application.vatAmount,
        discountAmount: application.discountAmount,
        finalAmount: application.finalAmount,
        flatFee: application.flatFee,
      },
    };

    const [payment] = await db
      .insert(models.payments)
      .values({
        applicationId,
        userId: application.userId,
        amount: amountToPay.toString(),
        currency: 'EUR',
        paymentMethod: paymentMethods.REVOLUT,
        status: 'pending',
        transactionId: order.id,
        transactionNo: `TXN-${generateAlphaNumCode()}`,
        metadata,
      })
      .onConflictDoUpdate({
        target: models.payments.applicationId,
        set: {
          status: 'pending',
          transactionId: order.id,
          transactionNo: `TXN-${generateAlphaNumCode()}`,
        },
      })
      .returning({ id: models.payments.id });

    return res.success('Checkout session created successfully', {
      paymentId: payment.id,
      orderId: order.id,
      checkoutUrl: order.checkout_url,
      status: 'pending',
    });
  }
);

export const paymentWebhook = async (req: Request, res: Response) => {
  console.log(JSON.stringify(req.body, null, 2));
  const data = req.body;
  console.log('Received webhook:', data);

  const order = await getOrder(data.order_id);
  console.log(true, 'order:', order);
  if (!order) {
    console.log('Order not found:', data.order_id);
    return res.status(400).send('Order not found');
  }
  const paymentData = await db.query.payments.findFirst({
    where: eq(models.payments.applicationId, order.metadata.applicationId),
    columns: { id: true, applicationId: true, status: true },
  });
  if (!paymentData) {
    console.log('Payment record not found for application:', order.metadata.applicationId);
    return res.status(400).send('Payment record not found');
  }
  if (!['pending', 'processing', 'failed'].includes(paymentData.status)) {
    console.log('Payment already completed for application:', order.metadata.applicationId);
    return res.status(200).send('Payment already completed');
  }

  if (order.state === paymentData.status) {
    console.log('Webhook already proccessed for application:', order.metadata.applicationId);
    return res.status(200).send('Webhook already processed');
  }

  const user = await db.query.users.findFirst({
    where: eq(models.users.id, order.metadata.userId),
    columns: { id: true, name: true, email: true, isAppNotificationEnabled: true, fcmToken: true },
  });

  switch (data.event) {
    case 'ORDER_COMPLETED': {
      console.log('Payment completed:', data);
      await db.transaction(async (tx) => {
        // Mark application payment status as completed
        await tx
          .update(models.applications)
          .set({ paymentStatus: 'completed', updatedAt: new Date() })
          .where(eq(models.applications.id, order.metadata.applicationId));

        await tx
          .update(models.payments)
          .set({
            status: 'completed',
            processedAt: new Date(),
          })
          .where(eq(models.payments.applicationId, order.metadata.applicationId));
      });
      await mail.paymentReceived({
        recipient: order.metadata.customerEmail,
        replacements: {
          name: order.metadata.customerName,
          amount: Math.round(order.amount / 100),
          transactionId: data.order_id,
          paymentDate: new Date(order.updated_at).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }),
        },
      });
      if (user) {
        notificationHandler({
          tokens: user.fcmToken?.split(','),
          payload: {
            ...notificationTemplates.paymentSuccessful,
            body: notificationTemplates.paymentSuccessful.body.replace(
              'APP_NO',
              order.metadata.applicationNo
            ),
          },
          data: {
            type: notificationTemplates.paymentSuccessful.type,
          },
          userId: user.id,
          appNotificationsEnabled: user.isAppNotificationEnabled,
        });
      }
      break;
    }
    case 'ORDER_FAILED':
    case 'ORDER_CANCELLED': {
      console.log('Payment failed:', data);
      // Try to get decline reason from multiple sources
      const reason =
        data.decline_reason ||
        data.failure_reason ||
        order.payments?.[order.payments.length - 1]?.decline_reason ||
        (data.event === 'ORDER_CANCELLED'
          ? 'Payment session expired or cancelled by user'
          : 'Payment failed');
      await db
        .update(models.payments)
        .set({
          status: 'failed',
          processedAt: new Date(),
          failureReason: reason,
        })
        .where(eq(models.payments.applicationId, order.metadata.applicationId));
      await mail.paymentFailed({
        recipient: order.metadata.customerEmail,
        replacements: {
          name: order.metadata.customerName,
          amount: Math.round(order.amount / 100),
        },
      });
      if (user) {
        notificationHandler({
          tokens: user.fcmToken?.split(','),
          payload: {
            ...notificationTemplates.paymentFailed,
            body: notificationTemplates.paymentFailed.body.replace(
              'APP_NO',
              order.metadata.applicationNo
            ),
          },
          data: {
            type: notificationTemplates.paymentFailed.type,
          },
          userId: user.id,
          appNotificationsEnabled: user.isAppNotificationEnabled,
        });
      }

      break;
    }
  }

  res.status(200).send('ok');
};

export const listCompletedPayments = serviceHandler(
  listCompletedPaymentsSchema,
  async (req, res) => {
    const { limit, offset, page, size } = req.pagination;
    const { search } = req.query;

    // Build base query conditions
    const baseConditions = [
      eq(models.payments.status, 'completed'),
      isNull(models.payments.deletedAt),
    ];

    // Optimize search: only hash and search if search term is provided
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      const searchHashes = hashSearchKeyword(searchTerm);
      const minMatches = Math.ceil(searchHashes.length * 0.6);

      const searchCondition = or(
        // Fuzzy trigram search for application number
        sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.applications.applicationNoTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`,
        // Fuzzy trigram search for email
        sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.emailTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`,
        // Fuzzy trigram search for phone
        sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.phoneTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`,
        // Fuzzy trigram search for PPS number
        sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.ppsNumberTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`,
        // Fuzzy trigram search for name
        sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.nameTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`
      );

      if (searchCondition) {
        baseConditions.push(searchCondition);
      }
    }

    const where = and(...baseConditions);

    // Execute count and data queries in parallel for better performance
    const [countResult, rows] = await Promise.all([
      // Optimized count query - only join users table if search is needed
      search && search.trim()
        ? db
            .select({ count: sql<number>`count(${models.payments.id})` })
            .from(models.payments)
            .leftJoin(models.users, eq(models.payments.userId, models.users.id))
            .leftJoin(
              models.applications,
              eq(models.payments.applicationId, models.applications.id)
            )
            .where(where)
        : db
            .select({ count: sql<number>`count(${models.payments.id})` })
            .from(models.payments)
            .leftJoin(
              models.applications,
              eq(models.payments.applicationId, models.applications.id)
            )
            .where(where),

      // Main data query with selective field selection
      db
        .select({
          // Payment fields
          id: models.payments.id,
          amount: models.payments.amount,
          currency: models.payments.currency,
          paymentMethod: models.payments.paymentMethod,
          transactionId: models.payments.transactionId,
          transactionNo: models.payments.transactionNo,
          processedAt: models.payments.processedAt,
          createdAt: models.payments.createdAt,
          // User fields - only select what's needed
          userId: models.users.id,
          userName: models.users.name,
          userEmail: models.users.email,
          // Application fields - only select what's needed
          applicationId: models.applications.id,
          applicationNo: models.applications.applicationNo,
          applicationYear: models.applications.year,
          applicationStatus: models.applications.status,
        })
        .from(models.payments)
        .leftJoin(models.users, eq(models.payments.userId, models.users.id))
        .leftJoin(models.applications, eq(models.payments.applicationId, models.applications.id))
        .where(where)
        .orderBy(desc(models.payments.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.count || 0;

    // Transform the flat structure to nested structure for consistency with existing API
    const transformedRows = rows.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      paymentMethod: formatText(p.paymentMethod),
      transactionId: p.transactionId,
      transactionNo: p.transactionNo,
      processedAt: p.processedAt,
      createdAt: p.createdAt,
      user: {
        id: p.userId,
        name: p.userName,
        email: p.userEmail,
      },
      application: {
        id: p.applicationId,
        applicationNo: p.applicationNo,
        year: p.applicationYear,
        status: formatText(p.applicationStatus),
      },
    }));

    return res.data('Completed payments retrieved', transformedRows, {
      page,
      size,
      total: Number(total),
    });
  }
);

export const listPendingOfflinePaymentRequests = serviceHandler(
  listPendingOfflinePaymentRequestsSchema,
  async (req, res) => {
    const { limit, offset, page, size } = req.pagination;
    const { search } = req.query;

    // Build base query conditions
    const baseConditions = [
      eq(models.offlinePaymentRequests.status, 'pending'),
      isNull(models.offlinePaymentRequests.deletedAt),
    ];

    // Optimize search: only hash and search if search term is provided
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      const searchHashes = hashSearchKeyword(searchTerm);
      const minMatches = Math.ceil(searchHashes.length * 0.6);

      const searchCondition = or(
        // Fuzzy trigram search for application number
        sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.applications.applicationNoTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`,
        // Fuzzy trigram search for email
        sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.emailTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`,
        // Fuzzy trigram search for phone
        sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.phoneTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`,
        // Fuzzy trigram search for PPS number
        sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.ppsNumberTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`,
        // Fuzzy trigram search for name
        sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.nameTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`
      );

      if (searchCondition) {
        baseConditions.push(searchCondition);
      }
    }

    const where = and(...baseConditions);

    // Execute count and data queries in parallel for better performance
    const [countResult, rows] = await Promise.all([
      // Optimized count query - only join users table if search is needed
      search && search.trim()
        ? db
            .select({ count: sql<number>`count(${models.offlinePaymentRequests.id})` })
            .from(models.offlinePaymentRequests)
            .leftJoin(models.users, eq(models.offlinePaymentRequests.userId, models.users.id))
            .leftJoin(
              models.applications,
              eq(models.offlinePaymentRequests.applicationId, models.applications.id)
            )
            .where(where)
        : db
            .select({ count: sql<number>`count(${models.offlinePaymentRequests.id})` })
            .from(models.offlinePaymentRequests)
            .leftJoin(
              models.applications,
              eq(models.offlinePaymentRequests.applicationId, models.applications.id)
            )
            .where(where),

      // Main data query with selective field selection
      db
        .select({
          // Offline payment request fields
          id: models.offlinePaymentRequests.id,
          claimedAmount: models.offlinePaymentRequests.claimedAmount,
          claimedPaymentDate: models.offlinePaymentRequests.claimedPaymentDate,
          status: models.offlinePaymentRequests.status,
          createdAt: models.offlinePaymentRequests.createdAt,
          // User fields - only select what's needed
          userId: models.users.id,
          userName: models.users.name,
          userEmail: models.users.email,
          // Application fields - only select what's needed
          applicationId: models.applications.id,
          applicationNo: models.applications.applicationNo,
          applicationYear: models.applications.year,
          applicationStatus: models.applications.status,
        })
        .from(models.offlinePaymentRequests)
        .leftJoin(models.users, eq(models.offlinePaymentRequests.userId, models.users.id))
        .leftJoin(
          models.applications,
          eq(models.offlinePaymentRequests.applicationId, models.applications.id)
        )
        .where(where)
        .orderBy(desc(models.offlinePaymentRequests.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.count || 0;

    // Transform the flat structure to nested structure for consistency with existing API
    const transformedRows = rows.map((r) => ({
      id: r.id,
      claimedAmount: r.claimedAmount,
      claimedPaymentDate: r.claimedPaymentDate,
      status: r.status,
      createdAt: r.createdAt,
      user: {
        id: r.userId,
        name: r.userName,
        email: r.userEmail,
      },
      application: {
        id: r.applicationId,
        applicationNo: r.applicationNo,
        year: r.applicationYear,
        status: formatText(r.applicationStatus),
      },
    }));

    return res.data('Pending offline payment requests retrieved', transformedRows, {
      page,
      size,
      total: Number(total),
    });
  }
);

export const listRejectedOfflinePaymentRequests = serviceHandler(
  listRejectedOfflinePaymentRequestsSchema,
  async (req, res) => {
    const { limit, offset, page, size } = req.pagination;
    const { search } = req.query;

    // Build base query conditions
    const baseConditions = [
      eq(models.offlinePaymentRequests.status, 'rejected'),
      isNull(models.offlinePaymentRequests.deletedAt),
    ];

    // Optimize search: only hash and search if search term is provided
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      const searchHashes = hashSearchKeyword(searchTerm);
      const minMatches = Math.ceil(searchHashes.length * 0.6);

      const searchCondition = or(
        // Fuzzy trigram search for application number
        sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.applications.applicationNoTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`,
        // Fuzzy trigram search for email
        sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.emailTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`,
        // Fuzzy trigram search for phone
        sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.phoneTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`,
        // Fuzzy trigram search for PPS number
        sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.ppsNumberTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`,
        // Fuzzy trigram search for name
        sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.nameTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`
      );
      if (searchCondition) {
        baseConditions.push(searchCondition);
      }
    }

    const where = and(...baseConditions);

    // Execute count and data queries in parallel for better performance
    const [countResult, rows] = await Promise.all([
      // Optimized count query - only join users table if search is needed
      search && search.trim()
        ? db
            .select({ count: sql<number>`count(${models.offlinePaymentRequests.id})` })
            .from(models.offlinePaymentRequests)
            .leftJoin(models.users, eq(models.offlinePaymentRequests.userId, models.users.id))
            .leftJoin(
              models.applications,
              eq(models.offlinePaymentRequests.applicationId, models.applications.id)
            )
            .where(where)
        : db
            .select({ count: sql<number>`count(${models.offlinePaymentRequests.id})` })
            .from(models.offlinePaymentRequests)
            .leftJoin(
              models.applications,
              eq(models.offlinePaymentRequests.applicationId, models.applications.id)
            )
            .where(where),

      // Main data query with selective field selection
      db
        .select({
          // Offline payment request fields
          id: models.offlinePaymentRequests.id,
          claimedAmount: models.offlinePaymentRequests.claimedAmount,
          claimedPaymentDate: models.offlinePaymentRequests.claimedPaymentDate,
          status: models.offlinePaymentRequests.status,
          createdAt: models.offlinePaymentRequests.createdAt,
          rejectionReason: models.offlinePaymentRequests.rejectionReason,
          rejectionCategory: models.offlinePaymentRequests.rejectionCategory,
          rejectedDate: models.offlinePaymentRequests.rejectedDate,
          // User fields - only select what's needed
          userId: models.users.id,
          userName: models.users.name,
          userEmail: models.users.email,
          // Application fields - only select what's needed
          applicationId: models.applications.id,
          applicationNo: models.applications.applicationNo,
          applicationYear: models.applications.year,
          applicationStatus: models.applications.status,
        })
        .from(models.offlinePaymentRequests)
        .leftJoin(models.users, eq(models.offlinePaymentRequests.userId, models.users.id))
        .leftJoin(
          models.applications,
          eq(models.offlinePaymentRequests.applicationId, models.applications.id)
        )
        .where(where)
        .orderBy(desc(models.offlinePaymentRequests.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.count || 0;

    // Transform the flat structure to nested structure for consistency with existing API
    const transformedRows = rows.map((r) => ({
      id: r.id,
      claimedAmount: r.claimedAmount,
      claimedPaymentDate: r.claimedPaymentDate,
      status: r.status,
      createdAt: r.createdAt,
      rejectionReason: r.rejectionReason,
      rejectionCategory: r.rejectionCategory,
      rejectedDate: r.rejectedDate,
      user: {
        id: r.userId,
        name: r.userName,
        email: r.userEmail,
      },
      application: {
        id: r.applicationId,
        applicationNo: r.applicationNo,
        year: r.applicationYear,
        status: formatText(r.applicationStatus),
      },
    }));

    return res.data('Rejected offline payment requests retrieved', transformedRows, {
      page,
      size,
      total: Number(total),
    });
  }
);

// =======================
// Application Reviews
// =======================

export const createApplicationReview = serviceHandler(
  createApplicationReviewSchema,
  async (req, res) => {
    const { rating, review, applicationId } = req.body;

    const app = await db.query.applications.findFirst({
      where: and(
        isNull(models.applications.deletedAt),
        eq(models.applications.id, applicationId),
        eq(models.applications.userId, req.user.id)
      ),
      columns: { id: true, status: true },
    });
    if (!app) throw new ApiError('Application not found', 404);
    if (app.status !== applicationStatuses.REFUND_COMPLETED) {
      throw new ApiError('Reviews can be submitted only after refund completion', 409);
    }

    const existing = await db.query.applicationReviews.findFirst({
      where: and(
        eq(models.applicationReviews.applicationId, applicationId),
        isNull(models.applicationReviews.deletedAt)
      ),
      columns: { id: true },
    });
    if (existing) {
      return res.error('You have already submitted a review for this application', 409);
    }

    const [created] = await db
      .insert(models.applicationReviews)
      .values({ applicationId, rating: String(rating), review })
      .returning({
        id: models.applicationReviews.id,
        createdAt: models.applicationReviews.createdAt,
      });

    return res.success('Review submitted successfully', {
      id: created.id,
      rating,
      review,
      createdAt: created.createdAt,
    });
  }
);

export const listApplicationReviews = serviceHandler(
  listApplicationReviewsSchema,
  async (req, res) => {
    const { page, size, status, applicationId } = req.query;
    const { limit, offset } = req.pagination;

    const where: Array<ReturnType<typeof and> | ReturnType<typeof eq>> = [
      isNull(models.applicationReviews.deletedAt),
    ];
    const isAdmin = !!req.admin;
    if (isAdmin) {
      if (status) where.push(eq(models.applicationReviews.status, status));
    } else {
      // Users can only see approved reviews
      where.push(eq(models.applicationReviews.status, 'approved'));
    }
    if (applicationId) where.push(eq(models.applicationReviews.applicationId, applicationId));

    const [total, reviews] = await Promise.all([
      db.$count(models.applicationReviews, where.length ? and(...where) : undefined),
      db.query.applicationReviews.findMany({
        where: where.length ? and(...where) : undefined,
        ...(isAdmin && {
          with: {
            application: { columns: { id: true, applicationNo: true, userId: true } },
          },
        }),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        ...(isAdmin !== true && {
          columns: { id: true, rating: true, review: true, createdAt: true },
        }),
        limit,
        offset,
      }),
    ]);

    return res.data('Application reviews retrieved successfully', reviews, { page, size, total });
  }
);

export const getApplicationReview = serviceHandler(getApplicationReviewSchema, async (req, res) => {
  const { id } = req.params as { id: string };
  const review = await db.query.applicationReviews.findFirst({
    where: and(isNull(models.applicationReviews.deletedAt), eq(models.applicationReviews.id, id)),
    with: {
      application: {
        columns: {
          id: true,
          applicationNo: true,
          userId: true,
          year: true,
          refundAmount: true,
          totalCommissionAmount: true,
          status: true,
        },
        with: {
          user: {
            columns: { id: true, name: true, email: true, phone: true, ppsNumber: true },
          },
        },
      },
    },
  });
  if (!review) throw new ApiError('Review not found', 404);
  return res.success('Application review retrieved successfully', review);
});

export const updateApplicationReviewStatus = serviceHandler(
  updateApplicationReviewStatusSchema,
  async (req, res) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: 'approved' | 'rejected' };

    const existing = await db.query.applicationReviews.findFirst({
      where: and(isNull(models.applicationReviews.deletedAt), eq(models.applicationReviews.id, id)),
      columns: { id: true },
    });
    if (!existing) throw new ApiError('Review not found', 404);

    const [updated] = await db
      .update(models.applicationReviews)
      .set({ status, updatedAt: new Date() })
      .where(eq(models.applicationReviews.id, id))
      .returning();
    const activityLogData = {
      entityName: activityLogEntityNames.application_review,
      entityId: updated.id,
      action: 'update' as const,
      modifiedUserId: req.admin.id,
      oldData: existing,
      newData: updated,
    };
    await activityLog(activityLogData);
    return res.success('Review status updated successfully', updated);
  }
);
