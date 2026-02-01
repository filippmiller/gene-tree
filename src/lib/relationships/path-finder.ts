/**
 * Path Finder - BFS algorithm to find relationship paths between two people
 *
 * Works with the pending_relatives table (unified relationship storage)
 */

export interface PathStep {
  profileId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  gender: 'male' | 'female' | 'unknown' | null;
  relationshipType: string | null; // Relationship TO the next person in path
  direction: 'up' | 'down' | 'lateral' | null; // up = toward ancestor, down = toward descendant
}

export interface PathResult {
  found: boolean;
  pathLength: number;
  path: PathStep[];
  rawSteps: Array<{
    fromId: string;
    toId: string;
    relationshipType: string;
  }>;
}

interface GraphNode {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  gender: 'male' | 'female' | 'unknown' | null;
}

interface GraphEdge {
  fromId: string;
  toId: string;
  relationshipType: string;
  direction: 'up' | 'down' | 'lateral';
}

/**
 * Build a bidirectional adjacency graph from relationships
 * Returns nodes and edges for BFS traversal
 */
export function buildRelationshipGraph(
  userProfiles: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    gender: string | null;
  }>,
  pendingRelatives: Array<{
    id: string;
    invited_by: string;
    first_name: string;
    last_name: string;
    relationship_type: string;
    is_pending?: boolean | null;
    is_verified?: boolean | null;
  }>
): { nodes: Map<string, GraphNode>; adjacency: Map<string, GraphEdge[]> } {
  const nodes = new Map<string, GraphNode>();
  const adjacency = new Map<string, GraphEdge[]>();

  // Add all user profiles as nodes
  for (const profile of userProfiles) {
    nodes.set(profile.id, {
      id: profile.id,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      avatarUrl: profile.avatar_url,
      gender: (profile.gender as 'male' | 'female' | 'unknown') || null,
    });
    adjacency.set(profile.id, []);
  }

  // Add all pending relatives as nodes (if not already present)
  for (const rel of pendingRelatives) {
    if (!nodes.has(rel.id)) {
      nodes.set(rel.id, {
        id: rel.id,
        firstName: rel.first_name,
        lastName: rel.last_name,
        avatarUrl: null,
        gender: null,
      });
      adjacency.set(rel.id, []);
    }
    if (!nodes.has(rel.invited_by)) {
      // This shouldn't happen in normal cases, but handle it
      nodes.set(rel.invited_by, {
        id: rel.invited_by,
        firstName: 'Unknown',
        lastName: '',
        avatarUrl: null,
        gender: null,
      });
      adjacency.set(rel.invited_by, []);
    }
  }

  // Build edges from relationships
  for (const rel of pendingRelatives) {
    const relType = rel.relationship_type;
    const direction = getRelationshipDirection(relType);
    const inverseType = getInverseRelationship(relType);
    const inverseDirection = getInverseDirection(direction);

    // Add edge: invited_by -> id
    const forwardEdge: GraphEdge = {
      fromId: rel.invited_by,
      toId: rel.id,
      relationshipType: relType,
      direction,
    };

    // Add edge: id -> invited_by (inverse)
    const backwardEdge: GraphEdge = {
      fromId: rel.id,
      toId: rel.invited_by,
      relationshipType: inverseType,
      direction: inverseDirection,
    };

    const fromEdges = adjacency.get(rel.invited_by) || [];
    fromEdges.push(forwardEdge);
    adjacency.set(rel.invited_by, fromEdges);

    const toEdges = adjacency.get(rel.id) || [];
    toEdges.push(backwardEdge);
    adjacency.set(rel.id, toEdges);
  }

  return { nodes, adjacency };
}

/**
 * Determine the direction of a relationship
 */
function getRelationshipDirection(relType: string): 'up' | 'down' | 'lateral' {
  const upward = ['parent', 'grandparent', 'great-grandparent'];
  const downward = ['child', 'grandchild', 'great-grandchild'];
  const lateral = ['sibling', 'spouse', 'cousin'];

  if (upward.includes(relType)) return 'up';
  if (downward.includes(relType)) return 'down';
  if (lateral.includes(relType)) return 'lateral';

  // Default heuristics for other types
  if (relType.includes('aunt') || relType.includes('uncle')) return 'up';
  if (relType.includes('niece') || relType.includes('nephew')) return 'down';

  return 'lateral';
}

/**
 * Get the inverse relationship type
 */
