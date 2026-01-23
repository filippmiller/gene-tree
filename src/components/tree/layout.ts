/**
 * layout.ts
 * 
 * Миссия: Автоматическая раскладка узлов семейного дерева с использованием ELK (Eclipse Layout Kernel)
 * 
 * ELK - это алгоритм Sugiyama для иерархических графов:
 * - Расставляет узлы по уровням (поколениям)
 * - Минимизирует пересечения рёбер
 * - Выравнивает родственников на одном уровне
 * - Поддерживает "союзы" (виртуальные узлы для браков)
 * 
 * Настройки раскладки:
 * - Направление: сверху вниз (предки → потомки)
 * - Расстояние между узлами: 30px
 * - Расстояние между уровнями: 80px
 * - Тип рёбер: ортогональные (прямые углы)
 * 
 * Используется в: TreeCanvas после buildGraph
 */

import ELK, { ElkNode } from 'elkjs/lib/elk.bundled.js';
import type { TreeNode, TreeEdge } from './types';

// Инициализируем ELK
const elk = new ELK();

/**
 * ELK Layout Options
 * 
 * Конфигурация алгоритма раскладки:
 * - algorithm: 'layered' - Sugiyama алгоритм для иерархий
 * - elk.direction: 'DOWN' - сверху вниз (предки вверху, потомки внизу)
 * - spacing.nodeNode: расстояние между соседними узлами по горизонтали
 * - layered.spacing.nodeNodeBetweenLayers: расстояние между уровнями (поколениями)
 * - edgeRouting: 'ORTHOGONAL' - рёбра с прямыми углами
 * - nodePlacement: 'NETWORK_SIMPLEX' - оптимальное размещение для минимизации пересечений
 * - mergeEdges: объединение параллельных рёбер
 * 
 * Документация: https://eclipse.dev/elk/reference.html
 */
const defaultLayoutOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.spacing.nodeNode': '30',
  'elk.layered.spacing.nodeNodeBetweenLayers': '80',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.mergeEdges': 'true',
};

/**
 * applyLayout - главная функция применения раскладки
 * 
 * Миссия: Вычислить оптимальные позиции (x, y) для всех узлов
 * 
 * Процесс:
 * 1. Конвертирует React Flow узлы/рёбра в формат ELK
 * 2. Запускает ELK алгоритм (асинхронно)
 * 3. Конвертирует результат обратно в React Flow формат
 * 4. Возвращает узлы с обновлёнными позициями
 * 
 * @param nodes - массив узлов React Flow (без позиций или с начальными)
 * @param edges - массив рёбер React Flow
 * @param options - опциональные настройки раскладки (перекрывают defaultLayoutOptions)
 * @returns Promise с узлами, у которых установлены position {x, y}
 * 
 * Связи:
 * - Вызывается из TreeCanvas после buildGraph
 * - Результат передаётся в React Flow для отрисовки
 * 
 * Пример использования:
 * ```ts
 * const { nodes, edges } = buildGraph(treeData);
 * const layoutedNodes = await applyLayout(nodes, edges);
 * setNodes(layoutedNodes);
 * setEdges(edges);
 * ```
 */
export async function applyLayout(
  nodes: TreeNode[],
  edges: TreeEdge[],
  options?: Record<string, string>
): Promise<TreeNode[]> {
  // Объединяем настройки
  const layoutOptions = { ...defaultLayoutOptions, ...options };

  /**
   * Конвертация в формат ELK
   * 
   * ELK требует специфичный формат:
   * - Все узлы и рёбра должны быть внутри root графа
   * - Узлы должны иметь width и height
   * - Рёбра должны иметь sources и targets
   */
  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: layoutOptions,
    children: nodes.map((node) => ({
      id: node.id,
      // Размеры узлов для расчёта раскладки
      width: node.type === 'person' ? 180 : 20, // PersonCard: 180px, UnionNode: 20px
      height: node.type === 'person' ? 80 : 20,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  try {
    /**
     * Запуск ELK алгоритма
     * 
     * Это асинхронная операция, может занять 100-500ms в зависимости от размера графа
     * ELK работает в Web Worker, не блокируя основной поток
     */
    const layoutedGraph = await elk.layout(elkGraph);

    /**
     * Конвертация обратно в React Flow формат
     * 
     * ELK возвращает узлы с вычисленными позициями {x, y}
     * Применяем эти позиции к нашим исходным узлам
     */
    const layoutedNodes = nodes.map((node) => {
      const elkNode = layoutedGraph.children?.find((n) => n.id === node.id);
      
      if (elkNode && elkNode.x !== undefined && elkNode.y !== undefined) {
        return {
          ...node,
          position: {
            x: elkNode.x,
            y: elkNode.y,
          },
        };
      }
      
      // Если позиция не найдена, оставляем исходную (0, 0)
      return node;
    });

    return layoutedNodes;
  } catch {
    // В случае ошибки возвращаем узлы без изменений
    return nodes;
  }
}

/**
 * applyLayoutWithAnimation - раскладка с анимацией
 * 
 * Миссия: Плавная анимация перехода узлов к новым позициям
 * 
 * Полезно когда:
 * - Пользователь меняет режим (ancestors → descendants)
 * - Добавляются/удаляются узлы
 * - Меняется depth
 * 
 * @param nodes - текущие узлы (с позициями)
 * @param edges - текущие рёбра
 * @returns Promise с узлами в новых позициях
 * 
 * Используется в: TreeCanvas при динамическом изменении данных
 * 
 * Примечание: React Flow имеет встроенную анимацию при изменении position,
 * поэтому достаточно просто обновить позиции через setState
 */
export async function applyLayoutWithAnimation(
  nodes: TreeNode[],
  edges: TreeEdge[]
): Promise<TreeNode[]> {
  // Применяем обычную раскладку
  const layoutedNodes = await applyLayout(nodes, edges);

  // React Flow автоматически анимирует изменение position
  // Длительность контролируется через CSS transition в стилях React Flow
  
  return layoutedNodes;
}

/**
 * calculateGraphBounds - вычислить границы графа
 * 
 * Миссия: Определить минимальный прямоугольник, содержащий все узлы
 * 
 * Используется для:
 * - Центрирования графа на экране
 * - Подгонки zoom уровня (fitView)
 * - Экспорта в SVG/PNG (определение размера canvas)
 * 
 * @param nodes - узлы с позициями
 * @returns {minX, minY, maxX, maxY, width, height}
 * 
 * Связи:
 * - Используется в TreeCanvas для fitView
 * - Используется при экспорте (SVG/PNG)
 */
export function calculateGraphBounds(nodes: TreeNode[]) {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const width = node.type === 'person' ? 180 : 20;
    const height = node.type === 'person' ? 80 : 20;

    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * centerGraph - центрировать граф относительно (0, 0)
 * 
 * Миссия: Сдвинуть все узлы так, чтобы центр графа был в точке (0, 0)
 * 
 * Полезно для:
 * - Симметричного отображения
 * - Упрощения навигации (proband в центре)
 * 
 * @param nodes - узлы с позициями после layout
 * @returns узлы с центрированными позициями
 * 
 * Используется в: TreeCanvas опционально после applyLayout
 */
export function centerGraph(nodes: TreeNode[]): TreeNode[] {
  const bounds = calculateGraphBounds(nodes);
  
  const centerX = bounds.minX + bounds.width / 2;
  const centerY = bounds.minY + bounds.height / 2;

  return nodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x - centerX,
      y: node.position.y - centerY,
    },
  }));
}
