'use client';

import { useState, useEffect, useCallback } from 'react';

interface Props {
  userId: string;
}

export default function KinSearchForm({ userId }: Props) {
  const [phrase, setPhrase] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced live search
  const searchKinship = useCallback(async (searchPhrase: string) => {
    if (!searchPhrase || searchPhrase.length < 5) {
      setResult(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/kin/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ egoId: userId, phrase: searchPhrase })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Ошибка поиска');
        setResult(null);
      } else {
        setResult(data);
        setError(null);
      }
    } catch (err) {
      setError('Ошибка сети');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Debounce: wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (phrase) {
        searchKinship(phrase);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [phrase, searchKinship]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">
          🔍 Введите русскую фразу родства
        </label>
        <input
          type="text"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder='Например: "сестра мамы", "дочка брата", "бабушка папы"'
        />
        <p className="text-xs text-gray-500 mt-1">
          💡 Введите минимум 5 символов - результаты появятся автоматически
        </p>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center gap-2 text-blue-600 text-sm">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          Поиск...
        </div>
      )}

      {/* Error message */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {result && !loading && !error && (
        <div className="space-y-3">
          {result.results && result.results.length > 0 ? (
            result.results.map((r: any, idx: number) => (
              <div key={idx} className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-green-900 text-lg">
                      ✓ {r.name_ru}
                    </div>
                    <div className="text-sm text-green-700 mt-1">
                      Путь: <code className="bg-white px-2 py-0.5 rounded">{r.path_expr}</code>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm text-orange-800">
              Не найдено совпадений. Попробуйте другую фразу.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
