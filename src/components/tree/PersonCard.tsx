/**
 * PersonCard.tsx
 * 
 * Миссия: Карточка человека в семейном дереве
 * 
 * Отображает:
 * - Фото (аватар) или placeholder
 * - Имя (first_name + last_name)
 * - Даты жизни: (1901–1988) или (род. 1956)
 * - Визуальные индикаторы: пол (цвет рамки), жив ли человек
 * 
 * Размер: 180×80px (компактная карточка)
 * Стиль: тень, скругление углов, при hover - увеличение
 * 
 * Используется в: TreeCanvas как nodeTypes.person
 */

'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { PersonNodeData } from './types';

/**
 * PersonCard - React Flow узел для отображения человека
 * 
 * @param data - данные узла {person: Person}
 * 
 * Связи:
 * - Регистрируется в TreeCanvas как nodeTypes.person
 * - Handle компоненты создают точки подключения для рёбер
 */
export function PersonCard({ data }: { data: PersonNodeData }) {
  const { person } = data;

  /**
   * formatLifespan - форматирование дат жизни
   * 
   * Форматы:
   * - "(1901–1988)" - обе даты известны
   * - "(род. 1956)" - только дата рождения
   * - "(† 1988)" - только дата смерти (редко)
   * - "" - даты неизвестны
   * 
   * Миссия: компактное отображение временного периода жизни
   */
  const formatLifespan = () => {
    const birth = person.birth_date ? new Date(person.birth_date).getFullYear() : null;
    const death = person.death_date ? new Date(person.death_date).getFullYear() : null;

    if (birth && death) {
      return `(${birth}–${death})`;
    } else if (birth && person.is_alive !== false) {
      return `(род. ${birth})`;
    } else if (birth) {
      return `(${birth}–?)`;
    } else if (death) {
      return `(† ${death})`;
    }
    return '';
  };

  /**
   * getBorderColor - цвет рамки в зависимости от пола
   * 
   * Цвета:
   * - male: голубой (#3b82f6)
   * - female: розовый (#ec4899)
   * - other/unknown: серый (#6b7280)
   * 
   * Миссия: визуальная идентификация пола без текста
   */
  const getBorderColor = () => {
    switch (person.gender) {
      case 'male':
        return 'border-blue-500';
      case 'female':
        return 'border-pink-500';
      default:
        return 'border-gray-500';
    }
  };

  /**
   * getInitials - получить инициалы для placeholder аватара
   * 
   * Миссия: если нет фото, показать инициалы (F M для Filip Miller)
   */
  const getInitials = () => {
    const first = person.first_name?.[0] || '';
    const last = person.last_name?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <div
      className={`
        relative flex items-center gap-3 px-3 py-2
        w-[180px] h-[80px]
        bg-white border-2 ${getBorderColor()}
        rounded-lg shadow-md
        transition-all duration-200
        hover:shadow-lg hover:scale-105
        cursor-pointer
      `}
    >
      {/* Handle для входящих рёбер (сверху) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-gray-400"
      />

      {/* Аватар или инициалы */}
      <div className="flex-shrink-0">
        {person.photo_url ? (
          <img
            src={person.photo_url}
            alt={person.name}
            className="w-12 h-12 rounded-full object-cover border border-gray-300"
          />
        ) : (
          <div className={`
            w-12 h-12 rounded-full
            flex items-center justify-center
            text-white font-semibold text-sm
            ${person.gender === 'male' ? 'bg-blue-500' : person.gender === 'female' ? 'bg-pink-500' : 'bg-gray-500'}
          `}>
            {getInitials()}
          </div>
        )}
      </div>

      {/* Информация */}
      <div className="flex-1 min-w-0">
        {/* Имя */}
        <div className="font-semibold text-sm text-gray-900 truncate">
          {person.name}
        </div>
        
        {/* Даты жизни */}
        <div className="text-xs text-gray-600">
          {formatLifespan()}
        </div>

        {/* Индикатор "усопший" если применимо */}
        {person.is_alive === false && (
          <div className="text-[10px] text-gray-500 italic">
            † усопш{person.gender === 'female' ? 'ая' : 'ий'}
          </div>
        )}
      </div>

      {/* Handle для исходящих рёбер (снизу) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-gray-400"
      />
    </div>
  );
}
