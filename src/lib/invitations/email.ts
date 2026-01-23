export interface EmailInvitePayload {
  to: string;
  inviterName: string;
  inviteeName?: string;
  inviteUrl: string;
}

export interface EmailInviteResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

const RESEND_API_BASE = 'https://api.resend.com';

function buildSubject(inviterName: string): string {
  const safeInviter = inviterName || 'A family member';
  return `${safeInviter} invited you to Gene-Tree`;
}

function buildText({ inviterName, inviteeName, inviteUrl }: EmailInvitePayload): string {
  const safeInviter = inviterName || 'A family member';
  const greeting = inviteeName ? `Hi ${inviteeName},` : 'Hi,';
  return `${greeting}

${safeInviter} invited you to join their family tree on Gene-Tree.

Open your invite: ${inviteUrl}

If you were not expecting this invite, you can ignore this email.`;
}

function buildHtml({ inviterName, inviteeName, inviteUrl }: EmailInvitePayload): string {
  const safeInviter = inviterName || 'A family member';
  const greeting = inviteeName ? `Hi ${inviteeName},` : 'Hi,';
  return `
<div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
  <p>${greeting}</p>
  <p><strong>${safeInviter}</strong> invited you to join their family tree on Gene-Tree.</p>
  <p><a href="${inviteUrl}" style="color:#2563eb;">Open your invite</a></p>
  <p style="color:#6b7280; font-size: 13px;">If you were not expecting this invite, you can ignore this email.</p>
</div>
`.trim();
}

export async function sendEmailInvite(payload: EmailInvitePayload): Promise<EmailInviteResult> {
  const apiKey = process.env.RESEND_API_KEY || '';
  const from = process.env.RESEND_FROM_EMAIL || '';

  if (!apiKey || !from) {
    return { ok: false, skipped: true, error: 'missing_resend_env' };
  }

  const response = await fetch(`${RESEND_API_BASE}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: buildSubject(payload.inviterName),
      text: buildText(payload),
      html: buildHtml(payload),
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    return { ok: false, error: text || `resend_error_${response.status}` };
  }

  let parsed: { id?: string } | null = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }

  return { ok: true, id: parsed?.id };
}
