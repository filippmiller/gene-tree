/**
 * Highlight Card Image Generation API
 *
 * Generates shareable social media cards for family moments.
 * Uses Next.js ImageResponse (built on Satori) for server-side image generation.
 *
 * GET /api/highlight-card/[type]?data=base64EncodedData
 *
 * Supported types:
 * - birthday: Birthday celebration cards
 * - anniversary: Wedding anniversary cards
 * - memory: "On This Day" memory cards
 * - milestone: Achievement/milestone cards
 * - family-stats: Family tree statistics cards
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import type {
  HighlightCardData,
  HighlightCardType,
  BirthdayCardData,
  AnniversaryCardData,
  MemoryCardData,
  MilestoneCardData,
  FamilyStatsCardData,
} from '@/types/highlight-cards';
import { BirthdayTemplate } from '@/components/highlight-cards/templates/BirthdayTemplate';
import { AnniversaryTemplate } from '@/components/highlight-cards/templates/AnniversaryTemplate';
import { MemoryTemplate } from '@/components/highlight-cards/templates/MemoryTemplate';
import { MilestoneTemplate } from '@/components/highlight-cards/templates/MilestoneTemplate';
import { FamilyStatsTemplate } from '@/components/highlight-cards/templates/FamilyStatsTemplate';

// Image dimensions by platform
const DIMENSIONS: Record<string, { width: number; height: number }> = {
  instagram: { width: 1080, height: 1080 },
  twitter: { width: 1200, height: 675 },
  facebook: { width: 1200, height: 630 },
  standard: { width: 1200, height: 630 },
};

// Valid card types
const VALID_TYPES: HighlightCardType[] = [
  'birthday',
  'anniversary',
  'memory',
  'milestone',
  'family-stats',
];

export const runtime = 'edge';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const { searchParams } = new URL(req.url);

    // Validate card type
    if (!VALID_TYPES.includes(type as HighlightCardType)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid card type',
          validTypes: VALID_TYPES,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get and decode card data from query params
    const dataParam = searchParams.get('data');
    if (!dataParam) {
      return new Response(
        JSON.stringify({ error: 'Missing data parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let cardData: HighlightCardData;
    try {
      // Decode base64 data
      const jsonString = atob(dataParam);
      cardData = JSON.parse(jsonString);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid data format. Expected base64-encoded JSON.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate card data type matches route
    if (cardData.type !== type) {
      return new Response(
        JSON.stringify({
          error: `Data type mismatch. Route is /${type} but data type is ${cardData.type}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get dimensions
    const size = searchParams.get('size') || 'standard';
    const dimensions = DIMENSIONS[size] || DIMENSIONS.standard;

    // Render the appropriate template
    let element: React.ReactElement;

    switch (type as HighlightCardType) {
      case 'birthday':
        element = (
          <BirthdayTemplate
            data={cardData as BirthdayCardData}
            width={dimensions.width}
            height={dimensions.height}
          />
        );
        break;

      case 'anniversary':
        element = (
          <AnniversaryTemplate
            data={cardData as AnniversaryCardData}
            width={dimensions.width}
            height={dimensions.height}
          />
        );
        break;

      case 'memory':
        element = (
          <MemoryTemplate
            data={cardData as MemoryCardData}
            width={dimensions.width}
            height={dimensions.height}
          />
        );
        break;

      case 'milestone':
        element = (
          <MilestoneTemplate
            data={cardData as MilestoneCardData}
            width={dimensions.width}
            height={dimensions.height}
          />
        );
        break;

      case 'family-stats':
        element = (
          <FamilyStatsTemplate
            data={cardData as FamilyStatsCardData}
            width={dimensions.width}
            height={dimensions.height}
          />
        );
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown card type' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Generate the image
    return new ImageResponse(element, {
      width: dimensions.width,
      height: dimensions.height,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Error generating highlight card:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate card',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
