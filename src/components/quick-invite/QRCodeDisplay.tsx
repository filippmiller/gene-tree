'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';

interface QRCodeDisplayProps {
  url: string;
  size?: number;
  eventName?: string | null;
  code: string;
  locale?: string;
}

const translations = {
  en: {
    download: 'Download QR',
    print: 'Print',
    scanToJoin: 'Scan to join',
    useCode: 'Or use code:',
  },
  ru: {
    download: 'Скачать QR',
    print: 'Печать',
    scanToJoin: 'Сканируйте для присоединения',
    useCode: 'Или используйте код:',
  },
};

export function QRCodeDisplay({
  url,
  size = 200,
  eventName,
  code,
  locale = 'en',
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const t = translations[locale as keyof typeof translations] || translations.en;

  useEffect(() => {
    if (!canvasRef.current) return;

    setIsLoading(true);

    QRCode.toCanvas(
      canvasRef.current,
      url,
      {
        width: size,
        margin: 2,
        color: {
          dark: '#1a1a2e',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      },
      (error) => {
        if (error) {
          console.error('QR Code generation error:', error);
        }
        setIsLoading(false);
      }
    );
  }, [url, size]);

  const handleDownload = () => {
    if (!canvasRef.current) return;

    // Create a larger canvas for download with text
    const downloadCanvas = document.createElement('canvas');
    const ctx = downloadCanvas.getContext('2d');
    if (!ctx) return;

    const padding = 40;
    const textHeight = eventName ? 60 : 40;
    const codeHeight = 30;

    downloadCanvas.width = size + padding * 2;
    downloadCanvas.height = size + padding * 2 + textHeight + codeHeight;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

    // Event name (if present)
    if (eventName) {
      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(eventName, downloadCanvas.width / 2, 30);
    }

    // QR Code
    const qrY = eventName ? 50 : 30;
    ctx.drawImage(canvasRef.current, padding, qrY);

    // Code text
    ctx.fillStyle = '#666666';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`${t.useCode} ${code}`, downloadCanvas.width / 2, qrY + size + 25);

    // Download
    const link = document.createElement('a');
    link.download = `invite-${code}.png`;
    link.href = downloadCanvas.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    if (!canvasRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrDataUrl = canvasRef.current.toDataURL('image/png');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${code}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, sans-serif;
            }
            .container {
              text-align: center;
              padding: 40px;
            }
            .event-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
              color: #1a1a2e;
            }
            .qr-image {
              width: ${size}px;
              height: ${size}px;
            }
            .instructions {
              margin-top: 20px;
              color: #666;
              font-size: 14px;
            }
            .code {
              font-size: 24px;
              font-weight: bold;
              color: #1a1a2e;
              letter-spacing: 4px;
              margin-top: 10px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${eventName ? `<div class="event-name">${eventName}</div>` : ''}
            <img src="${qrDataUrl}" class="qr-image" alt="QR Code" />
            <div class="instructions">${t.scanToJoin}</div>
            <div class="code">${code}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative bg-white p-4 rounded-xl shadow-lg">
        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-white rounded-xl"
            style={{ width: size + 32, height: size + 32 }}
          >
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}
        <canvas ref={canvasRef} className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity'} />
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1">{t.useCode}</p>
        <p className="text-2xl font-mono font-bold tracking-widest">{code}</p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleDownload} leftIcon={<Download className="h-4 w-4" />}>
          {t.download}
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint} leftIcon={<Printer className="h-4 w-4" />}>
          {t.print}
        </Button>
      </div>
    </div>
  );
}
