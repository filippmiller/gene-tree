import { User } from '@/types/user';

const ADMIN_EMAIL = 'filippmiller@gmail.com';
const ADMIN_DEFAULT_PASSWORD = 'admin123';

function getUsersStore(): Record<string, { user: User; password: string }> {
  if (typeof window === 'undefined') return {};
  const store = localStorage.getItem('auth_users');
  if (!store) {
    initializeStore();
    return getUsersStore();
  }
  try {
    return JSON.parse(store);
  } catch {
    localStorage.removeItem('auth_users');
    initializeStore();
    return getUsersStore();
  }
}

function saveUsersStore(users: Record<string, { user: User; password: string }>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_users', JSON.stringify(users));
}

function initializeStore() {
  if (typeof window === 'undefined') return;
  const adminUser: User = {
    id: 1,
    email: ADMIN_EMAIL,
    name: 'Gene Tree Admin',
    role: 'admin',
    createdAt: new Date().toISOString(),
  };
  const store = {
    [ADMIN_EMAIL]: {
      user: adminUser,
      password: ADMIN_DEFAULT_PASSWORD,
    },
  };
  localStorage.setItem('auth_users', JSON.stringify(store));
}

function ensureInitialized() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem('auth_users')) {
    initializeStore();
  }
}

export function getSession(): User | null {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem('auth_session');
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch {
    localStorage.removeItem('auth_session');
    return null;
  }
}

export function setSession(user: User) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_session', JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_session');
}

export function signIn(email: string, password: string): Promise<User> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Authentication is only available in the browser'));
      return;
    }
    ensureInitialized();
    const users = getUsersStore();
    const record = users[email.toLowerCase()];
    if (!record || record.password !== password) {
      reject(new Error('Invalid email or password'));
      return;
    }
    setSession(record.user);
    resolve(record.user);
  });
}

export function signUp(email: string, password: string, name?: string): Promise<User> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Registration is only available in the browser'));
      return;
    }
    ensureInitialized();
    const users = getUsersStore();
    const normalizedEmail = email.toLowerCase();
    if (users[normalizedEmail]) {
      reject(new Error('User with this email already exists'));
      return;
    }
    const newUser: User = {
      id: Date.now(),
      email: normalizedEmail,
      name: name || email.split('@')[0],
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    users[normalizedEmail] = { user: newUser, password };
    saveUsersStore(users);
    setSession(newUser);
    resolve(newUser);
  });
}

export function changePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Password change is only available in the browser'));
      return;
    }
    ensureInitialized();
    const users = getUsersStore();
    const normalizedEmail = email.toLowerCase();
    const record = users[normalizedEmail];
    if (!record || record.password !== currentPassword) {
      reject(new Error('Current password is incorrect'));
      return;
    }
    record.password = newPassword;
    users[normalizedEmail] = record;
    saveUsersStore(users);
    resolve();
  });
}
