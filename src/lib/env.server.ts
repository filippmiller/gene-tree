// Server-side environment variables (NEVER expose to client)
export const envServer = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  DATABASE_URL: process.env.DATABASE_URL || '',
};

export function requireServer(name: keyof typeof envServer): string {
  const v = envServer[name];
  if (!v) {
    throw new Error(`Missing env: ${name}`);
  }
  return v;
}
