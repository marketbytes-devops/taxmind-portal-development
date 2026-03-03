import {
  SESClient,
  SendBulkTemplatedEmailCommand,
  SendEmailCommand,
  SendTemplatedEmailCommand,
} from '@aws-sdk/client-ses';

import logger from '@/logger';
import { formatTemplate } from '@/utils/formatTemplate';

import { loadTemplate } from '../mail/loadEmailTemplate';

interface SendMailParams {
  replyTo?: string;
  sender?: string;
  recipient: string | string[];
  subject: string;
  templateName: string; // local file-based template name
  replacements: Record<string, unknown>;
  isBulk?: boolean; // treat each recipient independently
  templateId?: string; // SES template name (pre-created in SES)
}

const { AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_REGION, SUPPORT_EMAIL_ID } = process.env;
const sesClient = new SESClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY!,
    secretAccessKey: AWS_SECRET_KEY!,
  },
});

export const sendMail = async ({
  replyTo,
  sender,
  recipient,
  subject,
  templateName,
  replacements,
  isBulk = false,
  templateId,
}: SendMailParams) => {
  const fromAddress = sender ?? SUPPORT_EMAIL_ID!;
  const recipients = Array.isArray(recipient) ? recipient : [recipient];

  try {
    // 1. Templated email via SES (templateId corresponds to SES template name)
    if (templateId) {
      if (isBulk && recipients.length > 1) {
        // Bulk templated send (personalization via ReplacementTemplateData)
        const bulkCommand = new SendBulkTemplatedEmailCommand({
          Source: fromAddress,
          Template: templateId,
          DefaultTemplateData: JSON.stringify(replacements),
          Destinations: recipients.map((r) => ({
            Destination: { ToAddresses: [r] },
            ReplacementTemplateData: JSON.stringify(replacements),
          })),
          ReplyToAddresses: replyTo ? [replyTo] : undefined,
        });
        await sesClient.send(bulkCommand);
        return;
      }
      const templatedCommand = new SendTemplatedEmailCommand({
        Source: fromAddress,
        Destination: { ToAddresses: recipients },
        Template: templateId,
        TemplateData: JSON.stringify(replacements),
        ReplyToAddresses: replyTo ? [replyTo] : undefined,
      });
      await sesClient.send(templatedCommand);
      return;
    }

    // 2. Raw HTML email built from local template system
    const formattedSubject = formatTemplate(subject, replacements);
    const htmlBody = loadTemplate(templateName, replacements);

    console.log({ fromAddress, recipients, formattedSubject });
    // Single (or multi-To) send
    const command = new SendEmailCommand({
      Source: fromAddress,
      Destination: { ToAddresses: recipients },
      Message: {
        Subject: { Data: formattedSubject },
        Body: { Html: { Data: htmlBody } },
      },
      ReplyToAddresses: replyTo ? [replyTo] : undefined,
    });
    const response = await sesClient.send(command);
    console.log(response);
  } catch (error) {
    logger.error('sendMail SES error:', error);
  }
};
