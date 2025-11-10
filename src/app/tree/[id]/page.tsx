/**
 * /tree/[id]/page.tsx
 * 
 * Миссия: Страница визуализации семейного дерева конкретного человека
 * 
 * Функциональность:
 * - Загрузка данных дерева через API /api/tree
 * - Переключение режимов: ancestors/descendants/hourglass
 * - Слайдер глубины: 1-10 поколений
 * - Поиск человека в дереве
 * - Экспорт в SVG/PNG (будущая фича)
 * - Печать в формате A4 (будущая фича)
 * 
 * Используется: по ссылке /tree/{userId}
 * Связи: использует TreeCanvas, вызывает API /api/tree
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TreeCanvas } from '@/components/tree/TreeCanvas';
import type { TreeData, TreeMode } from '@/components/tree/types';

/**
 * TreePage - главная страница дерева
 * 
 * Структура:
 * 1. Боковая панель с контролами (слева)
 * 2. Canvas с деревом (справа, занимает всё оставшееся пространство)
 * 
 * Жизненный цикл:
 * 1. Получает ID из URL params
 * 2. Загружает данные дерева через API с текущими параметрами
 * 3. При изменении mode/depth - перезагружает данные
 * 4. Передаёт данные в TreeCanvas для отрисовки
 */
export default function TreePage() {
  const params = useParams();
  const router = useRouter();
  const personId = params.id as string;

  // State для контролов
  const [mode, setMode] = useState<TreeMode>('ancestors');
  const [depth, setDepth] = useState(4);
  const [searchQuery, setSearchQuery] = useState('');

  // State для данных и загрузки
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * fetchTreeData - загрузка данных дерева через API
   * 
   * Вызывается при:
   * - Первом рендере
   * - Изменении mode
   * - Изменении depth
   * 
   * API: GET /api/tree?proband_id={id}&mode={mode}&depth={depth}
   * Возвращает: {persons, parentChild, unions, unionChildren}
   */
  const fetchTreeData = useCallback(async () => {
    if (!personId) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = `/api/tree?proband_id=${personId}&mode=${mode}&depth=${depth}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tree data');
      }

      const data = await response.json();
      setTreeData(data);
    } catch (err) {
      console.error('Failed to fetch tree:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tree');
    } finally {
      setIsLoading(false);
    }
  }, [personId, mode, depth]);

  // Загружаем данные при первом рендере и при изменении mode/depth
  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  /**
   * handleNodeClick - обработка клика на узел дерева
   * 
   * Навигирует на страницу профиля кликнутого человека
   * Можно расширить: открытие модального окна, выделение узла и т.д.
   */
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      router.push(`/profile/${nodeId}`);
    },
    [router]
  );

  /**
   * handleExportSVG - экспорт дерева в SVG
   * TODO: реализовать экспорт через React Flow API
   */
  const handleExportSVG = () => {
    alert('Экспорт в SVG будет реализован в следующей версии');
  };

  /**
   * handleExportPNG - экспорт дерева в PNG
   * TODO: реализовать экспорт через html2canvas или React Flow API
   */
  const handleExportPNG = () => {
    alert('Экспорт в PNG будет реализован в следующей версии');
  };

  /**
   * handlePrint - печать дерева на A4
   * TODO: создать print CSS для A4 формата
   */
  const handlePrint = () => {
    window.print();
  };

  /**
   * Render
   * 
   * Layout:
   * - Full screen (h-screen)
   * - Flex row
   * - Sidebar (w-80, фиксированная ширина)
   * - Canvas (flex-1, всё оставшееся пространство)
   */
  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar с контролами */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Семейное древо</h1>
          <p className="text-sm text-gray-500 mt-1">
            Визуализация связей и поколений
          </p>
        </div>

        {/* Controls Section */}
        <div className="p-6 space-y-6 flex-1">
          {/* Mode Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Режим отображения
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setMode('ancestors')}
                className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                  mode === 'ancestors'
                    ? 'bg-blue-100 text-blue-900 font-medium'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="font-medium">Предки</div>
                <div className="text-xs text-gray-500">
                  Родители, бабушки, прабабушки...
                </div>
              </button>
              <button
                onClick={() => setMode('descendants')}
                className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                  mode === 'descendants'
                    ? 'bg-blue-100 text-blue-900 font-medium'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="font-medium">Потомки</div>
                <div className="text-xs text-gray-500">
                  Дети, внуки, правнуки...
                </div>
              </button>
              <button
                onClick={() => setMode('hourglass')}
                className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                  mode === 'hourglass'
                    ? 'bg-blue-100 text-blue-900 font-medium'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="font-medium">Песочные часы</div>
                <div className="text-xs text-gray-500">
                  И предки, и потомки вместе
                </div>
              </button>
            </div>
          </div>

          {/* Depth Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Глубина: {depth} поколений
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Поиск человека
            </label>
            <input
              type="text"
              placeholder="Имя, фамилия..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <p className="text-xs text-gray-500 mt-1">
                Функция поиска в разработке
              </p>
            )}
          </div>

          {/* Stats */}
          {treeData && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="text-sm text-gray-600">Статистика:</div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Людей:</span>
                <span className="font-medium">{treeData.persons.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Браков:</span>
                <span className="font-medium">{treeData.unions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Связей:</span>
                <span className="font-medium">
                  {treeData.parentChild.length + treeData.unionChildren.length}
                </span>
              </div>
            </div>
          )}

          {/* Export Buttons */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <button
              onClick={handleExportSVG}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Экспорт SVG
            </button>
            <button
              onClick={handleExportPNG}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Экспорт PNG
            </button>
            <button
              onClick={handlePrint}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Печать A4
            </button>
          </div>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 relative">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-lg text-gray-700">Загрузка дерева...</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="absolute inset-0 bg-white flex items-center justify-center">
            <div className="max-w-md text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Ошибка загрузки
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchTreeData}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        )}

        {/* Tree Canvas */}
        {treeData && !isLoading && !error && (
          <TreeCanvas data={treeData} onNodeClick={handleNodeClick} />
        )}
      </main>
    </div>
  );
}
