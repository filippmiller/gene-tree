#!/usr/bin/env node
/**
 * Generate Supabase JWT keys for Railway self-hosted deployment
 *
 * Run: node scripts/generate-supabase-keys.mjs
 */

import crypto from 'crypto';

// Generate a random JWT secret (32+ bytes recommended)
const jwtSecret = crypto.randomBytes(32).toString('base64');

// Helper to create JWT (simple implementation for anon/service keys)
function createJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };

  const base64UrlEncode = (obj) => {
    const json = JSON.stringify(obj);
    const base64 = Buffer.from(json).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(payload);

  const signatureInput = `${headerEncoded}.${payloadEncoded}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

// Standard Supabase JWT payloads
const anonPayload = {
  role: 'anon',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 years
};

const servicePayload = {
  role: 'service_role',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 years
};

const anonKey = createJWT(anonPayload, jwtSecret);
const serviceKey = createJWT(servicePayload, jwtSecret);

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║           Supabase JWT Keys for Railway Deployment                         ║
╚════════════════════════════════════════════════════════════════════════════╝

Copy these values into your Railway dashboard:

┌─────────────────────────────────────────────────────────────────────────────┐
│ AUTH_JWT_SECRET (also called JWT_SECRET)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
${jwtSecret}
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SUPABASE_ANON_KEY (also called ANON_KEY)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
${anonKey}
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SUPABASE_SERVICE_KEY (also called SERVICE_ROLE_KEY)                         │
├─────────────────────────────────────────────────────────────────────────────┤
${serviceKey}
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ GOTRUE_SITE_URL                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
https://gene-tree-production.up.railway.app
└─────────────────────────────────────────────────────────────────────────────┘

IMPORTANT: The JWT_SECRET must be the SAME across all services:
- Gotrue Auth → AUTH_JWT_SECRET or JWT_SECRET
- Supabase Studio → AUTH_JWT_SECRET
- Kong → JWT_SECRET (if applicable)

After setting these, click "Deploy Template" in Railway.
`);
