'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Node {
  id: string;
  label: string;
  avatar?: string;
  gender?: string;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
}

interface Props {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (node: Node) => void;
}

// Color schemes for light/dark mode
const colors = {
  light: {
    male: '#3b82f6',
    female: '#ec4899',
    neutral: '#6b7280',
    maleGlow: 'rgba(59, 130, 246, 0.4)',
    femaleGlow: 'rgba(236, 72, 153, 0.4)',
    neutralGlow: 'rgba(107, 114, 128, 0.4)',
    spouse: '#ec4899',
    parentChild: '#94a3b8',
    text: '#1f2937',
    textMuted: '#6b7280',
    background: '#ffffff',
  },
  dark: {
    male: '#60a5fa',
    female: '#f472b6',
    neutral: '#9ca3af',
    maleGlow: 'rgba(96, 165, 250, 0.3)',
    femaleGlow: 'rgba(244, 114, 182, 0.3)',
    neutralGlow: 'rgba(156, 163, 175, 0.3)',
    spouse: '#f472b6',
    parentChild: '#64748b',
    text: '#f9fafb',
    textMuted: '#9ca3af',
    background: '#0f172a',
  },
};

export default function FamilyTreeD3({ nodes, edges, onNodeClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const colorScheme = isDark ? colors.dark : colors.light;

    try {
      // Clear previous content
      d3.select(svgRef.current).selectAll('*').remove();

      const width = containerRef.current.clientWidth || 800;
      const height = containerRef.current.clientHeight || 600;

      // Create SVG with zoom
      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height)
        .style('background', 'transparent');

      // Add filter definitions for glow effect
      const defs = svg.append('defs');

      // Glow filter
      const filter = defs.append('filter')
        .attr('id', 'glow')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');

      filter.append('feGaussianBlur')
        .attr('stdDeviation', '3')
        .attr('result', 'coloredBlur');

      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'coloredBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

      // Gradient for nodes
      ['male', 'female', 'neutral'].forEach((type) => {
        const gradient = defs.append('radialGradient')
          .attr('id', `gradient-${type}`)
          .attr('cx', '30%')
          .attr('cy', '30%');

        const baseColor = type === 'male' ? colorScheme.male :
                         type === 'female' ? colorScheme.female :
                         colorScheme.neutral;

        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', d3.color(baseColor)?.brighter(0.5)?.toString() || baseColor);

        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', baseColor);
      });

      const g = svg.append('g');

      // Zoom behavior with smooth transitions
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

      svg.call(zoom as any);

      // Initial zoom to fit
      svg.call(zoom.transform as any, d3.zoomIdentity.translate(width / 4, height / 4).scale(0.8));

      // Create force simulation
      const simulation = d3.forceSimulation(nodes as any)
        .force('link', d3.forceLink(edges)
          .id((d: any) => d.id)
          .distance(180)
          .strength(0.5))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(70));

      // Create arrow markers
      defs.append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 35)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', colorScheme.parentChild);

      // Draw edges with animation
      const link = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(edges)
        .enter().append('line')
        .attr('stroke', d => d.type === 'spouse' ? colorScheme.spouse : colorScheme.parentChild)
        .attr('stroke-width', d => d.type === 'spouse' ? 3 : 2)
        .attr('stroke-dasharray', d => d.type === 'spouse' ? '8,4' : 'none')
        .attr('marker-end', d => d.type === 'parent_child' ? 'url(#arrow)' : '')
        .attr('opacity', 0)
        .transition()
        .duration(800)
        .delay((d, i) => i * 50)
        .attr('opacity', 0.6);

      // Draw nodes with animation
      const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(nodes)
        .enter().append('g')
        .attr('cursor', 'pointer')
        .attr('opacity', 0)
        .call(d3.drag<any, any>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended) as any);

      // Animate nodes in
      node.transition()
        .duration(600)
        .delay((d, i) => i * 100)
        .attr('opacity', 1);

      // Node outer glow circle (for hover effect)
      node.append('circle')
        .attr('r', 32)
        .attr('fill', 'transparent')
        .attr('class', 'glow-circle')
        .style('transition', 'all 0.3s ease');

      // Main node circle
      node.append('circle')
        .attr('r', 24)
        .attr('fill', d => {
          const gender = d.gender?.toLowerCase();
          if (gender === 'male' || gender === 'm') return `url(#gradient-male)`;
          if (gender === 'female' || gender === 'f') return `url(#gradient-female)`;
          return `url(#gradient-neutral)`;
        })
        .attr('stroke', colorScheme.background)
        .attr('stroke-width', 3)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
        .style('transition', 'all 0.3s ease');

      // Avatar image or initial
      node.each(function(d: any) {
        const g = d3.select(this);

        if (d.avatar) {
          // Clip path for circular avatar
          defs.append('clipPath')
            .attr('id', `clip-${d.id}`)
            .append('circle')
            .attr('r', 20);

          g.append('image')
            .attr('xlink:href', d.avatar)
            .attr('x', -20)
            .attr('y', -20)
            .attr('width', 40)
            .attr('height', 40)
            .attr('clip-path', `url(#clip-${d.id})`)
            .attr('preserveAspectRatio', 'xMidYMid slice');
        } else {
          // Initial letter
          g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .attr('fill', 'white')
            .attr('pointer-events', 'none')
            .text(d.label.charAt(0).toUpperCase());
        }
      });

      // Node labels
      node.append('text')
        .attr('dy', 42)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', '500')
        .attr('fill', colorScheme.text)
        .attr('pointer-events', 'none')
        .text(d => d.label.length > 15 ? d.label.substring(0, 15) + '...' : d.label);

      // Hover effects
      node
        .on('mouseenter', function(event, d: any) {
          const sel = d3.select(this);

          // Scale up
          sel.select('circle:nth-child(2)')
            .transition()
            .duration(200)
            .attr('r', 28)
            .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))');

          // Add glow
          const gender = d.gender?.toLowerCase();
          const glowColor = gender === 'male' || gender === 'm' ? colorScheme.maleGlow :
                          gender === 'female' || gender === 'f' ? colorScheme.femaleGlow :
                          colorScheme.neutralGlow;

          sel.select('.glow-circle')
            .transition()
            .duration(200)
            .attr('r', 36)
            .attr('fill', glowColor);

          // Highlight connected edges
          link.filter((l: any) => l.source.id === d.id || l.target.id === d.id)
            .transition()
            .duration(200)
            .attr('stroke-width', l => (l as any).type === 'spouse' ? 4 : 3)
            .attr('opacity', 1);
        })
        .on('mouseleave', function(event, d: any) {
          const sel = d3.select(this);

          sel.select('circle:nth-child(2)')
            .transition()
            .duration(200)
            .attr('r', 24)
            .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

          sel.select('.glow-circle')
            .transition()
            .duration(200)
            .attr('r', 32)
            .attr('fill', 'transparent');

          link.transition()
            .duration(200)
            .attr('stroke-width', l => (l as any).type === 'spouse' ? 3 : 2)
            .attr('opacity', 0.6);
        })
        .on('click', function(event, d: any) {
          if (onNodeClick) {
            // Click animation
            d3.select(this).select('circle:nth-child(2)')
              .transition()
              .duration(100)
              .attr('r', 22)
              .transition()
              .duration(100)
              .attr('r', 28);

            onNodeClick(d);
          }
        });

      // Update positions on simulation tick
      simulation.on('tick', () => {
        g.selectAll('.links line')
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });

      // Drag functions
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

    } catch (err) {
      console.error('Error rendering tree:', err);
      setError(err instanceof Error ? err.message : 'Failed to render tree');
    }
  }, [nodes, edges, isDark, onNodeClick]);

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-semibold">Error rendering tree</h3>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (nodes.length === 0) {
    return (
      <Card elevation="raised">
        <CardContent className="p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-muted-foreground">
            No data to display. Add relatives and confirm relationships.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation="raised" className="overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-[600px] bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950"
      >
        <svg ref={svgRef} className="w-full h-full" />
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-5 h-5 rounded-full shadow-sm",
              isDark ? "bg-blue-400" : "bg-blue-500"
            )} />
            <span className="text-muted-foreground">Male</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-5 h-5 rounded-full shadow-sm",
              isDark ? "bg-pink-400" : "bg-pink-500"
            )} />
            <span className="text-muted-foreground">Female</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-slate-400 dark:bg-slate-500" />
            <span className="text-muted-foreground">Parent → Child</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-1 border-t-2 border-dashed",
              isDark ? "border-pink-400" : "border-pink-500"
            )} />
            <span className="text-muted-foreground">Spouse</span>
          </div>
          <Badge variant="secondary" className="ml-auto">
            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Drag nodes • Scroll to zoom
          </Badge>
        </div>
      </div>
    </Card>
  );
}
