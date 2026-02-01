/**
 * MigrationMap Component
 *
 * Animated visualization of family migration patterns.
 * Shows migration paths between locations with timeline controls.
 */

'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import WorldMapSVG, { latLngToSvg, calculateBounds } from './WorldMapSVG';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MigrationData, MigrationPath, Coordinates } from '@/lib/migration/types';

interface MigrationMapProps {
  data: MigrationData;
  locale?: string;
}

// Generation colors
const GENERATION_COLORS = [
  '#3b82f6', // 0 (self) - blue
  '#8b5cf6', // 1 (parents) - purple
  '#ec4899', // 2 (grandparents) - pink
  '#f97316', // 3 (great-grandparents) - orange
  '#eab308', // 4+ - yellow
];

function getGenerationColor(generation: number): string {
  const absGen = Math.abs(generation);
  return GENERATION_COLORS[Math.min(absGen, GENERATION_COLORS.length - 1)];
}

// Animation duration in ms
const ANIMATION_DURATION = 2000;

/**
 * Generate a curved path between two points
 */
function generateCurvedPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Calculate control point offset based on distance
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Curve intensity based on distance
  const curveIntensity = Math.min(distance * 0.3, 50);

  // Perpendicular offset for control point
  const perpX = -dy / distance;
  const perpY = dx / distance;

  const controlX = midX + perpX * curveIntensity;
  const controlY = midY + perpY * curveIntensity;

  return `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
}

export default function MigrationMap({ data, locale = 'en' }: MigrationMapProps) {
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null);
  const [yearRange, setYearRange] = useState<[number, number]>([
    data.yearRange.min,
    data.yearRange.max,
  ]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<MigrationPath | null>(null);
  const animationRef = useRef<number | null>(null);

  // Map dimensions
  const mapWidth = 800;
  const mapHeight = 500;

  // Collect all coordinates for bounds calculation
  const allCoordinates: Coordinates[] = useMemo(() => {
    const coords: Coordinates[] = [];
    for (const path of data.paths) {
      coords.push(path.from.coordinates);
      coords.push(path.to.coordinates);
    }
    return coords;
  }, [data.paths]);

  // Calculate map bounds
  const mapBounds = useMemo(() => {
    return calculateBounds(allCoordinates);
  }, [allCoordinates]);

  // Filter paths based on selection
  const filteredPaths = useMemo(() => {
    return data.paths.filter((path) => {
      // Filter by generation
      if (selectedGeneration !== null && path.generation !== selectedGeneration) {
        return false;
      }

      // Filter by year range
      const pathYear = path.year || path.from.year || path.to.year;
      if (pathYear) {
        if (pathYear < yearRange[0] || pathYear > yearRange[1]) {
          return false;
        }
      }

      return true;
    });
  }, [data.paths, selectedGeneration, yearRange]);

  // Get unique generations
  const generations = useMemo(() => {
    const gens = new Set<number>();
    for (const path of data.paths) {
      gens.add(path.generation);
    }
    return Array.from(gens).sort((a, b) => a - b);
  }, [data.paths]);

  // Animation controls
  const startAnimation = useCallback(() => {
    setIsAnimating(true);
    setAnimationProgress(0);

    const startTime = Date.now();
    const totalDuration = ANIMATION_DURATION * filteredPaths.length;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      setAnimationProgress(progress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [filteredPaths.length]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsAnimating(false);
    setAnimationProgress(1);
  }, []);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Labels
  const labels = {
    en: {
      title: 'Family Migration Map',
      subtitle: "Your family's journey across the world",
      play: 'Play Animation',
      stop: 'Stop',
      reset: 'Reset',
      allGenerations: 'All Generations',
      generation: 'Generation',
      self: 'You',
      parents: 'Parents',
      grandparents: 'Grandparents',
      greatGrandparents: 'Great-Grandparents',
      ancestors: 'Ancestors',
      yearRange: 'Year Range',
      from: 'From',
      to: 'To',
      noData: 'No migration data found. Add birth places and residences to see your family\'s journey.',
      locations: 'Locations',
      pathsFound: 'migration paths found',
    },
    ru: {
      title: 'Карта миграции семьи',
      subtitle: 'Путешествие вашей семьи по миру',
      play: 'Запустить анимацию',
      stop: 'Стоп',
      reset: 'Сброс',
      allGenerations: 'Все поколения',
      generation: 'Поколение',
      self: 'Вы',
      parents: 'Родители',
      grandparents: 'Бабушки и дедушки',
      greatGrandparents: 'Прабабушки и прадедушки',
      ancestors: 'Предки',
      yearRange: 'Период',
      from: 'Из',
      to: 'В',
      noData: 'Данные о миграции не найдены. Добавьте места рождения и проживания, чтобы увидеть путь вашей семьи.',
      locations: 'Места',
      pathsFound: 'путей миграции найдено',
    },
  };

  const t = labels[locale as keyof typeof labels] || labels.en;

  const getGenerationLabel = (gen: number): string => {
    switch (gen) {
      case 0:
        return t.self;
      case 1:
      case -1:
        return t.parents;
      case 2:
      case -2:
        return t.grandparents;
      case 3:
      case -3:
        return t.greatGrandparents;
      default:
        return t.ancestors;
    }
  };

  if (data.paths.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{t.noData}</h3>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {filteredPaths.length} {t.pathsFound}
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Animation Controls */}
          <div className="flex items-center gap-2">
            {isAnimating ? (
              <Button onClick={stopAnimation} variant="outline" size="sm">
                {t.stop}
              </Button>
            ) : (
              <Button onClick={startAnimation} size="sm">
                {t.play}
              </Button>
            )}
            <Button
              onClick={() => {
                stopAnimation();
                setAnimationProgress(1);
              }}
              variant="ghost"
              size="sm"
            >
              {t.reset}
            </Button>
          </div>

          {/* Generation Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t.generation}:</span>
            <Button
              variant={selectedGeneration === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedGeneration(null)}
            >
              {t.allGenerations}
            </Button>
            {generations.map((gen) => (
              <Button
                key={gen}
                variant={selectedGeneration === gen ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedGeneration(gen)}
                style={{
                  borderColor: getGenerationColor(gen),
                  color: selectedGeneration === gen ? 'white' : getGenerationColor(gen),
                  backgroundColor:
                    selectedGeneration === gen ? getGenerationColor(gen) : 'transparent',
                }}
              >
                {getGenerationLabel(gen)}
              </Button>
            ))}
          </div>

          {/* Year Range */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-600">{t.yearRange}:</span>
            <input
              type="range"
              min={data.yearRange.min}
              max={data.yearRange.max}
              value={yearRange[0]}
              onChange={(e) =>
                setYearRange([parseInt(e.target.value), yearRange[1]])
              }
              className="w-24"
            />
            <span className="text-sm font-mono">{yearRange[0]}</span>
            <span className="text-gray-400">-</span>
            <input
              type="range"
              min={data.yearRange.min}
              max={data.yearRange.max}
              value={yearRange[1]}
              onChange={(e) =>
                setYearRange([yearRange[0], parseInt(e.target.value)])
              }
              className="w-24"
            />
            <span className="text-sm font-mono">{yearRange[1]}</span>
          </div>
        </div>
      </Card>

      {/* Map */}
      <Card className="overflow-hidden">
        <div className="relative aspect-[16/10] bg-gradient-to-b from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-900">
          <WorldMapSVG width={mapWidth} height={mapHeight} bounds={mapBounds}>
            {/* Migration Paths */}
            {filteredPaths.map((path, index) => {
              const from = latLngToSvg(
                path.from.coordinates.lat,
                path.from.coordinates.lng,
                mapWidth,
                mapHeight,
                mapBounds
              );
              const to = latLngToSvg(
                path.to.coordinates.lat,
                path.to.coordinates.lng,
                mapWidth,
                mapHeight,
                mapBounds
              );

              const pathIndex = index / filteredPaths.length;
              const isVisible = animationProgress >= pathIndex;
              const isActive =
                isAnimating &&
                animationProgress >= pathIndex &&
                animationProgress < pathIndex + 1 / filteredPaths.length;

              const color = getGenerationColor(path.generation);
              const isHovered = hoveredPath === path.id;
              const curvedPath = generateCurvedPath(from.x, from.y, to.x, to.y);

              return (
                <g
                  key={path.id}
                  className="transition-opacity duration-300"
                  style={{
                    opacity: isVisible ? (isHovered ? 1 : 0.7) : 0,
                  }}
                  onMouseEnter={() => setHoveredPath(path.id)}
                  onMouseLeave={() => setHoveredPath(null)}
                  onClick={() => setSelectedPath(path)}
                >
                  {/* Path line */}
                  <path
                    d={curvedPath}
                    fill="none"
                    stroke={color}
                    strokeWidth={isHovered || isActive ? 3 : 2}
                    strokeLinecap="round"
                    markerEnd="url(#arrowhead)"
                    className={isActive ? 'animate-pulse' : ''}
                  />

                  {/* Origin marker */}
                  <circle
                    cx={from.x}
                    cy={from.y}
                    r={isHovered ? 8 : 6}
                    fill={color}
                    stroke="white"
                    strokeWidth={2}
                    filter="url(#glow)"
                  />

                  {/* Destination marker */}
                  <circle
                    cx={to.x}
                    cy={to.y}
                    r={isHovered ? 10 : 8}
                    fill={color}
                    stroke="white"
                    strokeWidth={2}
                    filter="url(#glow)"
                  />

                  {/* Labels on hover */}
                  {isHovered && (
                    <>
                      <text
                        x={from.x}
                        y={from.y - 12}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fill={color}
                      >
                        {path.from.name}
                      </text>
                      <text
                        x={to.x}
                        y={to.y - 14}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fill={color}
                      >
                        {path.to.name}
                      </text>
                      <text
                        x={(from.x + to.x) / 2}
                        y={(from.y + to.y) / 2 - 5}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#666"
                      >
                        {path.personName}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </WorldMapSVG>
        </div>
      </Card>

      {/* Selected Path Info */}
      {selectedPath && (
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{selectedPath.personName}</h3>
              <p className="text-gray-600">
                {t.from}: <strong>{selectedPath.from.name}</strong>
                {selectedPath.from.year && ` (${selectedPath.from.year})`}
              </p>
              <p className="text-gray-600">
                {t.to}: <strong>{selectedPath.to.name}</strong>
                {selectedPath.to.year && ` (${selectedPath.to.year})`}
              </p>
              <Badge
                className="mt-2"
                style={{ backgroundColor: getGenerationColor(selectedPath.generation) }}
              >
                {getGenerationLabel(selectedPath.generation)}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPath(null)}
            >
              Close
            </Button>
          </div>
        </Card>
      )}

      {/* Legend */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">{t.locations}</h4>
        <div className="flex flex-wrap gap-2">
          {data.locationStats.slice(0, 10).map((loc) => (
            <Badge key={`${loc.coordinates.lat}-${loc.coordinates.lng}`} variant="outline">
              {loc.name} ({loc.count})
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
