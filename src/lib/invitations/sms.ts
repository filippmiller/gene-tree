export interface SmsInvitePayload {
  to: string;
  inviterName: string;
  inviteeName?: string;
  inviteUrl: string;
}

export interface SmsInviteResult {
  ok: boolean;
  sid?: string;
  error?: string;
  skipped?: boolean;
}

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01';

function buildMessage({ inviterName, inviteeName, inviteUrl }: SmsInvitePayload): string {
  const safeInviter = inviterName || 'A family member';
  const safeInvitee = inviteeName ? `Hi ${inviteeName}! ` : 'Hi! ';
  return `${safeInvitee}${safeInviter} invited you to Gene-Tree. Join: ${inviteUrl}`;
}

export async function sendSmsInvite(payload: SmsInvitePayload): Promise<SmsInviteResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
  const authToken = process.env.TWILIO_AUTH_TOKEN || '';
  const from = process.env.TWILIO_PHONE_NUMBER || '';

  if (!accountSid || !authToken || !from) {
    return { ok: false, skipped: true, error: 'missing_twilio_env' };
  }

  const url = `${TWILIO_API_BASE}/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams();
  body.set('To', payload.to);
  body.set('From', from);
  body.set('Body', buildMessage(payload));

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const text = await response.text();
  if (!response.ok) {
    return { ok: false, error: text || `twilio_error_${response.status}` };
  }

  let parsed: { sid?: string } | null = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }

  return { ok: true, sid: parsed?.sid };
}
