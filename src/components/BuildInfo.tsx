"use client";

export default function BuildInfo() {
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || '';
  const short = buildId ? buildId.substring(0, 7) : 'dev';
  const ts = process.env.NEXT_PUBLIC_BUILD_TIME || '';
  return (
    <span title={buildId && ts ? `${buildId} • ${ts}` : undefined} className="text-xs text-gray-400">
      build: {short}
    </span>
  );
}
