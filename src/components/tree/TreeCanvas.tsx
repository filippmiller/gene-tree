/**
 * TreeCanvas.tsx
 * 
 * Миссия: Главный компонент визуализации семейного дерева
 * 
 * Интегрирует:
 * - React Flow (интерактивный canvas)
 * - PersonCard и UnionNode (типы узлов)
 * - buildGraph (преобразование данных)
 * - applyLayout (ELK раскладка)
 * 
 * Возможности:
 * - Панорамирование (drag canvas)
 * - Зум (колесо мыши или кнопки)
 * - MiniMap (миникарта навигации)
 * - Controls (кнопки zoom/fit)
 * - Background (сетка/точки)
 * 
 * Используется на: странице /tree/[id]
 */

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PersonCard } from './PersonCard';
import { UnionNode } from './UnionNode';
import { buildGraph } from './build-graph';
import { applyLayout } from './layout';
import type { TreeData } from './types';
import type { QuickAddType } from './QuickAddMenu';

/**
 * TreeCanvasProps - пропсы компонента
 * 
 * @param data - данные дерева из API (/api/tree)
 * @param onNodeClick - callback при клике на узел (опционально)
 * @param className - дополнительные CSS классы
 */
interface TreeCanvasProps {
  data: TreeData;
  onNodeClick?: (nodeId: string) => void;
  onQuickAdd?: (personId: string, personName: string, type: QuickAddType) => void;
  className?: string;
}

/**
 * TreeCanvas - главный компонент canvas с деревом
 * 
 * Жизненный цикл:
 * 1. Получает data через props
 * 2. Преобразует в граф (buildGraph)
 * 3. Применяет раскладку (applyLayout с ELK)
 * 4. Отрисовывает через React Flow
 * 
 * При изменении data:
 * - Автоматически пересчитывает граф и раскладку
 * - Плавно анимирует переход (React Flow встроенная анимация)
 * 
 * Связи:
 * - Использует PersonCard, UnionNode как nodeTypes
 * - Вызывает buildGraph и applyLayout
 * - Используется на странице /tree/[id]
 */
export function TreeCanvas({ data, onNodeClick, onQuickAdd, className }: TreeCanvasProps) {
  // State для узлов и рёбер (React Flow hooks)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  // State для loading индикатора во время раскладки
  const [isLayouting, setIsLayouting] = useState(false);

  /**
   * nodeTypes - регистрация кастомных типов узлов
   * 
   * React Flow будет использовать эти компоненты для отрисовки узлов
   * в зависимости от node.type
   * 
   * Используем useMemo чтобы не создавать новый объект на каждый рендер
   */
  const nodeTypes = useMemo(
    () => ({
      person: PersonCard,
      union: UnionNode,
    }),
    []
  );

  /**
   * handleNodeClick - обработка клика на узел
   * 
   * Вызывает callback onNodeClick если он передан
   * Можно использовать для:
   * - Открытия модального окна с деталями
   * - Навигации на страницу профиля
   * - Выделения узла
   */
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeClick && node.type === 'person') {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  /**
   * useEffect - пересчёт графа при изменении data
   * 
   * Процесс:
   * 1. Строим граф из данных (buildGraph)
   * 2. Применяем раскладку асинхронно (applyLayout)
   * 3. Обновляем state узлов и рёбер
   * 4. React Flow автоматически перерисовывает с анимацией
   * 
   * Зависимости: [data]
   * Срабатывает при первом рендере и при изменении data
   */
  useEffect(() => {
    async function layoutTree() {
      if (!data || data.persons.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }

      setIsLayouting(true);

      try {
        // 1. Строим граф
        const { nodes: graphNodes, edges: graphEdges } = buildGraph(data);

        // 2. Применяем раскладку с ELK
        const layoutedNodes = await applyLayout(graphNodes, graphEdges);

        // 3. Inject onQuickAdd callback into person nodes
        const nodesWithCallbacks = layoutedNodes.map((node) => {
          if (node.type === 'person' && onQuickAdd) {
            return {
              ...node,
              data: { ...node.data, onQuickAdd },
            };
          }
          return node;
        });

        // 4. Обновляем state
        setNodes(nodesWithCallbacks as Node[]);
        setEdges(graphEdges as Edge[]);
      } catch {
        // Layout failed - tree won't render
      } finally {
        setIsLayouting(false);
      }
    }

    layoutTree();
  }, [data, onQuickAdd, setNodes, setEdges]);

  /**
   * Render
   * 
   * Структура:
   * - ReactFlow контейнер (главный canvas)
   * - Background (сетка или точки)
   * - Controls (кнопки zoom, fit, lock)
   * - MiniMap (миникарта навигации)
   * - Loading overlay (пока идёт раскладка)
   */
  return (
    <div className={`relative w-full h-full ${className || ''}`}>
      {/* Loading overlay */}
      {isLayouting && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm text-gray-600">Расчёт раскладки...</div>
          </div>
        </div>
      )}

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        // Настройки по умолчанию
        fitView
        fitViewOptions={{
          padding: 0.2, // 20% отступ по краям
          minZoom: 0.1,
          maxZoom: 1.5,
        }}
        minZoom={0.1}
        maxZoom={2}
        // Отключаем создание новых связей
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        // Стили рёбер
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        }}
      >
        {/* Background - сетка или точки */}
        <Background
          color="#e2e8f0"
          gap={20}
          size={1}
        />

        {/* Controls - кнопки управления */}
        <Controls
          showZoom
          showFitView
          showInteractive={false}
          position="bottom-right"
        />

        {/* MiniMap - миникарта навигации */}
        <MiniMap
          nodeColor={(node) => {
            // Цвет узла на миникарте в зависимости от типа
            if (node.type === 'union') return '#10b981'; // зелёный для союзов
            // Для людей - в зависимости от пола (из data)
            const personData = node.data as any;
            if (personData?.person?.gender === 'male') return '#3b82f6'; // голубой
            if (personData?.person?.gender === 'female') return '#ec4899'; // розовый
            return '#6b7280'; // серый по умолчанию
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          position="bottom-left"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
          }}
        />
      </ReactFlow>
    </div>
  );
}
