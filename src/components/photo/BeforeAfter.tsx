'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLocale } from 'next-intl';
import {
  Download,
  Columns2,
  SplitSquareHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface BeforeAfterProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  onClose?: () => void;
  onDownloadBefore?: () => void;
  onDownloadAfter?: () => void;
  showControls?: boolean;
  className?: string;
}

type ViewMode = 'slider' | 'side-by-side';

export default function BeforeAfter({
  beforeUrl,
  afterUrl,
  beforeLabel,
  afterLabel,
  onClose,
  onDownloadBefore,
  onDownloadAfter,
  showControls = true,
  className = '',
}: BeforeAfterProps) {
  const locale = useLocale();
  const [viewMode, setViewMode] = useState<ViewMode>('slider');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const t = locale === 'ru' ? {
    before: beforeLabel || 'До',
    after: afterLabel || 'После',
    slider: 'Слайдер',
    sideBySide: 'Рядом',
    downloadBefore: 'Скачать оригинал',
    downloadAfter: 'Скачать результат',
    close: 'Закрыть',
    dragToCompare: 'Потяните для сравнения',
  } : {
    before: beforeLabel || 'Before',
    after: afterLabel || 'After',
    slider: 'Slider',
    sideBySide: 'Side by Side',
    downloadBefore: 'Download Original',
    downloadAfter: 'Download Result',
    close: 'Close',
    dragToCompare: 'Drag to compare',
  };

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      let clientX: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }

      const x = clientX - rect.left;
      const percentage = Math.min(100, Math.max(0, (x / rect.width) * 100));
      setSliderPosition(percentage);
    },
    [isDragging]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Controls */}
      {showControls && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'slider' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('slider')}
              className="gap-2"
            >
              <SplitSquareHorizontal className="w-4 h-4" />
              {t.slider}
            </Button>
            <Button
              variant={viewMode === 'side-by-side' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('side-by-side')}
              className="gap-2"
            >
              <Columns2 className="w-4 h-4" />
              {t.sideBySide}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (onDownloadBefore) {
                  onDownloadBefore();
                } else {
                  handleDownload(beforeUrl, 'original.jpg');
                }
              }}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t.downloadBefore}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (onDownloadAfter) {
                  onDownloadAfter();
                } else {
                  handleDownload(afterUrl, 'colorized.jpg');
                }
              }}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t.downloadAfter}</span>
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Comparison View */}
      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          className="relative w-full aspect-[4/3] rounded-lg overflow-hidden cursor-ew-resize select-none bg-gray-100"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          {/* After image (full) */}
          <img
            src={afterUrl}
            alt={t.after}
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />

          {/* Before image (clipped) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={beforeUrl}
              alt={t.before}
              className="w-full h-full object-contain"
              style={{
                width: containerRef.current
                  ? `${(100 / sliderPosition) * 100}%`
                  : '100%',
                maxWidth: 'none',
              }}
              draggable={false}
            />
          </div>

          {/* Slider line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          >
            {/* Slider handle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
              <ChevronLeft className="w-4 h-4 text-gray-600 -mr-1" />
              <ChevronRight className="w-4 h-4 text-gray-600 -ml-1" />
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 text-white text-xs rounded">
            {t.before}
          </div>
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded">
            {t.after}
          </div>

          {/* Hint */}
          {sliderPosition === 50 && !isDragging && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 text-white text-xs rounded-full flex items-center gap-2 animate-pulse">
              <ChevronLeft className="w-3 h-3" />
              {t.dragToCompare}
              <ChevronRight className="w-3 h-3" />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            <img
              src={beforeUrl}
              alt={t.before}
              className="w-full aspect-[4/3] object-contain"
            />
            <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 text-white text-xs rounded">
              {t.before}
            </div>
          </div>
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            <img
              src={afterUrl}
              alt={t.after}
              className="w-full aspect-[4/3] object-contain"
            />
            <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 text-white text-xs rounded">
              {t.after}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
