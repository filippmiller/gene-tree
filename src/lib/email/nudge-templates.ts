/**
 * Email templates for birthday/anniversary/memorial nudges
 */

export interface BirthdayEmailPayload {
  recipientName: string;
  personName: string;
  age?: number;
  daysUntil: number; // 0 = today, 1 = tomorrow
  profileUrl: string;
}

export interface AnniversaryEmailPayload {
  recipientName: string;
  person1Name: string;
  person2Name: string;
  yearsMarried?: number;
  daysUntil: number;
  profileUrl: string;
}

export interface MemorialEmailPayload {
  recipientName: string;
  personName: string;
  yearsSince?: number;
  tributeUrl: string;
}

function formatDaysUntil(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

// Birthday Email Templates
export function buildBirthdaySubject(personName: string, daysUntil: number): string {
  if (daysUntil === 0) {
    return `Today is ${personName}'s birthday!`;
  }
  if (daysUntil === 1) {
    return `Tomorrow is ${personName}'s birthday`;
  }
  return `${personName}'s birthday is coming up`;
}

export function buildBirthdayText(payload: BirthdayEmailPayload): string {
  const { recipientName, personName, age, daysUntil, profileUrl } = payload;
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';
  const when = formatDaysUntil(daysUntil);
  const ageText = age ? ` They will be turning ${age}.` : '';

  if (daysUntil === 0) {
    return `${greeting}

Today is ${personName}'s birthday!${ageText}

Send them your best wishes on Gene-Tree: ${profileUrl}

-- Gene-Tree Family`;
  }

  return `${greeting}

${personName}'s birthday is ${when}.${ageText}

Don't forget to send your wishes: ${profileUrl}

-- Gene-Tree Family`;
}

export function buildBirthdayHtml(payload: BirthdayEmailPayload): string {
  const { recipientName, personName, age, daysUntil, profileUrl } = payload;
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';
  const when = formatDaysUntil(daysUntil);
  const ageText = age ? ` They will be turning <strong>${age}</strong>.` : '';

  const mainMessage =
    daysUntil === 0
      ? `Today is <strong>${personName}'s birthday</strong>!${ageText}`
      : `<strong>${personName}'s</strong> birthday is ${when}.${ageText}`;

  return `
<div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 480px;">
  <p>${greeting}</p>
  <p>${mainMessage}</p>
  <p>
    <a href="${profileUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
      Send Birthday Wishes
    </a>
  </p>
  <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">-- Gene-Tree Family</p>
</div>
`.trim();
}

// Anniversary Email Templates
export function buildAnniversarySubject(
  person1Name: string,
  person2Name: string,
  daysUntil: number
): string {
  if (daysUntil === 0) {
    return `Happy Anniversary to ${person1Name} and ${person2Name}!`;
  }
  if (daysUntil === 1) {
    return `${person1Name} and ${person2Name}'s anniversary is tomorrow`;
  }
  return `${person1Name} and ${person2Name}'s anniversary is coming up`;
}

export function buildAnniversaryText(payload: AnniversaryEmailPayload): string {
  const { recipientName, person1Name, person2Name, yearsMarried, daysUntil, profileUrl } = payload;
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';
  const when = formatDaysUntil(daysUntil);
  const yearsText = yearsMarried ? ` They are celebrating ${yearsMarried} years together.` : '';

  if (daysUntil === 0) {
    return `${greeting}

Today is ${person1Name} and ${person2Name}'s wedding anniversary!${yearsText}

Send them your congratulations: ${profileUrl}

-- Gene-Tree Family`;
  }

  return `${greeting}

${person1Name} and ${person2Name}'s wedding anniversary is ${when}.${yearsText}

Don't forget to celebrate with them: ${profileUrl}

-- Gene-Tree Family`;
}

export function buildAnniversaryHtml(payload: AnniversaryEmailPayload): string {
  const { recipientName, person1Name, person2Name, yearsMarried, daysUntil, profileUrl } = payload;
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';
  const when = formatDaysUntil(daysUntil);
  const yearsText = yearsMarried
    ? ` They are celebrating <strong>${yearsMarried} years</strong> together.`
    : '';

  const mainMessage =
    daysUntil === 0
      ? `Today is <strong>${person1Name}</strong> and <strong>${person2Name}'s</strong> wedding anniversary!${yearsText}`
      : `<strong>${person1Name}</strong> and <strong>${person2Name}'s</strong> wedding anniversary is ${when}.${yearsText}`;

  return `
<div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 480px;">
  <p>${greeting}</p>
  <p>${mainMessage}</p>
  <p>
    <a href="${profileUrl}" style="display: inline-block; background: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
      Celebrate Together
    </a>
  </p>
  <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">-- Gene-Tree Family</p>
</div>
`.trim();
}

// Memorial Email Templates
export function buildMemorialSubject(personName: string): string {
  return `Remembering ${personName}`;
}

export function buildMemorialText(payload: MemorialEmailPayload): string {
  const { recipientName, personName, yearsSince, tributeUrl } = payload;
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';
  const yearsText = yearsSince ? ` It has been ${yearsSince} years since they passed.` : '';

  return `${greeting}

Today we remember ${personName}.${yearsText}

Share a memory or light a candle: ${tributeUrl}

-- Gene-Tree Family`;
}

export function buildMemorialHtml(payload: MemorialEmailPayload): string {
  const { recipientName, personName, yearsSince, tributeUrl } = payload;
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';
  const yearsText = yearsSince
    ? ` It has been <strong>${yearsSince} years</strong> since they passed.`
    : '';

  return `
<div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 480px;">
  <p>${greeting}</p>
  <p>Today we remember <strong>${personName}</strong>.${yearsText}</p>
  <p>
    <a href="${tributeUrl}" style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
      Share a Memory
    </a>
  </p>
  <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">-- Gene-Tree Family</p>
</div>
`.trim();
}
