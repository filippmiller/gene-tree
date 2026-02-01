/**
 * Story Prompt Email Templates
 *
 * Email template for weekly story prompts that users can reply to directly.
 * The reply is parsed by the email inbound webhook and saved as a story.
 */

export interface StoryPromptEmailPayload {
  recipientName: string;
  recipientEmail: string;
  promptId: string;
  promptText: string;
  promptTextRu?: string;
  category: string;
  locale: 'en' | 'ru';
  appUrl: string;
  unsubscribeUrl: string;
}

/**
 * Build email subject with prompt ID for reply tracking
 * Format: "Your Weekly Story Prompt [PROMPT:uuid]"
 */
export function buildPromptSubject(payload: StoryPromptEmailPayload): string {
  const { locale, promptId } = payload;

  const subject = locale === 'ru'
    ? 'Ваш еженедельный вопрос для истории'
    : 'Your Weekly Story Prompt';

  // Include prompt ID for reply tracking
  return `${subject} [PROMPT:${promptId}]`;
}

/**
 * Category display names
 */
const categoryNames: Record<string, { en: string; ru: string }> = {
  childhood: { en: 'Childhood', ru: 'Детство' },
  traditions: { en: 'Family Traditions', ru: 'Семейные традиции' },
  life_lessons: { en: 'Life Lessons', ru: 'Жизненные уроки' },
  historical: { en: 'Historical', ru: 'Историческое' },
  relationships: { en: 'Relationships', ru: 'Отношения' },
  career: { en: 'Career', ru: 'Карьера' },
  personal: { en: 'Personal', ru: 'Личное' },
  favorites: { en: 'Favorites', ru: 'Любимое' },
};

/**
 * Build plain text version
 */
export function buildPromptText(payload: StoryPromptEmailPayload): string {
  const {
    recipientName,
    promptText,
    promptTextRu,
    category,
    locale,
    appUrl,
    unsubscribeUrl,
  } = payload;

  const isRu = locale === 'ru';
  const greeting = recipientName
    ? isRu ? `Привет, ${recipientName}!` : `Hi ${recipientName}!`
    : isRu ? 'Привет!' : 'Hi!';

  const categoryLabel = categoryNames[category]?.[locale] || category;
  const prompt = isRu && promptTextRu ? promptTextRu : promptText;

  if (isRu) {
    return `${greeting}

На этой неделе мы хотели бы услышать от вас:

${prompt}

Категория: ${categoryLabel}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ПРОСТО ОТВЕТЬТЕ НА ЭТО ПИСЬМО
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ваш ответ будет автоматически сохранён как история в вашем семейном древе. Пишите сколько хотите - несколько предложений или целую страницу!

Или напишите историю на нашем сайте: ${appUrl}/stories/write

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

С теплом,
Команда GeneTree

Отписаться от еженедельных вопросов: ${unsubscribeUrl}`;
  }

  return `${greeting}

This week, we'd love to hear from you:

${prompt}

Category: ${categoryLabel}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIMPLY REPLY TO THIS EMAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your reply will be automatically saved as a story in your family tree. Write as much or as little as you'd like - a few sentences or a whole page!

Or write your story on our website: ${appUrl}/stories/write

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Warm regards,
The GeneTree Team

Unsubscribe from weekly prompts: ${unsubscribeUrl}`;
}

/**
 * Build HTML version
 */
export function buildPromptHtml(payload: StoryPromptEmailPayload): string {
  const {
    recipientName,
    promptText,
    promptTextRu,
    category,
    locale,
    appUrl,
    unsubscribeUrl,
  } = payload;

  const isRu = locale === 'ru';
  const greeting = recipientName
    ? isRu ? `Привет, ${recipientName}!` : `Hi ${recipientName}!`
    : isRu ? 'Привет!' : 'Hi!';

  const categoryLabel = categoryNames[category]?.[locale] || category;
  const prompt = isRu && promptTextRu ? promptTextRu : promptText;

  const labels = isRu
    ? {
        weeklyPrompt: 'Ваш еженедельный вопрос',
        category: 'Категория',
        replyInstructions: 'Просто ответьте на это письмо',
        replyExplanation: 'Ваш ответ будет автоматически сохранён как история в вашем семейном древе. Пишите сколько хотите — несколько предложений или целую страницу!',
        orWriteOnline: 'Или напишите на сайте',
        writeStory: 'Написать историю',
        warmRegards: 'С теплом,',
        teamName: 'Команда GeneTree',
        unsubscribe: 'Отписаться от еженедельных вопросов',
      }
    : {
        weeklyPrompt: 'Your Weekly Story Prompt',
        category: 'Category',
        replyInstructions: 'Simply reply to this email',
        replyExplanation: 'Your reply will be automatically saved as a story in your family tree. Write as much or as little as you\'d like — a few sentences or a whole page!',
        orWriteOnline: 'Or write on our website',
        writeStory: 'Write Your Story',
        warmRegards: 'Warm regards,',
        teamName: 'The GeneTree Team',
        unsubscribe: 'Unsubscribe from weekly prompts',
      };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${labels.weeklyPrompt}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 40px; border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🌳 ${labels.weeklyPrompt}
              </h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                ${greeting}
              </p>

              <!-- Prompt Box -->
              <div style="background: linear-gradient(135deg, #faf5ff 0%, #f0fdf4 100%); border: 2px solid #a78bfa; border-radius: 12px; padding: 32px; margin: 24px 0;">
                <p style="margin: 0 0 12px; color: #7c3aed; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                  ${labels.category}: ${categoryLabel}
                </p>
                <p style="margin: 0; color: #1f2937; font-size: 22px; font-weight: 500; line-height: 1.4;">
                  "${prompt}"
                </p>
              </div>

              <!-- Reply Instructions -->
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 8px; color: #92400e; font-size: 18px; font-weight: 600;">
                  ↩️ ${labels.replyInstructions}
                </p>
                <p style="margin: 0; color: #a16207; font-size: 14px; line-height: 1.5;">
                  ${labels.replyExplanation}
                </p>
              </div>

              <!-- Alternative CTA -->
              <p style="margin: 24px 0 16px; color: #6b7280; font-size: 14px; text-align: center;">
                ${labels.orWriteOnline}
              </p>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/stories/write"
                       style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      ${labels.writeStory} →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #374151; font-size: 14px;">
                ${labels.warmRegards}<br>
                <strong>${labels.teamName}</strong>
              </p>
              <p style="margin: 16px 0 0; color: #9ca3af; font-size: 12px;">
                <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">
                  ${labels.unsubscribe}
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
