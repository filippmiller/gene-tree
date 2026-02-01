/**
 * Milestone Highlight Card Template
 * Generic template for achievements and family milestones
 * Used for server-side image generation with @vercel/og
 */

import type { MilestoneCardData } from '@/types/highlight-cards';
import { THEME_CONFIG } from '@/types/highlight-cards';

interface MilestoneTemplateProps {
  data: MilestoneCardData;
  width?: number;
  height?: number;
}

const MILESTONE_ICONS: Record<NonNullable<MilestoneCardData['icon']>, string> = {
  tree: '🌳',
  heart: '❤️',
  star: '⭐',
  trophy: '🏆',
  cake: '🎂',
  ring: '💍',
};

export function MilestoneTemplate({
  data,
  width = 1200,
  height = 630,
}: MilestoneTemplateProps) {
  const theme = data.theme || 'forest-dawn';
  const config = THEME_CONFIG[theme];
  const icon = data.icon ? MILESTONE_ICONS[data.icon] : '🌟';

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
      {/* Decorative background elements */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-120px',
          left: '-80px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
          display: 'flex',
        }}
      />

      {/* Sparkle decorations */}
      <div
        style={{
          position: 'absolute',
          top: '60px',
          left: '100px',
          fontSize: '32px',
          opacity: 0.6,
          display: 'flex',
        }}
      >
        ✨
      </div>
      <div
        style={{
          position: 'absolute',
          top: '80px',
          right: '120px',
          fontSize: '28px',
          opacity: 0.5,
          display: 'flex',
        }}
      >
        🎊
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '80px',
          fontSize: '24px',
          opacity: 0.4,
          display: 'flex',
        }}
      >
        🎉
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '100px',
          right: '80px',
          fontSize: '28px',
          opacity: 0.5,
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
          gap: '24px',
          padding: '48px',
          textAlign: 'center',
        }}
      >
        {/* Icon with glow effect */}
        <div
          style={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '72px',
          }}
        >
          {icon}
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: config.textColor,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              display: 'flex',
            }}
          >
            {data.title}
          </span>
          {data.subtitle && (
            <span
              style={{
                fontSize: '28px',
                color: config.textColor,
                opacity: 0.85,
                display: 'flex',
              }}
            >
              {data.subtitle}
            </span>
          )}
        </div>

        {/* Person name and photo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {data.photoUrl && (
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                border: '3px solid rgba(255, 255, 255, 0.8)',
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
          <span
            style={{
              fontSize: '32px',
              fontWeight: 600,
              color: config.textColor,
              display: 'flex',
            }}
          >
            {data.personName}
          </span>
        </div>

        {/* Stats row */}
        {data.stats && data.stats.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '40px',
              marginTop: '16px',
            }}
          >
            {data.stats.slice(0, 4).map((stat, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '16px 24px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
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
                  {stat.value}
                </span>
                <span
                  style={{
                    fontSize: '16px',
                    color: config.textColor,
                    opacity: 0.8,
                    display: 'flex',
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
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
