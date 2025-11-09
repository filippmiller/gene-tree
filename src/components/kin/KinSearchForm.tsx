'use client';

import { useState } from 'react';

interface Props {
  userId: string;
}

export default function KinSearchForm({ userId }: Props) {
  const [egoId, setEgoId] = useState(userId);
  const [phrase, setPhrase] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/kin/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ egoId, phrase })
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">ID исходной персоны (uuid)</label>
          <input
            type="text"
            value={egoId}
            onChange={(e) => setEgoId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="ваш user ID"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Фраза поиска</label>
          <input
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Например: дочка сестры мамы"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Поиск...' : 'Найти'}
        </button>
      </form>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Результат:</h2>
          <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </>
  );
}
