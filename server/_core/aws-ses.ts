import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { ENV } from "./env";

// Create SES client
const sesClient = new SESClient({
  region: ENV.awsRegion || "eu-north-1",
  credentials: {
    accessKeyId: ENV.awsAccessKeyId || "",
    secretAccessKey: ENV.awsSecretAccessKey || "",
  },
});

export interface SendEmailParams {
  to: string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
}

/**
 * Send email using AWS SES
 * @param params Email parameters
 * @returns Promise with message ID on success
 */
export async function sendEmailViaSES(params: SendEmailParams): Promise<string> {
  const { to, subject, htmlBody, textBody } = params;

  // Validate that AWS SES is configured
  if (!ENV.awsAccessKeyId || !ENV.awsSecretAccessKey || !ENV.awsSesFromEmail) {
    throw new Error("AWS SES is not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_SES_FROM_EMAIL environment variables.");
  }

  const command = new SendEmailCommand({
    Source: ENV.awsSesFromEmail,
    Destination: {
      ToAddresses: to,
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
        ...(textBody && {
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        }),
      },
    },
  });

  try {
    const response = await sesClient.send(command);
    console.log(`[AWS SES] Email sent successfully. MessageId: ${response.MessageId}`);
    return response.MessageId || "unknown";
  } catch (error: any) {
    console.error("[AWS SES] Failed to send email:", error);
    throw new Error(`Failed to send email via AWS SES: ${error.message}`);
  }
}

/**
 * Check if AWS SES is properly configured
 */
export function isAWSSESConfigured(): boolean {
  return !!(ENV.awsAccessKeyId && ENV.awsSecretAccessKey && ENV.awsSesFromEmail);
}
