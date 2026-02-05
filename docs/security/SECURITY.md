# Gene-Tree Security Documentation

## Overview

This document describes the security measures implemented in the Gene-Tree platform to protect user data and prevent common web vulnerabilities.

## Security Features

### 1. Rate Limiting

**Location:** `src/lib/rate-limit/`, `src/middleware.ts`

Rate limiting protects against brute-force attacks and API abuse using tiered limits:

| Tier | Limit | Window | Used For |
|------|-------|--------|----------|
| `auth` | 5 requests | 1 minute | Login, register, password reset |
| `api` | 60 requests | 1 minute | General API endpoints |
| `search` | 30 requests | 1 minute | Search endpoints |
| `tree` | 20 requests | 1 minute | Tree queries (expensive) |
| `upload` | 10 requests | 1 minute | File uploads |

**Implementation:**
- Uses Upstash Redis for distributed rate limiting
- Falls back to in-memory limiting when Redis unavailable
- Returns `429 Too Many Requests` with `Retry-After` header

**Configuration:**
```bash
# Add to .env for Redis-backed rate limiting
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### 2. XSS Protection (Input Sanitization)

**Location:** `src/lib/security/sanitize.ts`

All user input is sanitized to prevent Cross-Site Scripting (XSS) attacks.

**Functions:**
- `sanitizeHtml(input)` - For rich text fields (bio, stories)
- `sanitizeText(input)` - For plain text fields (names, titles)
- `sanitizeUrl(url)` - Validates and sanitizes URLs
- `sanitizeEmail(email)` - Validates email format
- `sanitizePhone(phone)` - Extracts valid phone digits
- `sanitizeUuid(uuid)` - Validates UUID format

**Preset Sanitizers:**
```typescript
import { sanitizeProfileData, sanitizeMessageData, sanitizeStoryData } from '@/lib/security';

// Sanitize profile with HTML allowed in bio
const cleanProfile = sanitizeProfileData(dirtyProfile);

// Sanitize chat message (no HTML)
const cleanMessage = sanitizeMessageData(dirtyMessage);

// Sanitize story content with rich text
const cleanStory = sanitizeStoryData(dirtyStory);
```

### 3. CSRF Protection

**Location:** `src/lib/security/csrf.ts`

Implements double-submit cookie pattern for CSRF protection.

**Usage in API routes:**
```typescript
import { withCsrfProtection } from '@/lib/security';

export const POST = withCsrfProtection(async (request) => {
  // Your handler code
});
```

**Usage in forms:**
```typescript
import { generateCsrfToken } from '@/lib/security';

// Server component
const csrfToken = await generateCsrfToken();

// In form
<input type="hidden" name="_csrf" value={csrfToken} />
```

### 4. Security Headers

The middleware automatically adds security headers to all responses:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Enable browser XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer info |
| `Permissions-Policy` | Camera, mic, geo restrictions | Limit feature access |

### 5. SQL Injection Prevention

**Mitigation:**
- All database queries use Supabase client with parameterized queries
- `escapeLikePattern()` function for LIKE query patterns
- No raw SQL concatenation

### 6. Authentication & Authorization

**Provided by Supabase:**
- JWT-based authentication
- Row Level Security (RLS) policies
- Secure password hashing (bcrypt)

## Environment Variables

Required security-related environment variables:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional (for distributed rate limiting)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

## Security Checklist

- [x] Rate limiting on all API endpoints
- [x] XSS protection via input sanitization
- [x] CSRF protection for state-changing requests
- [x] Security headers on all responses
- [x] Parameterized database queries
- [x] Secure authentication (Supabase)
- [x] HTTPS enforced in production
- [ ] Content Security Policy (CSP) - TODO
- [ ] Subresource Integrity (SRI) - TODO

## Reporting Vulnerabilities

If you discover a security vulnerability, please email security@gene-tree.app with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

Do not disclose publicly until the issue is resolved.

## Audit Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-05 | Initial security implementation | Claude |
