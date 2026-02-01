'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { RelationshipPathResult } from '@/types/relationship-path';
import { getRelationshipLabel, getRelationshipArrow, getCategoryColor } from '@/types/relationship-path';

interface PathVisualizationProps {
  result: RelationshipPathResult;
  locale?: 'en' | 'ru';
  className?: string;
  showExport?: boolean;
}

export default function PathVisualization({
  result,
  locale = 'en',
  className = '',
  showExport = true,
}: PathVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activeNodeIndex, setActiveNodeIndex] = useState(-1);

  // Animate nodes sequentially on mount
  useEffect(() => {
    if (!result.found || result.path.length === 0) return;

    setIsAnimating(true);
    setActiveNodeIndex(-1);

    const animateNodes = async () => {
      for (let i = 0; i < result.path.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setActiveNodeIndex(i);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsAnimating(false);
    };

    animateNodes();
  }, [result]);

  const handleExportPng = useCallback(async () => {
    if (!containerRef.current) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(containerRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: {
          padding: '24px',
        },
      });

      // Download the image
      const link = document.createElement('a');
      link.download = `family-connection-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export PNG:', error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      const dataUrl = await toPng(containerRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'family-connection.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: locale === 'ru' ? 'Семейная связь' : 'Family Connection',
          text: result.relationshipLabel,
          files: [file],
        });
      } else {
        // Fallback to download
        handleExportPng();
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  }, [handleExportPng, locale, result.relationshipLabel]);

  if (!result.found || result.path.length === 0) {
    return null;
  }

  const categoryColor = getCategoryColor(result.category);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with relationship summary */}
      <div className="text-center">
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${categoryColor} text-white text-sm font-medium shadow-lg`}
        >
          <span>{result.relationshipLabel}</span>
          <span className="opacity-75">|</span>
          <span className="opacity-90">{result.degreeOfSeparation}</span>
        </div>
      </div>

      {/* Path visualization */}
      <div
        ref={containerRef}
        className="relative bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl p-6 shadow-inner"
      >
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-violet-100/50 to-purple-100/50 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-emerald-100/50 to-teal-100/50 rounded-full blur-3xl" />
        </div>

        {/* Path nodes */}
        <div className="relative flex flex-wrap items-center justify-center gap-4 min-h-[120px]">
          {result.path.map((node, index) => (
            <div
              key={node.profileId}
              className="flex items-center"
            >
              {/* Person node */}
              <div
                className={`
                  flex flex-col items-center transition-all duration-500 ease-out
                  ${activeNodeIndex >= index || !isAnimating
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-4 scale-95'
                  }
                `}
                style={{
                  transitionDelay: isAnimating ? `${index * 100}ms` : '0ms',
                }}
              >
                {/* Avatar with glow effect */}
                <div
                  className={`
                    relative p-1 rounded-full transition-all duration-300
                    ${activeNodeIndex === index && isAnimating
                      ? 'ring-4 ring-violet-400/50 ring-offset-2 scale-110'
                      : ''
                    }
                  `}
                >
                  <Avatar className="w-14 h-14 border-2 border-white shadow-lg">
                    {node.avatarUrl && (
                      <AvatarImage
                        src={node.avatarUrl}
                        alt={`${node.firstName} ${node.lastName}`}
                      />
                    )}
                    <AvatarFallback
                      className={`
                        bg-gradient-to-br text-white text-lg font-semibold
                        ${node.gender === 'male' ? 'from-blue-400 to-blue-600' :
                          node.gender === 'female' ? 'from-pink-400 to-pink-600' :
                          'from-gray-400 to-gray-600'}
                      `}
                    >
                      {node.firstName?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Pulse animation for active node */}
                  {activeNodeIndex === index && isAnimating && (
                    <div className="absolute inset-0 rounded-full bg-violet-400/30 animate-ping" />
                  )}
                </div>

                {/* Name */}
                <div className="mt-2 text-center max-w-[100px]">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {node.firstName || '?'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {node.lastName || ''}
                  </div>
                </div>
              </div>

              {/* Connection arrow */}
              {index < result.path.length - 1 && node.relationshipType && (
                <div
                  className={`
                    flex flex-col items-center mx-3 transition-all duration-500
                    ${activeNodeIndex > index || !isAnimating
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-75'
                    }
                  `}
                  style={{
                    transitionDelay: isAnimating ? `${(index + 0.5) * 100}ms` : '0ms',
                  }}
                >
                  {/* Arrow with direction indicator */}
                  <div className="relative">
                    <div
                      className={`
                        flex items-center justify-center w-8 h-8 rounded-full
                        bg-gradient-to-r ${getDirectionColor(node.direction)}
                        text-white text-lg shadow-md
                      `}
                    >
                      {getRelationshipArrow(node.relationshipType)}
                    </div>

                    {/* Animated line */}
                    {activeNodeIndex > index && isAnimating && (
                      <div className="absolute inset-0 rounded-full bg-white/30 animate-pulse" />
                    )}
                  </div>

                  {/* Relationship label */}
                  <span className="mt-1 text-xs text-gray-600 whitespace-nowrap font-medium">
                    {getRelationshipLabel(node.relationshipType, locale)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Path summary for export */}
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            {result.path.length} {locale === 'ru' ? 'человек в цепочке' : 'people in connection'}
          </p>
        </div>
      </div>

      {/* Export buttons */}
      {showExport && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPng}
            disabled={isExporting || isAnimating}
            leftIcon={<Download className="w-4 h-4" />}
          >
            {isExporting
              ? (locale === 'ru' ? 'Сохранение...' : 'Saving...')
              : (locale === 'ru' ? 'Сохранить PNG' : 'Save as PNG')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={isAnimating}
            leftIcon={<Share2 className="w-4 h-4" />}
          >
            {locale === 'ru' ? 'Поделиться' : 'Share'}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Get color based on relationship direction
 */
function getDirectionColor(direction: 'up' | 'down' | 'lateral' | null): string {
  switch (direction) {
    case 'up':
      return 'from-blue-400 to-blue-600';
    case 'down':
      return 'from-emerald-400 to-emerald-600';
    case 'lateral':
      return 'from-violet-400 to-violet-600';
    default:
      return 'from-gray-400 to-gray-600';
  }
}
