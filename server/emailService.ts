import { getDb } from "./db";
import { emailVerifications, tenants } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { sendEmail } from "./email";

/**
 * Generate a secure random token for email verification
 */
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Send verification email to new tenant
 * Uses professional HTML template with Stylora branding
 */
export async function sendVerificationEmail(tenantId: string, email: string): Promise<{ token: string; verificationUrl: string }> {
  // Generate token
  const token = generateVerificationToken();
  
  // Set expiration to 24 hours from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  // Store verification token in database
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(emailVerifications).values({
    tenantId,
    email,
    token,
    expiresAt,
  });
  
  // Build verification URL
  const baseUrl = process.env.VITE_APP_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  // Render professional email template
  const emailContent = renderVerificationEmail({
    email,
    verificationUrl,
  });
  
  // Send email
  await sendEmail({
    to: email,
    subject: emailContent.subject,
    html: emailContent.html,
  });
  
  // Also log for development
  console.log(`[Email] Verification email sent to: ${email}`);
  console.log(`[Email] Verification URL: ${verificationUrl}`);
  
  return { token, verificationUrl };
}

/**
 * Verify email token and mark tenant as verified
 */
export async function verifyEmailToken(token: string): Promise<{ success: boolean; message: string; tenantId?: string }> {
  // Find verification record
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [verification] = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.token, token))
    .limit(1);
  
  if (!verification) {
    return { success: false, message: "Ugyldig bekreftelseslenke" };
  }
  
  // Check if already verified
  if (verification.verifiedAt) {
    return { success: false, message: "E-postadressen er allerede bekreftet" };
  }
  
  // Check if expired
  if (new Date() > new Date(verification.expiresAt)) {
    return { success: false, message: "Bekreftelseslenken har utløpt. Vennligst be om en ny." };
  }
  
  // Mark as verified
  await db
    .update(emailVerifications)
    .set({ verifiedAt: new Date() })
    .where(eq(emailVerifications.id, verification.id));
  
  // Update tenant
  await db
    .update(tenants)
    .set({ 
      emailVerified: true,
      emailVerifiedAt: new Date()
    })
    .where(eq(tenants.id, verification.tenantId));
  
  return { 
    success: true, 
    message: "E-postadressen din er bekreftet!",
    tenantId: verification.tenantId
  };
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(tenantId: string): Promise<{ success: boolean; message: string }> {
  // Get tenant
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  
  if (!tenant) {
    return { success: false, message: "Fant ikke kontoen" };
  }
  
  if (tenant.emailVerified) {
    return { success: false, message: "E-postadressen er allerede bekreftet" };
  }
  
  if (!tenant.email) {
    return { success: false, message: "Ingen e-postadresse registrert" };
  }
  
  // Delete old verification tokens for this tenant
  await db
    .delete(emailVerifications)
    .where(eq(emailVerifications.tenantId, tenantId));
  
  // Send new verification email
  await sendVerificationEmail(tenantId, tenant.email);
  
  return { success: true, message: "Bekreftelse-e-post sendt!" };
}

/**
 * Render professional verification email template with Stylora branding
 * 
 * Features:
 * - Blue to orange gradient matching Stylora brand
 * - Responsive design with inline CSS
 * - Professional Norwegian text
 * - Clear call-to-action button
 * - Mobile-friendly layout
 */
function renderVerificationEmail(params: {
  email: string;
  verificationUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Bekreft e-postadressen din - Stylora",
    html: `
      <!DOCTYPE html>
      <html lang="no">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Bekreft e-postadressen din</title>
        <!--[if mso]>
        <style type="text/css">
          body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
        </style>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <!-- Wrapper table for email clients -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
          <tr>
            <td style="padding: 40px 20px;">
              <!-- Main container -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb 0%, #ea580c 100%); padding: 48px 32px; text-align: center;">
                    <!-- Logo/Brand -->
                    <div style="margin-bottom: 24px;">
                      <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); padding: 16px 24px; border-radius: 12px; backdrop-filter: blur(10px);">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                          ✂️ Stylora
                        </h1>
                      </div>
                    </div>
                    <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; line-height: 1.3;">
                      Velkommen til Stylora!
                    </h2>
                    <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; line-height: 1.5;">
                      Vi er glade for å ha deg med oss
                    </p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 48px 32px;">
                    <p style="margin: 0 0 24px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                      Hei! 👋
                    </p>
                    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Takk for at du opprettet en konto hos <strong style="color: #2563eb;">Stylora</strong>. 
                      For å komme i gang, vennligst bekreft e-postadressen din ved å klikke på knappen nedenfor:
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${params.verificationUrl}" 
                             style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); transition: transform 0.2s;">
                            Bekreft e-postadresse
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Info box -->
                    <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 16px 20px; margin: 32px 0; border-radius: 8px;">
                      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                        <strong>⏱️ Viktig:</strong> Denne lenken utløper om 24 timer av sikkerhetsgrunner.
                      </p>
                    </div>
                    
                    <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                      Hvis knappen ikke fungerer, kan du kopiere og lime inn denne lenken i nettleseren din:
                    </p>
                    <p style="margin: 0 0 24px 0; word-break: break-all;">
                      <a href="${params.verificationUrl}" 
                         style="color: #2563eb; text-decoration: underline; font-size: 14px;">
                        ${params.verificationUrl}
                      </a>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                    
                    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Hvis du ikke opprettet denne kontoen, kan du trygt ignorere denne e-posten.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 12px 0; color: #111827; font-size: 16px; font-weight: 600;">
                      Med vennlig hilsen,
                    </p>
                    <p style="margin: 0 0 24px 0; color: #2563eb; font-size: 16px; font-weight: 600;">
                      Stylora-teamet
                    </p>
                    
                    <!-- Social links placeholder -->
                    <div style="margin: 24px 0;">
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
                        Følg oss på sosiale medier
                      </p>
                      <div style="display: inline-block;">
                        <span style="color: #9ca3af; font-size: 12px;">Facebook • Instagram • LinkedIn</span>
                      </div>
                    </div>
                    
                    <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                      © ${new Date().getFullYear()} Stylora. Alle rettigheter reservert.<br>
                      Dette er en automatisk e-post, vennligst ikke svar på denne meldingen.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}
