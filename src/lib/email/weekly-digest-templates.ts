/**
 * Weekly Family Digest Email Templates
 *
 * Beautiful HTML email template for the weekly family digest.
 * Contains sections for:
 * - Upcoming birthdays
 * - New stories/photos
 * - "On this day" memories
 * - Pending invitations
 */

export interface DigestBirthday {
  personName: string;
  dayName: string; // e.g., "Thursday", "Saturday"
  age?: number;
  profileId: string;
  avatarUrl?: string;
}

export interface DigestStory {
  authorName: string;
  title: string;
  preview: string;
  storyId: string;
  mediaType: 'text' | 'photo' | 'voice';
  createdAt: string;
}

export interface DigestMemory {
  title: string;
  yearsAgo: number;
  eventType: 'anniversary' | 'photo' | 'story';
  profileId?: string;
}

export interface DigestInvitation {
  inviterName: string;
  relationshipType: string;
  inviteToken: string;
}

export interface WeeklyDigestPayload {
  recipientName: string;
  recipientEmail: string;
  familyName?: string;
  weekStartDate: string;
  weekEndDate: string;
  birthdays: DigestBirthday[];
  stories: DigestStory[];
  memories: DigestMemory[];
  pendingInvites: DigestInvitation[];
  appUrl: string;
  unsubscribeUrl: string;
}

/**
 * Build email subject line
 */
export function buildDigestSubject(payload: WeeklyDigestPayload): string {
  const { birthdays, stories, pendingInvites } = payload;

  // Prioritize what goes in subject
  if (birthdays.length > 0) {
    if (birthdays.length === 1) {
      return `${birthdays[0].personName}'s birthday is coming up this week`;
    }
    return `${birthdays.length} family birthdays this week`;
  }

  if (pendingInvites.length > 0) {
    return `You have ${pendingInvites.length} pending family invitation${pendingInvites.length > 1 ? 's' : ''}`;
  }

  if (stories.length > 0) {
    return `${stories.length} new ${stories.length === 1 ? 'story' : 'stories'} in your family tree`;
  }

  return 'Your Weekly Family Digest';
}

/**
 * Build plain text version
 */
export function buildDigestText(payload: WeeklyDigestPayload): string {
  const {
    recipientName,
    familyName,
    birthdays,
    stories,
    memories,
    pendingInvites,
    appUrl,
    unsubscribeUrl
  } = payload;

  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';
  const treeLabel = familyName ? `the ${familyName} family tree` : 'your family tree';

  let text = `${greeting}

Here's what's happening in ${treeLabel} this week.

`;

  // Birthdays Section
  if (birthdays.length > 0) {
    text += `UPCOMING BIRTHDAYS\n`;
    text += `${'='.repeat(40)}\n`;
    for (const bday of birthdays) {
      const ageText = bday.age ? ` (turning ${bday.age})` : '';
      text += `- ${bday.personName}'s birthday is ${bday.dayName}${ageText}\n`;
    }
    text += '\n';
  }

  // Stories Section
  if (stories.length > 0) {
    text += `NEW STORIES THIS WEEK\n`;
    text += `${'='.repeat(40)}\n`;
    for (const story of stories) {
      text += `- ${story.authorName} added: ${story.title || story.preview}\n`;
    }
    text += '\n';
  }

  // Memories Section
  if (memories.length > 0) {
    text += `ON THIS DAY\n`;
    text += `${'='.repeat(40)}\n`;
    for (const memory of memories) {
      text += `- ${memory.yearsAgo} years ago: ${memory.title}\n`;
    }
    text += '\n';
  }

  // Pending Invites Section
  if (pendingInvites.length > 0) {
    text += `PENDING INVITATIONS\n`;
    text += `${'='.repeat(40)}\n`;
    for (const invite of pendingInvites) {
      text += `- ${invite.inviterName} invited you as ${invite.relationshipType}\n`;
    }
    text += '\n';
  }

  text += `View Your Family Tree: ${appUrl}/app\n\n`;
  text += `---\n`;
  text += `You're receiving this because you enabled weekly digests.\n`;
  text += `Unsubscribe: ${unsubscribeUrl}\n`;

  return text;
}

/**
 * Build HTML email version
 */
