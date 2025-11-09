'use client';

import { useEffect, useState } from 'react';
import FamilyTreeD3 from './FamilyTreeD3';

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

export default function TreeVisualization() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTreeData = async () => {
      try {
        const response = await fetch('/api/tree');
        if (!response.ok) {
          throw new Error('Failed to fetch tree data');
        }
        const data = await response.json();
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      } catch (err) {
        console.error('Error fetching tree data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tree');
      } finally {
        setLoading(false);
      }
    };

    fetchTreeData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Загрузка дерева...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <h3 className="font-semibold mb-2">Ошибка загрузки</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return <FamilyTreeD3 nodes={nodes} edges={edges} />;
}
