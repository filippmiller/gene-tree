'use client';

import { useState, useEffect, useCallback } from 'react';

interface Props {
  userId?: string;
  onRelationshipFound?: (pathExpr: string, canonicalLabel: string) => void;
}

interface SearchResult {
  person_id: string;
  path_expr: string;
  name_ru: string;
}

/**
 * Live kinship search component
 * Searches by Russian phrases like "сестра мамы", "дочка брата"
 * Debounced for performance
 */
export default function KinshipSearchField({ userId, onRelationshipFound }: Props) {
  const [phrase, setPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pathInfo, setPathInfo] = useState<{ path: string; label: string } | null>(null);

  /**
   * Debounced search function
   * Waits 500ms after user stops typing before making API call
   */
  const searchKinship = useCallback(async (searchPhrase: string) => {
    if (!searchPhrase || searchPhrase.length < 3) {
      setResults([]);
      setPathInfo(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/kin/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          egoId: userId,
          phrase: searchPhrase,
        }),
      });

      if (!response.ok) {
        throw new Error('Не удалось найти тип связи');
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setResults(data.results);
        // Extract path and label from first result
        const first = data.results[0];
        setPathInfo({
          path: first.path_expr,
          label: first.name_ru,
        });
        // Auto-select this relationship type
        if (onRelationshipFound) {
          onRelationshipFound(first.path_expr, first.name_ru);
        }
      } else {
        setPathInfo(null);
        setError('Не найдено. Попробуйте: "сестра мамы", "дочка брата"');
      }
    } catch (err: any) {
      setError(err.message);
      setPathInfo(null);
    } finally {
      setLoading(false);
    }
  }, [userId, onRelationshipFound]);

  // Debounce logic: wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (phrase) {
        searchKinship(phrase);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [phrase, searchKinship]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        🔍 Быстрый поиск по фразе (необязательно)
      </label>
      
      <input
        type="text"
        value={phrase}
        onChange={(e) => setPhrase(e.target.value)}
        placeholder='Например: "сестра мамы", "дочка брата", "бабушка папы"'
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      />

      {/* Loading indicator */}
      {loading && (
        <div className="text-sm text-blue-600 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          Поиск...
        </div>
      )}

      {/* Error message */}
      {error && !loading && (
        <div className="text-sm text-orange-600">
          ⚠️ {error}
        </div>
      )}

      {/* Success result */}
      {pathInfo && !loading && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="text-sm font-medium text-green-900">
            ✓ Найдено: <span className="font-bold">{pathInfo.label}</span>
          </div>
          <div className="text-xs text-green-700 mt-1">
            Путь: {pathInfo.path}
          </div>
        </div>
      )}

      {/* Help text */}
      {!phrase && (
        <div className="text-xs text-gray-500">
          💡 Введите русскую фразу для автоматического определения типа связи
        </div>
      )}
    </div>
  );
}
