/**
 * Family Stats Highlight Card Template
 * Shows family tree statistics in a shareable format
 * Used for server-side image generation with @vercel/og
 */

import type { FamilyStatsCardData } from '@/types/highlight-cards';
import { THEME_CONFIG } from '@/types/highlight-cards';

interface FamilyStatsTemplateProps {
  data: FamilyStatsCardData;
  width?: number;
  height?: number;
}

export function FamilyStatsTemplate({
  data,
  width = 1200,
  height = 630,
}: FamilyStatsTemplateProps) {
  const theme = data.theme || 'royal-violet';
  const config = THEME_CONFIG[theme];

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
      {/* Tree branch decorations */}
      <div
        style={{
          position: 'absolute',
          top: '-50px',
          left: '-50px',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-80px',
          right: '-80px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          display: 'flex',
        }}
      />

      {/* Decorative leaves */}
      <div
        style={{
          position: 'absolute',
          top: '40px',
          left: '60px',
          fontSize: '36px',
          opacity: 0.5,
          display: 'flex',
        }}
      >
        🌿
      </div>
      <div
        style={{
          position: 'absolute',
          top: '60px',
          right: '80px',
          fontSize: '32px',
          opacity: 0.4,
          display: 'flex',
        }}
      >
        🌱
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '60px',
          left: '100px',
          fontSize: '28px',
          opacity: 0.4,
          display: 'flex',
        }}
      >
        🍃
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '60px',
          fontSize: '36px',
          opacity: 0.5,
          display: 'flex',
        }}
      >
        🌲
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
        {/* Header with tree icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <span
            style={{
              fontSize: '64px',
              display: 'flex',
            }}
          >
            🌳
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
                fontSize: '20px',
                color: config.textColor,
                opacity: 0.8,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                display: 'flex',
              }}
            >
              Our Family Tree
            </span>
            <span
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: config.textColor,
                display: 'flex',
              }}
            >
              {data.personName}&apos;s Family
            </span>
          </div>
        </div>

        {/* Main stats */}
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
            gap: '24px',
            marginTop: '16px',
          }}
        >
          {/* Members stat */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 40px',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
              minWidth: '160px',
            }}
          >
            <span
              style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: config.textColor,
                display: 'flex',
              }}
            >
              {data.totalMembers}
            </span>
            <span
              style={{
                fontSize: '18px',
                color: config.textColor,
                opacity: 0.85,
                display: 'flex',
              }}
            >
              Family Members
            </span>
          </div>

          {/* Generations stat */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 40px',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
              minWidth: '160px',
            }}
          >
            <span
              style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: config.textColor,
                display: 'flex',
              }}
            >
              {data.generations}
            </span>
            <span
              style={{
                fontSize: '18px',
                color: config.textColor,
                opacity: 0.85,
                display: 'flex',
              }}
            >
              Generations
            </span>
          </div>

          {/* Countries stat (if available) */}
          {data.countriesRepresented && data.countriesRepresented > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 40px',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                minWidth: '160px',
              }}
            >
              <span
                style={{
                  fontSize: '56px',
                  fontWeight: 'bold',
                  color: config.textColor,
                  display: 'flex',
                }}
              >
                {data.countriesRepresented}
              </span>
              <span
                style={{
                  fontSize: '18px',
                  color: config.textColor,
                  opacity: 0.85,
                  display: 'flex',
                }}
              >
                Countries
              </span>
            </div>
          )}
        </div>

        {/* Notable members */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '48px',
            marginTop: '8px',
          }}
        >
          {/* Oldest member */}
          {data.oldestMember && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '40px',
              }}
            >
              <span
                style={{
                  fontSize: '24px',
                  display: 'flex',
                }}
              >
                👵
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
                    fontSize: '14px',
                    color: config.textColor,
                    opacity: 0.7,
                    display: 'flex',
                  }}
                >
                  Oldest Member
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: config.textColor,
                    display: 'flex',
                  }}
                >
                  {data.oldestMember.name}, {data.oldestMember.age}
                </span>
              </div>
            </div>
          )}

          {/* Newest member */}
          {data.newestMember && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '40px',
              }}
            >
              <span
                style={{
                  fontSize: '24px',
                  display: 'flex',
                }}
              >
                👶
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
                    fontSize: '14px',
                    color: config.textColor,
                    opacity: 0.7,
                    display: 'flex',
                  }}
                >
                  Newest Member
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: config.textColor,
                    display: 'flex',
                  }}
                >
                  {data.newestMember.name}
                </span>
              </div>
            </div>
          )}
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
