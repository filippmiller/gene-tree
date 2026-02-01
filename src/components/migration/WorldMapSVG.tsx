/**
 * WorldMapSVG Component
 *
 * A simplified SVG world map for displaying migration paths.
 * Uses an equirectangular projection for simplicity.
 */

'use client';

import { useMemo } from 'react';
import type { Coordinates, MapBounds } from '@/lib/migration/types';

interface WorldMapSVGProps {
  width: number;
  height: number;
  children?: React.ReactNode;
  className?: string;
  bounds?: MapBounds;
}

/**
 * Convert lat/lng to SVG coordinates
 * Uses equirectangular projection
 */
export function latLngToSvg(
  lat: number,
  lng: number,
  width: number,
  height: number,
  bounds?: MapBounds
): { x: number; y: number } {
  // Default world bounds
  const minLng = bounds?.minLng ?? -180;
  const maxLng = bounds?.maxLng ?? 180;
  const minLat = bounds?.minLat ?? -90;
  const maxLat = bounds?.maxLat ?? 90;

  const x = ((lng - minLng) / (maxLng - minLng)) * width;
  const y = ((maxLat - lat) / (maxLat - minLat)) * height;

  return { x, y };
}

/**
 * Calculate bounds that fit all coordinates with padding
 */
export function calculateBounds(
  coordinates: Coordinates[],
  padding: number = 0.15
): MapBounds {
  if (coordinates.length === 0) {
    return { minLat: -60, maxLat: 80, minLng: -180, maxLng: 180 };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const coord of coordinates) {
    if (coord.lat < minLat) minLat = coord.lat;
    if (coord.lat > maxLat) maxLat = coord.lat;
    if (coord.lng < minLng) minLng = coord.lng;
    if (coord.lng > maxLng) maxLng = coord.lng;
  }

  // Add padding
  const latPadding = (maxLat - minLat) * padding;
  const lngPadding = (maxLng - minLng) * padding;

  // Ensure minimum bounds
  const minLatPadding = Math.max(latPadding, 10);
  const minLngPadding = Math.max(lngPadding, 15);

  return {
    minLat: Math.max(-85, minLat - minLatPadding),
    maxLat: Math.min(85, maxLat + minLatPadding),
    minLng: Math.max(-180, minLng - minLngPadding),
    maxLng: Math.min(180, maxLng + minLngPadding),
  };
}

export default function WorldMapSVG({
  width,
  height,
  children,
  className = '',
  bounds,
}: WorldMapSVGProps) {
  // Generate graticule (grid lines)
  const graticule = useMemo(() => {
    const lines: string[] = [];
    const effectiveBounds = bounds || { minLat: -90, maxLat: 90, minLng: -180, maxLng: 180 };

    // Longitude lines (vertical)
    for (let lng = -180; lng <= 180; lng += 30) {
      if (lng >= effectiveBounds.minLng && lng <= effectiveBounds.maxLng) {
        const start = latLngToSvg(effectiveBounds.maxLat, lng, width, height, bounds);
        const end = latLngToSvg(effectiveBounds.minLat, lng, width, height, bounds);
        lines.push(`M ${start.x} ${start.y} L ${end.x} ${end.y}`);
      }
    }

    // Latitude lines (horizontal)
    for (let lat = -60; lat <= 80; lat += 20) {
      if (lat >= effectiveBounds.minLat && lat <= effectiveBounds.maxLat) {
        const start = latLngToSvg(lat, effectiveBounds.minLng, width, height, bounds);
        const end = latLngToSvg(lat, effectiveBounds.maxLng, width, height, bounds);
        lines.push(`M ${start.x} ${start.y} L ${end.x} ${end.y}`);
      }
    }

    return lines.join(' ');
  }, [width, height, bounds]);

  // Generate country outlines (simplified)
  const countryPaths = useMemo(() => {
    // Simplified continent outlines with coordinates
    const continents: { name: string; points: [number, number][] }[] = [
      // North America
      {
        name: 'north-america',
        points: [
          [-170, 65], [-160, 70], [-140, 70], [-120, 75], [-100, 75],
          [-80, 70], [-60, 65], [-50, 45], [-65, 45], [-80, 25],
          [-90, 15], [-105, 20], [-120, 30], [-125, 40], [-130, 50],
          [-140, 60], [-170, 65],
        ],
      },
      // South America
      {
        name: 'south-america',
        points: [
          [-80, 10], [-60, 5], [-35, -5], [-35, -20], [-40, -35],
          [-55, -50], [-70, -55], [-75, -45], [-70, -20], [-80, -5],
          [-80, 10],
        ],
      },
      // Europe
      {
        name: 'europe',
        points: [
          [-10, 35], [0, 40], [10, 45], [30, 45], [40, 50],
          [50, 55], [60, 60], [70, 70], [40, 70], [20, 65],
          [0, 60], [-10, 55], [-10, 35],
        ],
      },
      // Africa
      {
        name: 'africa',
        points: [
          [-17, 15], [10, 35], [35, 30], [45, 10], [50, -5],
          [40, -25], [30, -35], [15, -35], [-5, -30], [-15, -5],
          [-17, 15],
        ],
      },
      // Asia
      {
        name: 'asia',
        points: [
          [40, 45], [60, 55], [80, 55], [100, 60], [130, 65],
          [170, 65], [180, 55], [150, 35], [130, 25], [120, 20],
          [105, 10], [80, 10], [70, 20], [55, 25], [40, 30],
          [40, 45],
        ],
      },
      // Australia
      {
        name: 'australia',
        points: [
          [115, -20], [130, -12], [150, -15], [155, -25], [150, -40],
          [140, -38], [130, -35], [115, -35], [112, -25], [115, -20],
        ],
      },
    ];

    return continents.map((continent) => {
      const pathPoints = continent.points.map(([lng, lat], index) => {
        const { x, y } = latLngToSvg(lat, lng, width, height, bounds);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      });
      return { name: continent.name, path: pathPoints.join(' ') + ' Z' };
    });
  }, [width, height, bounds]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`${className}`}
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        {/* Gradient for map background */}
        <linearGradient id="mapBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8f4f8" />
          <stop offset="100%" stopColor="#d4e8f0" />
        </linearGradient>

        {/* Gradient for land */}
        <linearGradient id="landGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a8d8a8" />
          <stop offset="100%" stopColor="#8bc48b" />
        </linearGradient>

        {/* Arrow marker for paths */}
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="currentColor"
            className="text-blue-600"
          />
        </marker>

        {/* Glow filter for markers */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Shadow filter */}
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Background */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill="url(#mapBgGradient)"
      />

      {/* Graticule (grid) */}
      <path
        d={graticule}
        fill="none"
        stroke="#b8d4e3"
        strokeWidth="0.5"
        strokeDasharray="3,3"
        opacity="0.5"
      />

      {/* Country/Continent outlines */}
      {countryPaths.map((continent) => (
        <path
          key={continent.name}
          d={continent.path}
          fill="url(#landGradient)"
          stroke="#6b9b6b"
          strokeWidth="1"
          filter="url(#dropShadow)"
        />
      ))}

      {/* Children (markers, paths, etc.) */}
      {children}
    </svg>
  );
}
