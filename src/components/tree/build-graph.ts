/**
 * build-graph.ts
 * 
 * Миссия: Преобразование данных TreeData в формат React Flow (узлы и рёбра)
 * 
 * Создаёт два типа узлов:
 * 1. Person nodes - карточки людей
 * 2. Union nodes - виртуальные узлы браков/партнёрств
 * 
 * Создаёт рёбра:
 * 1. person → union (родитель к браку)
 * 2. union → person (брак к ребёнку)
 * 
 * Используется в: TreeCanvas компонент перед применением layout
 */

import type { 
  TreeData, 
  TreeNode, 
  TreeEdge, 
  PersonNodeData, 
  UnionNodeData 
} from './types';

/**
 * buildGraph - главная функция построения графа
 * 
 * Преобразует сырые данные из API в структуру узлов и рёбер для React Flow
 * 
 * Алгоритм:
 * 1. Создаёт узлы для всех людей (type='person')
 * 2. Создаёт узлы для всех союзов (type='union')
 * 3. Создаёт рёбра от людей к союзам (если человек в браке)
 * 4. Создаёт рёбра от союзов к детям
 * 5. Создаёт прямые рёбра родитель→ребёнок для одиноких родителей
 * 
 * @param data - объект TreeData из API
 * @returns объект {nodes, edges} для React Flow
 * 
 * Связи:
 * - Вызывается из TreeCanvas при получении данных
 * - Результат передаётся в layout.ts для расчёта позиций
 */
export function buildGraph(data: TreeData): { nodes: TreeNode[]; edges: TreeEdge[] } {
  const nodes: TreeNode[] = [];
  const edges: TreeEdge[] = [];

  // 1. Создаём узлы для людей
  data.persons.forEach((person) => {
    nodes.push({
      id: person.id,
      type: 'person',
      data: { person } as PersonNodeData,
      position: { x: 0, y: 0 }, // Позиции будут рассчитаны в layout.ts
    });
  });

  // 2. Создаём узлы для союзов (браков)
  data.unions.forEach((union) => {
    nodes.push({
      id: union.union_id,
      type: 'union',
      data: { union } as UnionNodeData,
      position: { x: 0, y: 0 },
    });
  });

  // 3. Создаём рёбра: person → union (родители к браку)
  data.unions.forEach((union) => {
    // Ребро от первого родителя (p1) к союзу
    edges.push({
      id: `${union.p1}-${union.union_id}`,
      source: union.p1,
      target: union.union_id,
      type: 'smoothstep', // Тип линии: плавные изгибы
    });

    // Ребро от второго родителя (p2) к союзу, если есть
    if (union.p2) {
      edges.push({
        id: `${union.p2}-${union.union_id}`,
        source: union.p2,
        target: union.union_id,
        type: 'smoothstep',
      });
    }
  });

  // 4. Создаём рёбра: union → child (от брака к детям)
  data.unionChildren.forEach((uc) => {
    edges.push({
      id: `${uc.union_id}-${uc.child_id}`,
      source: uc.union_id,
      target: uc.child_id,
      type: 'smoothstep',
    });
  });

  // 5. Создаём прямые рёбра parent → child для одиноких родителей
  // (тех, кто не входит ни в один союз)
  const unionParentIds = new Set<string>();
  data.unions.forEach((union) => {
    unionParentIds.add(union.p1);
    if (union.p2) unionParentIds.add(union.p2);
  });

  data.parentChild.forEach((pc) => {
    // Если родитель не в союзе, создаём прямое ребро
    if (!unionParentIds.has(pc.parent_id)) {
      edges.push({
        id: `${pc.parent_id}-${pc.child_id}`,
        source: pc.parent_id,
        target: pc.child_id,
        type: 'smoothstep',
      });
    }
  });

  return { nodes, edges };
}

/**
 * validateGraph - проверка целостности графа
 * 
 * Миссия: Убедиться что граф корректен (нет "висячих" рёбер)
 * 
 * Проверяет:
 * - Все source/target рёбер существуют в узлах
 * - Нет циклов (опционально)
 * 
 * @param nodes - массив узлов
 * @param edges - массив рёбер
 * @returns {valid: boolean, errors: string[]}
 * 
 * Используется в: отладка, опционально перед рендерингом
 */
export function validateGraph(
  nodes: TreeNode[], 
  edges: TreeEdge[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  // Проверка что все source и target существуют
  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge ${edge.id} has invalid source: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge ${edge.id} has invalid target: ${edge.target}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * filterGraphByDepth - фильтрация графа по глубине от proband
 * 
 * Миссия: Показать только N поколений от выбранного человека
 * 
 * Используется когда пользователь меняет depth через UI
 * Позволяет динамически убирать/добавлять поколения без повторного запроса API
 * 
 * @param nodes - все узлы
 * @param edges - все рёбра
 * @param probandId - ID корневого человека
 * @param maxDepth - максимальное количество поколений
 * @returns отфильтрованные {nodes, edges}
 * 
 * Используется в: TreeCanvas при изменении depth slider
 */
export function filterGraphByDepth(
  nodes: TreeNode[],
  edges: TreeEdge[],
  probandId: string,
  maxDepth: number
): { nodes: TreeNode[]; edges: TreeEdge[] } {
  // BFS (поиск в ширину) для определения расстояния от proband
  const distances = new Map<string, number>();
  const queue: Array<{ id: string; depth: number }> = [{ id: probandId, depth: 0 }];
  distances.set(probandId, 0);

  // Строим граф связей для быстрого обхода
  const adjacency = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
    adjacency.get(edge.source)!.push(edge.target);
    adjacency.get(edge.target)!.push(edge.source);
  });

  // BFS обход
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    
    if (depth >= maxDepth) continue;

    const neighbors = adjacency.get(id) || [];
    neighbors.forEach((neighborId) => {
      if (!distances.has(neighborId)) {
        distances.set(neighborId, depth + 1);
        queue.push({ id: neighborId, depth: depth + 1 });
      }
    });
  }

  // Фильтруем узлы и рёбра по расстоянию
  const filteredNodeIds = new Set(
    Array.from(distances.entries())
      .filter(([_, dist]) => dist <= maxDepth)
      .map(([id, _]) => id)
  );

  const filteredNodes = nodes.filter((node) => filteredNodeIds.has(node.id));
  const filteredEdges = edges.filter(
    (edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}
