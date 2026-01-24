'use client';

import type { PathNode } from '@/types/relationship-path';
import { getRelationshipLabel, getRelationshipArrow } from '@/types/relationship-path';

interface PathVisualizationProps {
  path: PathNode[];
  className?: string;
}

export default function PathVisualization({ path, className = '' }: PathVisualizationProps) {
  if (path.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {path.map((node, index) => (
          <div key={node.profile_id} className="flex items-center">
            {/* Person node */}
            <div className="flex flex-col items-center">
              {node.avatar_url ? (
                <img
                  src={node.avatar_url}
                  alt={[node.first_name, node.last_name].filter(Boolean).join(' ') || '?'}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-semibold border-2 border-white shadow-md">
                  {node.first_name?.[0] || '?'}
                </div>
              )}
              <span className="text-sm font-medium text-gray-800 mt-2 max-w-[80px] text-center truncate">
                {node.first_name || '?'}
              </span>
              <span className="text-xs text-gray-500 max-w-[80px] text-center truncate">
                {node.last_name || ''}
              </span>
            </div>

            {/* Connection arrow */}
            {index < path.length - 1 && node.relationship_to_next && (
              <div className="flex flex-col items-center mx-3">
                <span className="text-2xl text-gray-400">
                  {getRelationshipArrow(node.relationship_to_next)}
                </span>
                <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                  {getRelationshipLabel(node.relationship_to_next)}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
