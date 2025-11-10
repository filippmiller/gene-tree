/**
 * UnionNode.tsx
 * 
 * Миссия: Виртуальный узел союза (брака/партнёрства) в семейном дереве
 * 
 * Отображает:
 * - Маленький ромб или круг (~20px)
 * - Опционально: дату брака при hover
 * - Цвет зависит от статуса (активный брак / развод)
 * 
 * Размер: 20×20px (компактный узел-соединитель)
 * Стиль: минималистичный, не отвлекает от людей
 * 
 * Используется в: TreeCanvas как nodeTypes.union
 * Связывает двух родителей с их детьми через рёбра
 */

'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { UnionNodeData } from './types';

/**
 * UnionNode - React Flow узел для отображения союза (брака)
 * 
 * @param data - данные узла {union: Union}
 * 
 * Связи:
 * - Регистрируется в TreeCanvas как nodeTypes.union
 * - Соединяет родителей (входящие рёбра сверху) с детьми (исходящие рёбра снизу)
 * - Handle сверху принимает рёбра от двух родителей
 * - Handle снизу выпускает рёбра к детям
 */
export function UnionNode({ data }: { data: UnionNodeData }) {
  const { union } = data;

  /**
   * formatMarriageDate - форматирование даты брака
   * 
   * Форматы:
   * - "1985" - только год
   * - "15.06.1985" - полная дата
   * 
   * Миссия: показать когда был заключён брак (для tooltip)
   */
  const formatMarriageDate = () => {
    if (!union.marriage_date) return null;
    const date = new Date(union.marriage_date);
    return date.getFullYear();
  };

  /**
   * getNodeColor - цвет узла в зависимости от статуса брака
   * 
   * Цвета:
   * - Активный брак: зелёный (#10b981)
   * - Развод: оранжевый (#f59e0b)
   * - Без даты развода: зелёный (по умолчанию)
   * 
   * Миссия: визуальное разделение активных браков и разводов
   */
  const getNodeColor = () => {
    if (union.divorce_date) {
      return 'bg-orange-500'; // Развод
    }
    return 'bg-green-500'; // Активный брак
  };

  /**
   * getTooltipText - текст для tooltip при hover
   * 
   * Показывает:
   * - Дату брака если есть
   * - Дату развода если есть
   * - "Партнёры" если нет дат
   */
  const getTooltipText = () => {
    const parts: string[] = [];
    
    if (union.marriage_date) {
      parts.push(`Брак: ${formatMarriageDate()}`);
    }
    
    if (union.divorce_date) {
      const divorceYear = new Date(union.divorce_date).getFullYear();
      parts.push(`Развод: ${divorceYear}`);
    }
    
    if (parts.length === 0) {
      parts.push('Партнёры');
    }
    
    return parts.join(' • ');
  };

  return (
    <div className="relative group">
      {/* Handle для входящих рёбер от родителей (сверху) */}
      {/* Позволяет подключить двух родителей */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-transparent"
        style={{ top: -6 }}
      />

      {/* Основной узел - маленький круг */}
      <div
        className={`
          w-5 h-5 rounded-full
          ${getNodeColor()}
          border-2 border-white
          shadow-sm
          transition-all duration-200
          group-hover:scale-125
          cursor-pointer
        `}
        title={getTooltipText()}
      />

      {/* Tooltip при hover - показывается рядом с узлом */}
      <div className={`
        absolute left-6 top-0
        px-2 py-1 
        bg-gray-900 text-white text-xs rounded
        whitespace-nowrap
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        pointer-events-none
        z-10
      `}>
        {getTooltipText()}
      </div>

      {/* Handle для исходящих рёбер к детям (снизу) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-transparent"
        style={{ bottom: -6 }}
      />
    </div>
  );
}