export function buildDigestHtml(payload: WeeklyDigestPayload): string {
  const {
    recipientName,
    familyName,
    birthdays,
    stories,
    memories,
    pendingInvites,
    appUrl,
    unsubscribeUrl
  } = payload;

  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';
  const treeLabel = familyName ? `the ${familyName} family tree` : 'your family tree';

  // Determine if we have any content
  const hasContent = birthdays.length > 0 || stories.length > 0 || memories.length > 0 || pendingInvites.length > 0;

  let sectionsHtml = '';

  // Birthdays Section
  if (birthdays.length > 0) {
    let birthdayRows = '';
    for (const bday of birthdays) {
      const ageText = bday.age ? `<span style="color: #6b7280; font-size: 14px;"> turning ${bday.age}</span>` : '';
      birthdayRows += `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
            <div style="display: flex; align-items: center;">
              <div style="width: 40px; height: 40px; border-radius: 20px; background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 20px;">
                🎂
              </div>
              <div>
                <div style="font-weight: 600; color: #111827;">${bday.personName}</div>
                <div style="font-size: 14px; color: #6b7280;">${bday.dayName}${ageText}</div>
              </div>
            </div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
            <a href="${appUrl}/profile/${bday.profileId}" style="color: #2563eb; font-size: 14px; text-decoration: none;">Send wishes</a>
          </td>
        </tr>
      `;
    }

    sectionsHtml += `
      <div style="margin-bottom: 32px;">
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); display: flex; align-items: center; justify-content: center; margin-right: 12px;">
            <span style="font-size: 16px;">🎂</span>
          </div>
          <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">Upcoming Birthdays</h2>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          ${birthdayRows}
        </table>
      </div>
    `;
  }

  // Stories Section
  if (stories.length > 0) {
    let storyRows = '';
    for (const story of stories) {
      const icon = story.mediaType === 'photo' ? '📷' : story.mediaType === 'voice' ? '🎙️' : '📝';
      storyRows += `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
            <div style="display: flex; align-items: flex-start;">
              <div style="width: 40px; height: 40px; border-radius: 8px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 18px; flex-shrink: 0;">
                ${icon}
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 500; color: #111827;">${story.title || 'New Story'}</div>
                <div style="font-size: 14px; color: #6b7280;">by ${story.authorName}</div>
              </div>
            </div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right; vertical-align: top;">
            <a href="${appUrl}/stories/${story.storyId}" style="color: #2563eb; font-size: 14px; text-decoration: none;">Read</a>
          </td>
        </tr>
      `;
    }

    sectionsHtml += `
      <div style="margin-bottom: 32px;">
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: #dbeafe; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
            <span style="font-size: 16px;">📚</span>
          </div>
          <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">New Stories This Week</h2>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          ${storyRows}
        </table>
      </div>
    `;
  }

  // Memories Section
  if (memories.length > 0) {
    let memoryItems = '';
    for (const memory of memories) {
      memoryItems += `
        <div style="padding: 12px 16px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; margin-bottom: 8px;">
          <div style="font-weight: 500; color: #92400e;">${memory.yearsAgo} years ago</div>
          <div style="font-size: 14px; color: #78350f; margin-top: 4px;">${memory.title}</div>
        </div>
      `;
    }

    sectionsHtml += `
      <div style="margin-bottom: 32px;">
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); display: flex; align-items: center; justify-content: center; margin-right: 12px;">
            <span style="font-size: 16px;">📅</span>
          </div>
          <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">On This Day</h2>
        </div>
        ${memoryItems}
      </div>
    `;
  }

  // Pending Invites Section
  if (pendingInvites.length > 0) {
    let inviteRows = '';
    for (const invite of pendingInvites) {
      inviteRows += `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
            <div style="font-weight: 500; color: #111827;">${invite.inviterName}</div>
            <div style="font-size: 14px; color: #6b7280;">invited you as ${invite.relationshipType}</div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
            <a href="${appUrl}/invite/${invite.inviteToken}" style="display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
              Respond
            </a>
          </td>
        </tr>
      `;
    }

    sectionsHtml += `
      <div style="margin-bottom: 32px; background: #fef2f2; border-radius: 12px; padding: 20px; border: 1px solid #fecaca;">
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: #fee2e2; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
            <span style="font-size: 16px;">✉️</span>
          </div>
          <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #991b1b;">Pending Invitations</h2>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          ${inviteRows}
        </table>
      </div>
    `;
  }

  // No content message
  if (!hasContent) {
    sectionsHtml = `
      <div style="text-align: center; padding: 40px 20px; background: #f9fafb; border-radius: 12px;">
        <div style="font-size: 48px; margin-bottom: 16px;">🌳</div>
        <div style="font-size: 16px; color: #6b7280;">
          It's been a quiet week in your family tree.<br/>
          Why not add a story or invite a relative?
        </div>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Family Digest</title>
</head>
<body style="margin: 0; padding: 0; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">

    <!-- Header -->
    <div style="text-align: center; padding: 32px 0;">
      <div style="font-size: 40px; margin-bottom: 8px;">🌳</div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Your Week in Family History</h1>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
        Gene-Tree Weekly Digest
      </p>
    </div>

    <!-- Main Content Card -->
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">

      <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0;">
        ${greeting}<br/><br/>
        Here's what's happening in ${treeLabel} this week.
      </p>

      ${sectionsHtml}

      <!-- CTA Button -->
      <div style="text-align: center; margin-top: 32px;">
        <a href="${appUrl}/app" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          View Your Family Tree
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px 0; color: #9ca3af; font-size: 13px;">
      <p style="margin: 0 0 8px 0;">
        You're receiving this because you enabled weekly digests.
      </p>
      <p style="margin: 0;">
        <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe from weekly digest</a>
        &nbsp;|&nbsp;
        <a href="${appUrl}/family-profile/settings" style="color: #6b7280; text-decoration: underline;">Email preferences</a>
      </p>
      <p style="margin: 16px 0 0 0; color: #d1d5db;">
        Gene-Tree - Connecting Families
      </p>
    </div>

  </div>
</body>
</html>
`.trim();
}