function getInverseRelationship(relType: string): string {
  const inverses: Record<string, string> = {
    parent: 'child',
    child: 'parent',
    grandparent: 'grandchild',
    grandchild: 'grandparent',
    'great-grandparent': 'great-grandchild',
    'great-grandchild': 'great-grandparent',
    sibling: 'sibling',
    spouse: 'spouse',
    cousin: 'cousin',
    aunt: 'niece_nephew',
    uncle: 'niece_nephew',
    aunt_uncle: 'niece_nephew',
    niece: 'aunt_uncle',
    nephew: 'aunt_uncle',
    niece_nephew: 'aunt_uncle',
  };

  return inverses[relType] || relType;
}

/**
 * Get the inverse direction
 */
function getInverseDirection(direction: 'up' | 'down' | 'lateral'): 'up' | 'down' | 'lateral' {
  if (direction === 'up') return 'down';
  if (direction === 'down') return 'up';
  return 'lateral';
}

/**
 * Find the shortest path between two people using BFS
 */
export function findPathBFS(
  nodes: Map<string, GraphNode>,
  adjacency: Map<string, GraphEdge[]>,
  startId: string,
  endId: string,
  maxDepth: number = 15
): PathResult {
  // Same person check
  if (startId === endId) {
    const node = nodes.get(startId);
    if (!node) {
      return { found: false, pathLength: 0, path: [], rawSteps: [] };
    }
    return {
      found: true,
      pathLength: 0,
      path: [{
        profileId: node.id,
        firstName: node.firstName,
        lastName: node.lastName,
        avatarUrl: node.avatarUrl,
        gender: node.gender,
        relationshipType: null,
        direction: null,
      }],
      rawSteps: [],
    };
  }

  // Validate nodes exist
  if (!nodes.has(startId) || !nodes.has(endId)) {
    return { found: false, pathLength: 0, path: [], rawSteps: [] };
  }

  // BFS
  interface BFSNode {
    id: string;
    depth: number;
    prevId: string | null;
    prevEdge: GraphEdge | null;
  }

  const visited = new Map<string, BFSNode>();
  const queue: BFSNode[] = [];

  visited.set(startId, {
    id: startId,
    depth: 0,
    prevId: null,
    prevEdge: null,
  });
  queue.push(visited.get(startId)!);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.depth >= maxDepth) continue;

    const edges = adjacency.get(current.id) || [];

    for (const edge of edges) {
      if (visited.has(edge.toId)) continue;

      const neighbor: BFSNode = {
        id: edge.toId,
        depth: current.depth + 1,
        prevId: current.id,
        prevEdge: edge,
      };

      visited.set(edge.toId, neighbor);
      queue.push(neighbor);

      // Found target
      if (edge.toId === endId) {
        return buildPathFromBFS(nodes, visited, startId, endId);
      }
    }
  }

  return { found: false, pathLength: 0, path: [], rawSteps: [] };
}

/**
 * Reconstruct the path from BFS visited map
 */
function buildPathFromBFS(
  nodes: Map<string, GraphNode>,
  visited: Map<string, { id: string; depth: number; prevId: string | null; prevEdge: GraphEdge | null }>,
  startId: string,
  endId: string
): PathResult {
  const pathIds: string[] = [];
  const rawSteps: Array<{ fromId: string; toId: string; relationshipType: string }> = [];

  let currentId: string | null = endId;

  while (currentId) {
    pathIds.unshift(currentId);
    const node = visited.get(currentId);
    if (!node) break;

    if (node.prevEdge) {
      rawSteps.unshift({
        fromId: node.prevId!,
        toId: currentId,
        relationshipType: node.prevEdge.relationshipType,
      });
    }

    currentId = node.prevId;
  }

  // Build path with profile data
  const path: PathStep[] = pathIds.map((id, index) => {
    const nodeData = nodes.get(id);

    // Get relationship to NEXT person (not previous)
    let relationshipToNext: string | null = null;
    let direction: 'up' | 'down' | 'lateral' | null = null;

    if (index < pathIds.length - 1) {
      const nextId = pathIds[index + 1];
      // Find the step that goes from current to next
      const step = rawSteps.find(s => s.fromId === id && s.toId === nextId);
      if (step) {
        relationshipToNext = step.relationshipType;
        direction = getRelationshipDirection(step.relationshipType);
      }
    }

    return {
      profileId: id,
      firstName: nodeData?.firstName || 'Unknown',
      lastName: nodeData?.lastName || '',
      avatarUrl: nodeData?.avatarUrl || null,
      gender: nodeData?.gender || null,
      relationshipType: relationshipToNext,
      direction,
    };
  });

  return {
    found: true,
    pathLength: pathIds.length - 1,
    path,
    rawSteps,
  };
}
