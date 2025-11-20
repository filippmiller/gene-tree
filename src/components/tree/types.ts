// Types for family tree visualization

export type Person = {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  maiden_name?: string;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birth_date?: string;
  death_date?: string;
  photo_url?: string;
  is_alive?: boolean;
};

export type ParentChild = {
  parent_id: string;
  child_id: string;
};

export type Union = {
  union_id: string;
  p1: string;
  p2?: string;
  role_p1?: string;  // 'husband', 'wife', 'partner'
  role_p2?: string;  // 'husband', 'wife', 'partner'
  marriage_date?: string;
  divorce_date?: string;
};

export type UnionChild = {
  union_id: string;
  child_id: string;
};

export type TreeData = {
  persons: Person[];
  parentChild: ParentChild[];
  unions: Union[];
  unionChildren: UnionChild[];
};

export type TreeMode = 'ancestors' | 'descendants' | 'hourglass';

export type TreeRequest = {
  proband_id: string;
  mode: TreeMode;
  depth?: number; // default 4
};

export type TreeStats = {
  total_people: number;
  total_parent_child_links: number;
  total_unions: number;
  total_union_children: number;
};

// React Flow types
export type PersonNodeData = {
  person: Person;
};

export type UnionNodeData = {
  union: Union;
};

export type TreeNodeType = 'person' | 'union';

export type TreeNode = {
  id: string;
  type: TreeNodeType;
  data: PersonNodeData | UnionNodeData;
  position: { x: number; y: number };
};

export type TreeEdge = {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
};
