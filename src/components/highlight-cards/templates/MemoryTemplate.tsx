/**
 * Memory / "On This Day" Highlight Card Template
 * Used for server-side image generation with @vercel/og
 */

import type { MemoryCardData } from '@/types/highlight-cards';
import { THEME_CONFIG } from '@/types/highlight-cards';

interface MemoryTemplateProps {
  data: MemoryCardData;
  width?: number;
  height?: number;
}

const EVENT_ICONS: Record<MemoryCardData['eventType'], string> = {
  birth: '👶',
  wedding: '💒',
  graduation: '🎓',
  achievement: '🏆',
  other: '📸',
};

export function MemoryTemplate({
  data,
  width = 1200,
  height = 630,
}: MemoryTemplateProps) {
  const theme = data.theme || 'ocean-breeze';
  const config = THEME_CONFIG[theme];

  const currentYear = new Date().getFullYear();
  const yearsAgo = currentYear - data.year;

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
      {/* Decorative elements */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          left: '-60px',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-80px',
          right: '-80px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
          display: 'flex',
        }}
      />

      {/* Floating memories icons */}
      <div
        style={{
          position: 'absolute',
          top: '50px',
          left: '80px',
          fontSize: '28px',
          opacity: 0.5,
          display: 'flex',
        }}
      >
        ✨
      </div>
      <div
        style={{
          position: 'absolute',
          top: '90px',
          right: '100px',
          fontSize: '32px',
          opacity: 0.4,
          display: 'flex',
        }}
      >
        🌟
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '70px',
          left: '120px',
          fontSize: '24px',
          opacity: 0.4,
          display: 'flex',
        }}
      >
        💫
      </div>

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '28px',
          padding: '48px',
          textAlign: 'center',
        }}
      >
        {/* "On This Day" header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 32px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '40px',
          }}
        >
          <span
            style={{
              fontSize: '24px',
              display: 'flex',
            }}
          >
            📅
          </span>
          <span
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: config.textColor,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            On This Day
          </span>
        </div>

        {/* Year badge with icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
          }}
        >
          <span
            style={{
              fontSize: '64px',
              display: 'flex',
            }}
          >
            {EVENT_ICONS[data.eventType]}
          </span>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <span
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: config.textColor,
                lineHeight: 1,
                display: 'flex',
              }}
            >
              {data.year}
            </span>
            <span
              style={{
                fontSize: '22px',
                color: config.textColor,
                opacity: 0.7,
                display: 'flex',
              }}
            >
              {yearsAgo} {yearsAgo === 1 ? 'year' : 'years'} ago
            </span>
          </div>
        </div>

        {/* Photo if available */}
        {data.photoUrl && (
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '4px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
        )}

        {/* Person name */}
        <span
          style={{
            fontSize: '40px',
            fontWeight: 'bold',
            color: config.textColor,
            display: 'flex',
          }}
        >
          {data.personName}
        </span>

        {/* Description */}
        <div
          style={{
            fontSize: '28px',
            color: config.textColor,
            opacity: 0.9,
            maxWidth: '700px',
            lineHeight: 1.4,
            display: 'flex',
          }}
        >
          {data.description}
        </div>
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
