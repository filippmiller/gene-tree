/**
 * Anniversary Highlight Card Template
 * Used for server-side image generation with @vercel/og
 */

import type { AnniversaryCardData } from '@/types/highlight-cards';
import { THEME_CONFIG, getOrdinal } from '@/types/highlight-cards';

interface AnniversaryTemplateProps {
  data: AnniversaryCardData;
  width?: number;
  height?: number;
}

export function AnniversaryTemplate({
  data,
  width = 1200,
  height = 630,
}: AnniversaryTemplateProps) {
  const theme = data.theme || 'royal-violet';
  const config = THEME_CONFIG[theme];

  const yearsText = getOrdinal(data.years);

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
      {/* Decorative hearts */}
      <div
        style={{
          position: 'absolute',
          top: '40px',
          left: '80px',
          fontSize: '32px',
          opacity: 0.6,
          display: 'flex',
        }}
      >
        💕
      </div>
      <div
        style={{
          position: 'absolute',
          top: '100px',
          right: '60px',
          fontSize: '28px',
          opacity: 0.5,
          display: 'flex',
        }}
      >
        💝
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '60px',
          fontSize: '36px',
          opacity: 0.5,
          display: 'flex',
        }}
      >
        💖
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '120px',
          right: '100px',
          fontSize: '24px',
          opacity: 0.4,
          display: 'flex',
        }}
      >
        💗
      </div>

      {/* Decorative rings */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          border: '3px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-100px',
          left: '-100px',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          border: '3px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '32px',
          padding: '48px',
          textAlign: 'center',
        }}
      >
        {/* Photo circles with heart connector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '-20px',
          }}
        >
          {/* First person photo */}
          <div
            style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              border: '5px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.3)',
              marginRight: '-30px',
              zIndex: 2,
            }}
          >
            {data.photoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={data.photoUrl}
                alt={data.personName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: '56px',
                  fontWeight: 'bold',
                  color: config.textColor,
                }}
              >
                {data.personName[0]}
              </span>
            )}
          </div>

          {/* Heart connector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
              zIndex: 3,
              fontSize: '32px',
            }}
          >
            💍
          </div>

          {/* Second person photo */}
          <div
            style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              border: '5px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.3)',
              marginLeft: '-30px',
              zIndex: 2,
            }}
          >
            {data.partnerPhotoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={data.partnerPhotoUrl}
                alt={data.partnerName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: '56px',
                  fontWeight: 'bold',
                  color: config.textColor,
                }}
              >
                {data.partnerName[0]}
              </span>
            )}
          </div>
        </div>

        {/* Names */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}
        >
          <span
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: config.textColor,
              display: 'flex',
            }}
          >
            {data.personName.split(' ')[0]}
          </span>
          <span
            style={{
              fontSize: '36px',
              color: config.textColor,
              opacity: 0.7,
              display: 'flex',
            }}
          >
            &
          </span>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: config.textColor,
              display: 'flex',
            }}
          >
            {data.partnerName.split(' ')[0]}
          </span>
        </div>

        {/* Anniversary text */}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 48px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50px',
            }}
          >
            <span
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: config.textColor,
                display: 'flex',
              }}
            >
              {yearsText} Anniversary
            </span>
          </div>
          <span
            style={{
              fontSize: '24px',
              color: config.textColor,
              opacity: 0.8,
              display: 'flex',
            }}
          >
            {data.years === 1 ? 'One Year of Love' : `${data.years} Years of Love`}
          </span>
        </div>

        {/* Custom message */}
        {data.message && (
          <div
            style={{
              fontSize: '22px',
              color: config.textColor,
              opacity: 0.85,
              maxWidth: '600px',
              fontStyle: 'italic',
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
