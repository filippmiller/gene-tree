/**
 * Types for "How Are We Related?" feature
 */

export interface PathNode {
  profile_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  relationship_to_next: string | null;
}

export interface RelationshipPathResult {
  found: boolean;
  path_length: number | null;
  path: PathNode[];
}

// API Request/Response types
export interface FindRelationshipPathRequest {
  person1_id: string;
  person2_id: string;
  max_depth?: number;
}

export interface FindRelationshipPathResponse {
  success: boolean;
  result?: RelationshipPathResult;
  error?: string;
}

// Helper functions
export function getRelationshipLabel(type: string | null): string {
  if (!type) return '';

  const labels: Record<string, string> = {
    parent: 'Parent',
    child: 'Child',
    spouse: 'Spouse',
    sibling: 'Sibling',
    grandparent: 'Grandparent',
    grandchild: 'Grandchild',
    uncle_aunt: 'Uncle/Aunt',
    niece_nephew: 'Niece/Nephew',
    cousin: 'Cousin',
    step_parent: 'Step-Parent',
    step_child: 'Step-Child',
    step_sibling: 'Step-Sibling',
    in_law: 'In-Law',
    other: 'Related',
  };

  return labels[type] || type;
}

export function getRelationshipArrow(type: string | null): string {
  if (!type) return '→';

  // Directional relationships
  const upward = ['parent', 'grandparent', 'uncle_aunt', 'step_parent'];
  const downward = ['child', 'grandchild', 'niece_nephew', 'step_child'];
  const lateral = ['sibling', 'spouse', 'cousin', 'step_sibling', 'in_law'];

  if (upward.includes(type)) return '↑';
  if (downward.includes(type)) return '↓';
  if (lateral.includes(type)) return '↔';

  return '→';
}

export function describeRelationship(path: PathNode[]): string {
  if (path.length === 0) return 'No connection found';
  if (path.length === 1) return 'Same person';
  if (path.length === 2) {
    const rel = path[0].relationship_to_next;
    return getRelationshipLabel(rel);
  }

  // For longer paths, describe the full connection
  const steps: string[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    if (path[i].relationship_to_next) {
      steps.push(getRelationshipLabel(path[i].relationship_to_next));
    }
  }

  if (steps.length === 0) return 'Connected';
  if (steps.length === 1) return steps[0];
  if (steps.length === 2) return `${steps[0]}'s ${steps[1]}`;

  return steps.join(' → ');
}

export function getDegreesOfSeparation(pathLength: number | null): string {
  if (pathLength === null) return 'Not connected';
  if (pathLength === 0) return 'Same person';
  if (pathLength === 1) return 'Directly connected';
  if (pathLength === 2) return '2nd degree';
  if (pathLength === 3) return '3rd degree';
  return `${pathLength}th degree`;
}

export function formatPathForDisplay(path: PathNode[]): string {
  if (path.length === 0) return '';

  return path
    .map((node, i) => {
      const name = `${node.first_name} ${node.last_name}`;
      if (i === path.length - 1) return name;
      const arrow = getRelationshipArrow(node.relationship_to_next);
      return `${name} ${arrow}`;
    })
    .join(' ');
}
