/**
 * Birthday Highlight Card Template
 * Used for server-side image generation with @vercel/og
 *
 * Note: This template uses inline styles because Satori (the underlying
 * renderer for @vercel/og) only supports a subset of CSS and requires
 * all styles to be inline with explicit display: flex declarations.
 */

import type { BirthdayCardData, CardTheme } from '@/types/highlight-cards';
import { THEME_CONFIG, getOrdinal } from '@/types/highlight-cards';

interface BirthdayTemplateProps {
  data: BirthdayCardData;
  width?: number;
  height?: number;
}

export function BirthdayTemplate({
  data,
  width = 1200,
  height = 630,
}: BirthdayTemplateProps) {
  const theme = data.theme || 'warm-sunset';
  const config = THEME_CONFIG[theme];

  // Format the birthday text
  const ageText = getOrdinal(data.age);
  const firstName = data.personName.split(' ')[0];

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: config.background,
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-150px',
          left: '-150px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          display: 'flex',
        }}
      />

      {/* Confetti decorations */}
      <div
        style={{
          position: 'absolute',
          top: '40px',
          left: '60px',
          fontSize: '48px',
          display: 'flex',
        }}
      >
        🎈
      </div>
      <div
        style={{
          position: 'absolute',
          top: '80px',
          right: '80px',
          fontSize: '48px',
          display: 'flex',
        }}
      >
        🎉
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '60px',
          left: '120px',
          fontSize: '40px',
          display: 'flex',
        }}
      >
        🎂
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '100px',
          right: '100px',
          fontSize: '36px',
          display: 'flex',
        }}
      >
        🎁
      </div>

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          padding: '48px',
          textAlign: 'center',
        }}
      >
        {/* Photo circle */}
        {data.photoUrl ? (
          <div
            style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              border: '6px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'white',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.photoUrl}
              alt={data.personName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              border: '6px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.3)',
              fontSize: '72px',
              fontWeight: 'bold',
              color: config.textColor,
            }}
          >
            {firstName[0]}
          </div>
        )}

        {/* Birthday text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '32px',
              fontWeight: 500,
              color: config.textColor,
              opacity: 0.9,
              display: 'flex',
            }}
          >
            Happy Birthday
          </div>
          <div
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: config.textColor,
              display: 'flex',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            {data.personName}!
          </div>
        </div>

        {/* Age badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 48px',
            background: 'rgba(255, 255, 255, 0.25)',
            borderRadius: '50px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <span
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: config.textColor,
              display: 'flex',
            }}
          >
            Turning {ageText}
          </span>
        </div>

        {/* Custom message */}
        {data.message && (
          <div
            style={{
              fontSize: '24px',
              color: config.textColor,
              opacity: 0.85,
              maxWidth: '600px',
              display: 'flex',
            }}
          >
            &ldquo;{data.message}&rdquo;
          </div>
        )}
      </div>

      {/* Branding watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: 0.6,
        }}
      >
        <span
          style={{
            fontSize: '18px',
            color: config.textColor,
            fontWeight: 500,
            display: 'flex',
          }}
        >
          Made with GeneTree
        </span>
      </div>
    </div>
  );
}
