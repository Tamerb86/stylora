/**
 * Monitoring Alerts Service
 * 
 * Sends email alerts when critical monitoring issues are detected:
 * - Critical: 3+ consecutive failures, health < 70
 * - Error: Last sync failed, success rate < 80%
 * - Warning: No syncs in 24h, slow performance
 */

import { logSecurity } from '../_core/logger';
import { sendEmail } from '../email';

export interface MonitoringAlert {
  severity: 'critical' | 'error' | 'warning' | 'info';
  component: string;
  title: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

/**
 * Send email alert for monitoring issues
 */
export async function sendMonitoringAlert(
  tenantId: string,
  alert: MonitoringAlert,
  recipientEmail: string
): Promise<boolean> {
  try {
    const severityColors = {
      critical: '#dc2626', // red-600
      error: '#ea580c', // orange-600
      warning: '#ca8a04', // yellow-600
      info: '#2563eb', // blue-600
    };

    const severityLabels = {
      critical: 'KRITISK',
      error: 'FEIL',
      warning: 'ADVARSEL',
      info: 'INFO',
    };

    const color = severityColors[alert.severity];
    const label = severityLabels[alert.severity];

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Systemovervåking Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                ⚠️ Systemovervåking Alert
              </h1>
            </td>
          </tr>

          <!-- Alert Badge -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <div style="background-color: ${color}; color: #ffffff; padding: 10px 20px; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 14px;">
                ${label}
              </div>
            </td>
          </tr>

          <!-- Alert Title -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <h2 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">
                ${alert.title}
              </h2>
            </td>
          </tr>

          <!-- Alert Message -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${alert.message}
              </p>
            </td>
          </tr>

          <!-- Component -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 15px;">
                <tr>
                  <td style="color: #6b7280; font-size: 14px; font-weight: 600;">
                    Komponent:
                  </td>
                  <td style="color: #1f2937; font-size: 14px; text-align: right;">
                    ${alert.component}
                  </td>
                </tr>
                <tr>
                  <td style="color: #6b7280; font-size: 14px; font-weight: 600; padding-top: 10px;">
                    Tidspunkt:
                  </td>
                  <td style="color: #1f2937; font-size: 14px; text-align: right; padding-top: 10px;">
                    ${alert.timestamp.toLocaleString('no-NO', { 
                      dateStyle: 'medium', 
                      timeStyle: 'short' 
                    })}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${alert.details ? `
          <!-- Details -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                Detaljer:
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 15px;">
                ${Object.entries(alert.details).map(([key, value]) => `
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">
                      ${key}:
                    </td>
                    <td style="color: #1f2937; font-size: 14px; text-align: right; padding: 5px 0;">
                      ${value}
                    </td>
                  </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Action Button -->
          <tr>
            <td style="padding: 0 40px 30px; text-align: center;">
              <a href="${process.env.VITE_APP_URL || 'https://stylora.no'}/monitoring" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Gå til Monitoring Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Dette er en automatisk varsling fra Stylora Systemovervåking.
              </p>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                Hvis du trenger hjelp, kontakt support@stylora.no
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
SYSTEMOVERVÅKING ALERT - ${label}

${alert.title}

${alert.message}

Komponent: ${alert.component}
Tidspunkt: ${alert.timestamp.toLocaleString('no-NO')}

${alert.details ? `
Detaljer:
${Object.entries(alert.details).map(([key, value]) => `${key}: ${value}`).join('\n')}
` : ''}

Gå til Monitoring Dashboard: ${process.env.VITE_APP_URL || 'https://stylora.no'}/monitoring

---
Dette er en automatisk varsling fra Stylora Systemovervåking.
Hvis du trenger hjelp, kontakt support@stylora.no
    `.trim();

    await sendEmail({
      to: recipientEmail,
      subject: `[${label}] ${alert.title} - Stylora Systemovervåking`,
      html: htmlContent,
    });
    
    const success = true;

    if (success) {
      logSecurity(`Monitoring alert email sent: ${alert.severity} - ${alert.title}`, {
        tenantId,
        component: alert.component,
        recipient: recipientEmail,
      });
    } else {
      logSecurity(`Failed to send monitoring alert email: ${alert.title}`, {
        tenantId,
        component: alert.component,
        recipient: recipientEmail,
      });
    }

    return success;
  } catch (error) {
    logSecurity(`Error sending monitoring alert email: ${error}`, {
      tenantId,
      alert: alert.title,
    });
    return false;
  }
}

/**
 * Check if alert should be sent based on cooldown period
 * Prevents alert spam by enforcing minimum time between alerts
 */
const alertCooldowns = new Map<string, number>();
const COOLDOWN_MINUTES = {
  critical: 15, // 15 minutes between critical alerts
  error: 30, // 30 minutes between error alerts
  warning: 60, // 1 hour between warning alerts
  info: 120, // 2 hours between info alerts
};

export function shouldSendAlert(
  alertKey: string,
  severity: MonitoringAlert['severity']
): boolean {
  const now = Date.now();
  const lastSent = alertCooldowns.get(alertKey);
  const cooldownMs = COOLDOWN_MINUTES[severity] * 60 * 1000;

  if (!lastSent || now - lastSent > cooldownMs) {
    alertCooldowns.set(alertKey, now);
    return true;
  }

  return false;
}

/**
 * Create alert for Unimicro sync failure
 */
export async function alertUnimicroFailure(
  tenantId: string,
  recipientEmail: string,
  failureCount: number,
  lastError: string
): Promise<boolean> {
  const alertKey = `unimicro-failure-${tenantId}`;
  
  if (!shouldSendAlert(alertKey, 'critical')) {
    return false;
  }

  const alert: MonitoringAlert = {
    severity: 'critical',
    component: 'Unimicro Integration',
    title: 'Unimicro Sync Feilet',
    message: `Unimicro-synkronisering har feilet ${failureCount} ganger på rad. Vennligst sjekk integrasjonsinnstillingene og loggene.`,
    details: {
      'Antall feil': failureCount,
      'Siste feilmelding': lastError,
    },
    timestamp: new Date(),
  };

  return await sendMonitoringAlert(tenantId, alert, recipientEmail);
}

/**
 * Create alert for low email delivery rate
 */
export async function alertLowEmailDeliveryRate(
  tenantId: string,
  recipientEmail: string,
  successRate: number,
  totalSent: number,
  failedCount: number
): Promise<boolean> {
  const alertKey = `email-delivery-${tenantId}`;
  const severity = successRate < 50 ? 'critical' : 'error';
  
  if (!shouldSendAlert(alertKey, severity)) {
    return false;
  }

  const alert: MonitoringAlert = {
    severity,
    component: 'Email Service',
    title: 'Lav E-post Leveringsrate',
    message: `E-post leveringsraten er ${successRate.toFixed(1)}%, som er under terskelen. Sjekk SMTP-innstillingene.`,
    details: {
      'Suksessrate': `${successRate.toFixed(1)}%`,
      'Totalt sendt': totalSent,
      'Feilet': failedCount,
    },
    timestamp: new Date(),
  };

  return await sendMonitoringAlert(tenantId, alert, recipientEmail);
}

/**
 * Create alert for low SMS delivery rate
 */
export async function alertLowSMSDeliveryRate(
  tenantId: string,
  recipientEmail: string,
  successRate: number,
  totalSent: number,
  failedCount: number
): Promise<boolean> {
  const alertKey = `sms-delivery-${tenantId}`;
  const severity = successRate < 50 ? 'critical' : 'error';
  
  if (!shouldSendAlert(alertKey, severity)) {
    return false;
  }

  const alert: MonitoringAlert = {
    severity,
    component: 'SMS Service',
    title: 'Lav SMS Leveringsrate',
    message: `SMS leveringsraten er ${successRate.toFixed(1)}%, som er under terskelen. Sjekk SMS-leverandørinnstillingene.`,
    details: {
      'Suksessrate': `${successRate.toFixed(1)}%`,
      'Totalt sendt': totalSent,
      'Feilet': failedCount,
    },
    timestamp: new Date(),
  };

  return await sendMonitoringAlert(tenantId, alert, recipientEmail);
}

/**
 * Create alert for system health degradation
 */
export async function alertSystemHealthDegraded(
  tenantId: string,
  recipientEmail: string,
  healthScore: number,
  issues: string[]
): Promise<boolean> {
  const alertKey = `system-health-${tenantId}`;
  const severity = healthScore < 50 ? 'critical' : 'warning';
  
  if (!shouldSendAlert(alertKey, severity)) {
    return false;
  }

  const alert: MonitoringAlert = {
    severity,
    component: 'System Health',
    title: 'Systemhelse Forverret',
    message: `Systemhelsepoengsum er ${healthScore}/100. Følgende problemer ble oppdaget: ${issues.join(', ')}`,
    details: {
      'Helsepoengsum': `${healthScore}/100`,
      'Antall problemer': issues.length,
    },
    timestamp: new Date(),
  };

  return await sendMonitoringAlert(tenantId, alert, recipientEmail);
}
