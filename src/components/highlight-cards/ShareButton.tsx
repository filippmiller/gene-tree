'use client';

/**
 * ShareButton Component
 *
 * Provides sharing functionality for highlight cards using:
 * 1. Web Share API (native sharing on mobile)
 * 2. Fallback to download + copy link
 *
 * Features:
 * - Native sharing on supported devices
 * - Download as PNG fallback
 * - Copy link to clipboard
 * - Share to specific platforms (Twitter, Facebook, WhatsApp)
 */

import { useState, useCallback } from 'react';
import { Share2, Download, Link2, Check, Twitter, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ShareButtonProps {
  /** URL to the generated card image */
  cardUrl: string;
  /** Title for sharing */
  title: string;
  /** Description/text for sharing */
  text?: string;
  /** Callback when share is successful */
  onShare?: (method: string) => void;
  /** Additional CSS classes */
  className?: string;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ShareButton({
  cardUrl,
  title,
  text = 'Check out this family moment!',
  onShare,
  className,
  variant = 'default',
  size = 'default',
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Check if Web Share API is available
  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    'canShare' in navigator &&
    navigator.canShare?.({ files: [new File([], 'test.png')] });

  /**
   * Native share using Web Share API
   */
  const handleNativeShare = useCallback(async () => {
    try {
      // Try to share with image file if supported
      if (canShareFiles) {
        const response = await fetch(cardUrl);
        const blob = await response.blob();
        const file = new File([blob], `${title.replace(/\s+/g, '-')}.png`, {
          type: 'image/png',
        });

        await navigator.share({
          files: [file],
          title,
          text,
        });
      } else {
        // Fallback to sharing URL only
        await navigator.share({
          title,
          text,
          url: cardUrl,
        });
      }

      onShare?.('native');
      setIsOpen(false);
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  }, [cardUrl, title, text, canShareFiles, onShare]);

  /**
   * Download image as PNG
   */
  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const response = await fetch(cardUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onShare?.('download');
      setIsOpen(false);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  }, [cardUrl, title, onShare]);

  /**
   * Copy link to clipboard
   */
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopied(true);
      onShare?.('copy');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }, [cardUrl, onShare]);

  /**
   * Share to Twitter/X
   */
  const handleTwitterShare = useCallback(() => {
    const tweetText = encodeURIComponent(`${text} ${cardUrl}`);
    window.open(
      `https://twitter.com/intent/tweet?text=${tweetText}`,
      '_blank',
      'width=550,height=420'
    );
    onShare?.('twitter');
    setIsOpen(false);
  }, [text, cardUrl, onShare]);

  /**
   * Share to Facebook
   */
  const handleFacebookShare = useCallback(() => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(cardUrl)}`,
      '_blank',
      'width=550,height=420'
    );
    onShare?.('facebook');
    setIsOpen(false);
  }, [cardUrl, onShare]);

  /**
   * Share to WhatsApp
   */
  const handleWhatsAppShare = useCallback(() => {
    const message = encodeURIComponent(`${text}\n${cardUrl}`);
    window.open(
      `https://wa.me/?text=${message}`,
      '_blank'
    );
    onShare?.('whatsapp');
    setIsOpen(false);
  }, [text, cardUrl, onShare]);

  // If native share is available, show single button
  if (canNativeShare) {
    return (
      <div className="flex gap-2">
        <Button
          onClick={handleNativeShare}
          variant={variant}
          size={size}
          className={className}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
        <Button
          onClick={handleDownload}
          variant="outline"
          size={size}
          disabled={downloading}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Desktop fallback with popover menu
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="flex flex-col gap-1">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            <span>{downloading ? 'Downloading...' : 'Download Image'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Link Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 text-muted-foreground" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <hr className="my-1 border-border" />

          <button
            onClick={handleTwitterShare}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
          >
            <Twitter className="w-4 h-4 text-muted-foreground" />
            <span>Share on X</span>
          </button>

          <button
            onClick={handleFacebookShare}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
          >
            <Facebook className="w-4 h-4 text-muted-foreground" />
            <span>Share on Facebook</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
          >
            <svg
              className="w-4 h-4 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>Share on WhatsApp</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
