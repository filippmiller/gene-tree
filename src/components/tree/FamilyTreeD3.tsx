'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

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
}

export default function FamilyTreeD3({ nodes, edges }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    try {
      // Clear previous content
      d3.select(svgRef.current).selectAll('*').remove();

      const width = svgRef.current.clientWidth || 800;
      const height = svgRef.current.clientHeight || 600;

      // Create SVG with zoom
      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height);

      const g = svg.append('g');

      // Zoom behavior
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

      svg.call(zoom as any);

      // Create force simulation
      const simulation = d3.forceSimulation(nodes as any)
        .force('link', d3.forceLink(edges)
          .id((d: any) => d.id)
          .distance(150))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(60));

      // Create arrow markers for parent-child relationships
      svg.append('defs').selectAll('marker')
        .data(['parent_child'])
        .enter().append('marker')
        .attr('id', d => `arrow-${d}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#999');

      // Draw edges
      const link = g.append('g')
        .selectAll('line')
        .data(edges)
        .enter().append('line')
        .attr('stroke', d => d.type === 'spouse' ? '#e91e63' : '#999')
        .attr('stroke-width', d => d.type === 'spouse' ? 3 : 2)
        .attr('marker-end', d => d.type === 'parent_child' ? 'url(#arrow-parent_child)' : '');

      // Draw nodes
      const node = g.append('g')
        .selectAll('g')
        .data(nodes)
        .enter().append('g')
        .attr('cursor', 'pointer')
        .call(d3.drag<any, any>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended) as any);

      // Node circles
      node.append('circle')
        .attr('r', 20)
        .attr('fill', d => {
          if (d.gender === 'male' || d.gender === 'm') return '#3b82f6';
          if (d.gender === 'female' || d.gender === 'f') return '#ec4899';
          return '#6b7280';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      // Node labels
      node.append('text')
        .attr('dy', 35)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#333')
        .text(d => d.label.length > 20 ? d.label.substring(0, 20) + '...' : d.label);

      // Update positions on simulation tick
      simulation.on('tick', () => {
        link
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
  }, [nodes, edges]);

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <h3 className="font-semibold mb-2">Ошибка отрисовки дерева</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-center">
        <p>Нет данных для отображения. Добавьте родственников и подтвердите связи.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] border border-gray-300 rounded-lg bg-white">
      <svg ref={svgRef} className="w-full h-full"></svg>
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>Мужчина</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-pink-500"></div>
            <span>Женщина</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-0.5 bg-gray-400"></div>
            <span>Родитель → Ребёнок</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-1 bg-pink-600"></div>
            <span>Супруги</span>
          </div>
          <span className="ml-auto">💡 Перетаскивайте узлы, масштабируйте колёсиком</span>
        </div>
      </div>
    </div>
  );
}
