'use client';

import { useEffect, useState } from 'react';
import { TreeCanvas } from './TreeCanvas';
import { PersonProfileDialog } from './PersonProfileDialog';
import type { TreeData } from './types';
import { logger } from '@/lib/logger';

interface Props {
  rootPersonId: string;
  currentUserId: string;
}

export default function TreeCanvasWrapper({ rootPersonId }: Props) {
  const [activeRootId, setActiveRootId] = useState<string>(rootPersonId);
  const [backgroundRootId, setBackgroundRootId] = useState<string | null>(null);
  const [mainTreeData, setMainTreeData] = useState<TreeData | null>(null);
  const [miniTreeData, setMiniTreeData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  useEffect(() => {
    fetchTreeData(activeRootId, true);
  }, [activeRootId]);

  useEffect(() => {
    // Fetch mini-tree data when background root changes
    if (backgroundRootId) {
      fetchTreeData(backgroundRootId, false);
    } else {
      setMiniTreeData(null);
    }
  }, [backgroundRootId]);

  const fetchTreeData = async (rootId: string, isMainTree: boolean) => {
    try {
      if (isMainTree) {
        setLoading(true);
        setError(null);
      }

      const response = await fetch(`/api/tree-data?root_id=${rootId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch tree data');
      }

      const result = await response.json();

      if (isMainTree) {
        setMainTreeData(result);

        // Detect spouse for mini-tree
        const spouse = result.unions?.find((u: any) =>
          u.p1 === rootId || u.p2 === rootId
        );

        if (spouse) {
          const spouseId = spouse.p1 === rootId ? spouse.p2 : spouse.p1;
          setBackgroundRootId(spouseId);
        } else {
          setBackgroundRootId(null);
        }
      } else {
        setMiniTreeData(result);
      }
    } catch (err: any) {
      if (isMainTree) {
        setError(err.message);
      }
      logger.error('[TREE-CANVAS] Error:', err);
    } finally {
      if (isMainTree) {
        setLoading(false);
      }
    }
  };

  const handleFocusSwitch = () => {
    if (!backgroundRootId) return;

    // Swap active and background
    const newActive = backgroundRootId;
    const newBackground = activeRootId;

    setActiveRootId(newActive);
    setBackgroundRootId(newBackground);

    // Swap tree data
    const tempData = mainTreeData;
    setMainTreeData(miniTreeData);
    setMiniTreeData(tempData);
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedPersonId(nodeId);
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

  if (!mainTreeData || mainTreeData.persons.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-gray-600">
          No family tree data available
        </div>
      </div>
    );
  }

  return (
    <>
      <TreeCanvas data={mainTreeData} onNodeClick={handleNodeClick} />
      {miniTreeData && backgroundRootId && (
        <div
          className="absolute right-4 top-4 w-80 h-96 bg-white/90 backdrop-blur rounded-lg shadow-lg cursor-pointer transform scale-75 opacity-80 hover:opacity-100 transition-all"
          onClick={handleFocusSwitch}
        >
          <div className="p-2 border-b bg-gray-50 rounded-t-lg">
            <h3 className="text-sm font-semibold text-gray-700">
              Spouse's Family Tree
            </h3>
            <p className="text-xs text-gray-500">Click to switch focus</p>
          </div>
          <div className="h-full overflow-hidden">
            <TreeCanvas
              data={miniTreeData}
              onNodeClick={() => { }}
            />
          </div>
        </div>
      )}
      <PersonProfileDialog
        personId={selectedPersonId}
        isOpen={!!selectedPersonId}
        onClose={() => setSelectedPersonId(null)}
      />
    </>
  );
}
