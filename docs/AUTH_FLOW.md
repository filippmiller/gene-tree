# Authentication Flow - Gene Tree

## ✅ Current Implementation (Fixed)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                      │
└─────────────────────────────────────────────────────────────┘

1. User visits /sign-in
   ↓
2. Client Component: Browser Supabase Client
   ├─ Uses NEXT_PUBLIC_SUPABASE_ANON_KEY
   ├─ Calls signInWithPassword()
   └─ Sets auth cookie via Supabase Auth
   ↓
3. router.push('/app') + router.refresh()
   ├─ Navigates to protected route
   └─ Triggers server component re-render
   ↓
4. Protected Layout (Server Component)
   ├─ SSR Supabase Client reads cookies
   ├─ Calls getSession() - no API call!
   ├─ If no session → redirect to /sign-in
   └─ If session exists → render children
   ↓
5. Protected Page (Server Component)
   ├─ Auth already checked by layout
   ├─ Uses session from getSession()
   └─ Renders authenticated content
```

### Key Components

#### 1. Browser Client (`src/lib/supabase/browser.ts`)
```typescript
// For client components ("use client")
// Uses ANON key + persists session in cookies
export const supabase = getSupabaseBrowser();
```

**Usage:**
- Sign-in/Sign-up forms
- Client-side auth state checks
- User actions that need auth

#### 2. SSR Client (`src/lib/supabase/server-ssr.ts`)
```typescript
// For server components
// Reads cookies via createServerClient from @supabase/ssr
// Uses ANON key (respects RLS)
export async function getSupabaseSSR() { ... }
```

**Usage:**
- Protected pages
- Server-side data fetching
- Auth guards in layouts

#### 3. Admin Client (`src/lib/supabase/server-admin.ts`)
```typescript
// For API routes ONLY
// Uses SERVICE_ROLE key (bypasses RLS)
export function getSupabaseAdmin() { ... }
```

**Usage:**
- API routes that need admin access
- Operations that bypass RLS
- Sensitive operations

---

## 🔐 Protected Routes Pattern

### Layout-Based Auth Guard

**Location:** `src/app/[locale]/(protected)/layout.tsx`

```typescript
export default async function ProtectedLayout({ children, params }) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();
  
  // Use getSession() - reads from cookies directly
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect(`/${locale}/sign-in`);
  }
  
  return <>{children}</>;
}
```

**Benefits:**
- ✅ Single auth check for all protected routes
- ✅ Server-side only (no hydration mismatch)
- ✅ DRY principle (Don't Repeat Yourself)
- ✅ Better performance

### Protected Pages

Pages under `(protected)` group don't need their own auth checks:

```typescript
// src/app/[locale]/(protected)/app/page.tsx
export default async function AppPage({ params }) {
  const supabase = await getSupabaseSSR();
  
  // Auth already checked by layout - safe to use session
  const { data: { session } } = await supabase.auth.getSession();
  const user = session!.user; // Non-null assertion is safe
  
  // Render authenticated content
}
```

---

## 🔄 Sign-In Flow

### Client Component

**Location:** `src/app/[locale]/(auth)/sign-in/page.tsx`

```typescript
'use client';

// Force dynamic rendering to prevent cached guest state
export const dynamic = 'force-dynamic';

async function handleSubmit(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  });
  
  if (error) {
    // Show error to user
    return;
  }
  
  // Important: push + refresh to update server components
  router.push(`/${locale}/app`);
  router.refresh(); // Critical for server component update!
}
```

**Key Points:**
- Uses browser Supabase client
- Sets auth cookie automatically
- `router.refresh()` triggers server component re-fetch
- Server components see new auth state

---

## 🚫 Common Mistakes (Avoided)

### ❌ Don't: Use getUser() in SSR
```typescript
// BAD - makes API call, may not see cookies
const { data: { user } } = await supabase.auth.getUser();
```

### ✅ Do: Use getSession() in SSR
```typescript
// GOOD - reads from cookies directly
const { data: { session } } = await supabase.auth.getSession();
```

### ❌ Don't: window.location.href for navigation
```typescript
// BAD - doesn't trigger server component refresh
window.location.href = '/app';
```

### ✅ Do: router.push() + router.refresh()
```typescript
// GOOD - updates server components
router.push('/app');
router.refresh();
```

### ❌ Don't: Client-side auth checks in protected pages
```typescript
// BAD - causes hydration mismatch
'use client';
const [user, setUser] = useState(null);
if (!user) return <LoginForm />;
```

### ✅ Do: Server-side auth guard in layout
```typescript
// GOOD - single source of truth
export default async function ProtectedLayout() {
  const session = await checkAuth();
  if (!session) redirect('/sign-in');
  return <>{children}</>;
}
```

---

## 🐛 Debugging Auth Issues

### Check 1: Cookies
```bash
# Railway logs should show:
[PROTECTED-LAYOUT] Session valid, user: user@example.com
```

### Check 2: No Hydration Errors
Browser console should NOT show:
```
Error: Minified React error #418
Error: Minified React error #423
```

### Check 3: Session Persistence
1. Sign in
2. Refresh page (F5)
3. Should stay authenticated

### Check 4: Redirect Loop
If stuck in login loop:
1. Clear cookies
2. Check Railway env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Verify Supabase dashboard → Auth → URL Configuration

---

## 📋 Checklist for New Protected Routes

When creating a new protected page:

- [ ] Place under `src/app/[locale]/(protected)/`
- [ ] Use `getSupabaseSSR()` for data fetching
- [ ] Use `getSession()` not `getUser()`
- [ ] Don't add auth checks (layout handles it)
- [ ] Make component async (for server components)
- [ ] Use `await params` for dynamic params

Example:
```typescript
export default async function NewPage({ params }) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();
  const { data: { session } } = await supabase.auth.getSession();
  
  // Your code here
}
```

---

## 🔧 Environment Variables

### Required for Auth

```bash
# Public (embedded in client bundle)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Server-only
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://...
```

### Railway Configuration

Set in Railway dashboard:
- Project → Variables
- Don't commit secrets to git
- Use Railway CLI for local development:
  ```bash
  railway run npm run dev
  ```

---

## 📚 References

- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js 15 Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [@supabase/ssr Package](https://github.com/supabase/auth-helpers/tree/main/packages/ssr)

---

**Last Updated:** 2025-11-11  
**Status:** ✅ Production Ready  
**Version:** Next.js 15.0.3 + Supabase Auth
