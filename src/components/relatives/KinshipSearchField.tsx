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
  const [applied, setApplied] = useState(false);

  /**
   * Debounced search function
   * Waits 500ms after user stops typing before making API call
   */
  const searchKinship = useCallback(async (searchPhrase: string) => {
    if (!searchPhrase || searchPhrase.length < 3) {
      setResults([]);
      setPathInfo(null);
      setApplied(false);
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
        // Graceful fallback: try to read JSON; if not available, show friendly message
        const friendly = 'Не удалось найти связи';
        try {
          const t = await response.text();
          const j = t ? JSON.parse(t) : null;
          if (j?.results) {
            setResults(j.results);
            setError(null);
            return;
          }
        } catch {}
        setResults([]);
        setPathInfo(null);
        setError(friendly);
        return;
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setResults(data.results);
        // Preview first result but do NOT auto-apply
        const first = data.results[0];
        setPathInfo({ path: first.path_expr, label: first.name_ru });
        setApplied(false);
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
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results.length > 0) {
            const r = results[0];
            onRelationshipFound?.(r.path_expr, r.name_ru);
            setPathInfo({ path: r.path_expr, label: r.name_ru });
            setApplied(true);
          }
        }}
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

      {/* Results list */}
      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {results.slice(0, 3).map((r, idx) => (
            <div key={idx} className={`p-3 border rounded-md ${idx === 0 ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{r.name_ru}</span>
                  <span className="ml-2 text-xs text-gray-500">{r.path_expr}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onRelationshipFound?.(r.path_expr, r.name_ru);
                    setPathInfo({ path: r.path_expr, label: r.name_ru });
                    setApplied(true);
                  }}
                  className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Применить
                </button>
              </div>
            </div>
          ))}
          {applied && (
            <div className="text-xs text-green-700">Связь применена. Можно изменить вручную ниже или выбрать другой вариант.</div>
          )}
          <div>
            <button
              type="button"
              onClick={() => { setResults([]); setPathInfo(null); setPhrase(''); setApplied(false); }}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              Сбросить поиск
            </button>
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
