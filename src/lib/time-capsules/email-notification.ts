/**
 * Time Capsule Email Notifications
 * Sends email notifications when time capsules are delivered
 */

export interface TimeCapsuleEmailPayload {
  to: string;
  recipientName: string;
  senderName: string;
  capsuleTitle: string;
  viewUrl: string;
  locale?: 'en' | 'ru';
}

export interface TimeCapsuleEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

const RESEND_API_BASE = 'https://api.resend.com';

const translations = {
  en: {
    subject: (senderName: string) => `${senderName} sent you a time capsule`,
    greeting: (name: string) => `Hi ${name},`,
    message: (senderName: string) => `<strong>${senderName}</strong> has sent you a time capsule message. It was created in the past and scheduled to be delivered to you today.`,
    viewButton: 'Open Time Capsule',
    footer: 'Time capsules are special messages sent across time. This message may contain precious memories, wishes, or thoughts from the sender.',
  },
  ru: {
    subject: (senderName: string) => `${senderName} отправил(а) вам капсулу времени`,
    greeting: (name: string) => `Привет, ${name}!`,
    message: (senderName: string) => `<strong>${senderName}</strong> отправил(а) вам послание из прошлого. Эта капсула времени была создана ранее и запланирована к доставке сегодня.`,
    viewButton: 'Открыть капсулу',
    footer: 'Капсулы времени — это особые послания, путешествующие сквозь время. Это сообщение может содержать драгоценные воспоминания, пожелания или мысли отправителя.',
  },
};

function buildSubject(senderName: string, locale: 'en' | 'ru'): string {
  const t = translations[locale];
  return t.subject(senderName || 'Someone');
}

function buildText(payload: TimeCapsuleEmailPayload): string {
  const locale = payload.locale || 'en';
  const t = translations[locale];

  return `${t.greeting(payload.recipientName)}

${t.message(payload.senderName).replace(/<[^>]+>/g, '')}

"${payload.capsuleTitle}"

${t.viewButton}: ${payload.viewUrl}

${t.footer}`;
}

function buildHtml(payload: TimeCapsuleEmailPayload): string {
  const locale = payload.locale || 'en';
  const t = translations[locale];

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 560px; margin: 0 auto;">
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
              <div style="width: 64px; height: 64px; margin: 0 auto 16px; background-color: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">⏳</span>
              </div>
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">Time Capsule Delivered</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background-color: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <p style="margin: 0 0 16px; color: #111827; font-size: 16px;">${t.greeting(payload.recipientName)}</p>

              <p style="margin: 0 0 24px; color: #374151; font-size: 15px; line-height: 1.6;">${t.message(payload.senderName)}</p>

              <!-- Capsule title card -->
              <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Time Capsule</p>
                <p style="margin: 8px 0 0; color: #111827; font-size: 18px; font-weight: 600;">"${payload.capsuleTitle}"</p>
              </div>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="${payload.viewUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px -3px rgba(245, 158, 11, 0.4);">
                      ${t.viewButton}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Footer note -->
              <p style="margin: 32px 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; line-height: 1.5;">
                ${t.footer}
              </p>
            </td>
          </tr>

          <!-- App footer -->
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Sent with ❤️ from <a href="https://gene-tree.com" style="color: #f59e0b; text-decoration: none;">Gene-Tree</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export async function sendTimeCapsuleNotification(
  payload: TimeCapsuleEmailPayload
): Promise<TimeCapsuleEmailResult> {
  const apiKey = process.env.RESEND_API_KEY || '';
  const from = process.env.RESEND_FROM_EMAIL || '';

  if (!apiKey || !from) {
    console.warn('[TimeCapsuleEmail] Missing RESEND_API_KEY or RESEND_FROM_EMAIL');
    return { ok: false, skipped: true, error: 'missing_resend_env' };
  }

  const locale = payload.locale || 'en';

  try {
    const response = await fetch(`${RESEND_API_BASE}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: buildSubject(payload.senderName, locale),
        text: buildText(payload),
        html: buildHtml(payload),
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      console.error('[TimeCapsuleEmail] Resend error:', text);
      return { ok: false, error: text || `resend_error_${response.status}` };
    }

    let parsed: { id?: string } | null = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    console.log('[TimeCapsuleEmail] Email sent successfully:', parsed?.id);
    return { ok: true, id: parsed?.id };
  } catch (error) {
    console.error('[TimeCapsuleEmail] Network error:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'network_error' };
  }
}
