/**
 * Types for Ask the Elder feature
 */

export type ElderQuestionStatus = 'pending' | 'answered' | 'declined';
export type QuestionVisibility = 'public' | 'family' | 'private';

export interface ElderQuestion {
  id: string;
  asker_id: string;
  elder_id: string;
  question: string;
  answer: string | null;
  status: ElderQuestionStatus;
  visibility: QuestionVisibility;
  created_at: string;
  answered_at: string | null;
}

export interface ElderQuestionWithProfiles extends ElderQuestion {
  asker: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  elder: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

// API Request/Response types
export interface AskElderRequest {
  elder_id: string;
  question: string;
  visibility?: QuestionVisibility;
}

export interface AnswerQuestionRequest {
  answer: string;
  visibility?: QuestionVisibility;
}

export interface DeclineQuestionRequest {
  reason?: string;
}

export interface GetElderQuestionsResponse {
  success: boolean;
  questions: ElderQuestionWithProfiles[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AskElderResponse {
  success: boolean;
  question?: ElderQuestion;
  error?: string;
}

export interface AnswerQuestionResponse {
  success: boolean;
  question?: ElderQuestion;
  error?: string;
}

// Helper functions
export function getStatusLabel(status: ElderQuestionStatus): string {
  switch (status) {
    case 'pending':
      return 'Awaiting Answer';
    case 'answered':
      return 'Answered';
    case 'declined':
      return 'Declined';
    default:
      return status;
  }
}

export function getStatusColor(status: ElderQuestionStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'answered':
      return 'bg-green-100 text-green-800';
    case 'declined':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getVisibilityLabel(visibility: QuestionVisibility): string {
  switch (visibility) {
    case 'public':
      return 'Everyone';
    case 'family':
      return 'Family Only';
    case 'private':
      return 'Just Us';
    default:
      return visibility;
  }
}

export function getVisibilityIcon(visibility: QuestionVisibility): string {
  switch (visibility) {
    case 'public':
      return '🌐';
    case 'family':
      return '👨‍👩‍👧‍👦';
    case 'private':
      return '🔒';
    default:
      return '❓';
  }
}

export function isElder(birthDate: string | null, minAge: number = 60): boolean {
  if (!birthDate) return false;

  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age >= minAge;
}
