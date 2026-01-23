'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Link as LinkIcon } from 'lucide-react';

interface Props {
  profileId: string;
}

interface Interest {
  id: string;
  title: string;
  description: string | null;
}

interface InterestItem {
  id: string;
  interest_id: string;
  kind: 'photo' | 'link' | 'video';
  url: string | null;
  title: string | null;
  notes: string | null;
}

export default function ProfileInterestsSection({ profileId }: Props) {
  const supabase = createClient();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [itemsByInterest, setItemsByInterest] = useState<Record<string, InterestItem[]>>({});
  const [creatingTitle, setCreatingTitle] = useState('');
  const [creatingDescription, setCreatingDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: interestsData } = await supabase
        .from('profile_interests')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: true });

      const typedInterests = (interestsData || []) as any as Interest[];
      setInterests(typedInterests);

      if (typedInterests.length > 0) {
        const interestIds = typedInterests.map((i) => i.id);
        const { data: itemsData } = await supabase
          .from('profile_interest_items')
          .select('*')
          .in('interest_id', interestIds)
          .order('created_at', { ascending: true });

        const grouped: Record<string, InterestItem[]> = {};
        (itemsData || []).forEach((raw: any) => {
          const item = raw as InterestItem;
          if (!grouped[item.interest_id]) grouped[item.interest_id] = [];
          grouped[item.interest_id].push(item);
        });
        setItemsByInterest(grouped);
      } else {
        setItemsByInterest({});
      }
    } finally {
      setLoading(false);
    }
  }, [profileId, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateInterest(e: React.FormEvent) {
    e.preventDefault();
    if (!creatingTitle.trim()) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('profile_interests')
        .insert({
          profile_id: profileId,
          title: creatingTitle.trim(),
          description: creatingDescription.trim() || null,
        })
        .select('*')
        .single();

      if (error) throw error;
      if (data) {
        setInterests((prev) => [...prev, data as Interest]);
        setCreatingTitle('');
        setCreatingDescription('');
      }
    } catch (error: any) {
      console.error('[Interests] Failed to create interest', error);
      alert('Не удалось создать интерес: ' + (error.message || 'Ошибка'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddLink(interestId: string, form: HTMLFormElement) {
    const urlInput = form.elements.namedItem('url') as HTMLInputElement;
    const titleInput = form.elements.namedItem('title') as HTMLInputElement;

    const url = urlInput.value.trim();
    const title = titleInput.value.trim();

    if (!url) return;

    try {
      const { data, error } = await supabase
        .from('profile_interest_items')
        .insert({
          interest_id: interestId,
          kind: 'link',
          url,
          title: title || null,
        })
        .select('*')
        .single();

      if (error) throw error;
      const item = data as InterestItem;
      setItemsByInterest((prev) => ({
        ...prev,
        [interestId]: [...(prev[interestId] || []), item],
      }));

      urlInput.value = '';
      titleInput.value = '';
    } catch (error: any) {
      console.error('[Interests] Failed to add link', error);
      alert('Не удалось добавить ссылку: ' + (error.message || 'Ошибка'));
    }
  }

  return (
    <section className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Мои интересы</h2>
          <p className="text-sm text-gray-600">
            Расскажите о своих увлечениях, коллекциях и любимых вещах.
          </p>
        </div>
      </div>

      {/* Create interest */}
      <form onSubmit={handleCreateInterest} className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Название интереса</label>
          <input
            type="text"
            value={creatingTitle}
            onChange={(e) => setCreatingTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Например, Коллекция монет"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Описание (по желанию)</label>
          <input
            type="text"
            value={creatingDescription}
            onChange={(e) => setCreatingDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Коротко опишите, чем вы увлекаетесь"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !creatingTitle.trim()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Добавить интерес
        </button>
      </form>

      {/* List interests */}
      {loading ? (
        <p className="text-sm text-gray-500">Загрузка интересов...</p>
      ) : interests.length === 0 ? (
        <p className="text-sm text-gray-500">
          Пока нет добавленных интересов. Создайте первый интерес и прикрепите ссылки или фото.
        </p>
      ) : (
        <div className="space-y-4">
          {interests.map((interest) => (
            <div key={interest.id} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{interest.title}</h3>
                {interest.description && (
                  <p className="text-xs text-gray-600 mt-1">{interest.description}</p>
                )}
              </div>

              {/* Items list */}
              <div className="space-y-2">
                {(itemsByInterest[interest.id] || []).length === 0 ? (
                  <p className="text-xs text-gray-500">Пока нет материалов. Добавьте ссылку на фото, альбом или статью.</p>
                ) : (
                  <ul className="space-y-1 text-xs text-gray-800">
                    {itemsByInterest[interest.id].map((item) => (
                      <li key={item.id} className="flex items-center gap-2">
                        <LinkIcon className="w-3 h-3 text-gray-500" />
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-blue-700 truncate"
                          >
                            {item.title || item.url}
                          </a>
                        ) : (
                          <span>{item.title}</span>
                        )}
                        {item.notes && (
                          <span className="text-gray-500">— {item.notes}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Add link form */}
              <form
                className="flex flex-col md:flex-row gap-2 items-stretch md:items-end mt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddLink(interest.id, e.currentTarget);
                }}
              >
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">URL</label>
                  <input
                    name="url"
                    type="url"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Подпись</label>
                  <input
                    name="title"
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs"
                    placeholder="Например, Моя коллекция монет"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700"
                >
                  <Plus className="w-3 h-3" />
                  Добавить ссылку
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
