'use client';

import { useEffect, useState } from 'react';
import { TreeCanvas } from './TreeCanvas';
import type { TreeData } from './types';

interface Props {
  rootPersonId: string;
  currentUserId: string;
}

export default function TreeCanvasWrapper({ rootPersonId }: Props) {
  const [data, setData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTreeData();
  }, [rootPersonId]);

  const fetchTreeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tree-data?root_id=${rootPersonId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch tree data');
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
      console.error('[TREE-CANVAS] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-600">Loading family tree...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">Error</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!data || data.persons.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-gray-600">
          No family tree data available
        </div>
      </div>
    );
  }

  return <TreeCanvas data={data} />;
}
