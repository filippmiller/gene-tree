export type UserRole = 'admin' | 'editor' | 'viewer' | 'user';

export interface User {
  id: number;
  email: string;
  name?: string | null;
  role: UserRole;
  createdAt: string;
}
