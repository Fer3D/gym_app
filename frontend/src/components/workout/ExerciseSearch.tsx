import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight } from 'lucide-react';
import { exerciseApi } from '../../lib/api';
import type { Exercise } from '../../lib/utils';
import { EXERCISE_CATEGORY_ICONS, exerciseCategoryIcon, translateExerciseCategory } from '../../lib/utils';
import { Spinner, QueryError } from '../common/UI';

interface ExerciseSearchProps {
  onSelect: (exercise: Exercise) => void;
}

export function ExerciseSearch({ onSelect }: ExerciseSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const categoryLabel = (name: string) => translateExerciseCategory(name, t);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const { data: categories } = useQuery({
    queryKey: ['exercise-categories'],
    queryFn: () => exerciseApi.categories().then((r) => r.data),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['exercise-list', page, selectedCategory, debouncedQ],
    queryFn: async () => {
      if (debouncedQ.length > 1) {
        return exerciseApi.search(debouncedQ).then((r) => ({ exercises: r.data.exercises || [], count: 0, pages: 1 }));
      }
      return exerciseApi.list(page, selectedCategory ? { category: categories?.find((c: any) => c.name === selectedCategory)?.id } : {})
        .then((r) => r.data);
    },
    staleTime: 5 * 60 * 1000,
  });

  const exercises: Exercise[] = data?.exercises || [];
  const listFailed = isError && !data;

  return (
    <div className="flex flex-col h-full">

      <div className="p-4 pb-2 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder={t('exerciseSearch.placeholder')}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>

        {!debouncedQ && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => { setSelectedCategory(null); setPage(1); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!selectedCategory ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              {t('exerciseSearch.all')}
            </button>
            {(categories || []).map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.name); setPage(1); }}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedCategory === cat.name ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
              >
                <span>{EXERCISE_CATEGORY_ICONS[cat.name] || '🏋️'}</span>
                {categoryLabel(cat.name)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {listFailed ? (
          <QueryError
            message={t('exerciseSearch.loadError')}
            onRetry={() => void refetch()}
            className="py-8"
          />
        ) : isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <>
            <AnimatePresence>
              {exercises.map((ex, i) => (
                <motion.button
                  key={ex.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => onSelect(ex)}
                  className="w-full flex items-center gap-3 p-3 bg-white/3 hover:bg-white/8 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all text-left"
                >
                  <div className="w-10 h-10 bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden text-lg">
                    {ex.images?.[0] ? (
                      <img src={ex.images[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      exerciseCategoryIcon(ex.category)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium leading-tight">{ex.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ex.category && (
                        <span className="text-[10px] bg-indigo-900/40 text-indigo-400 px-1.5 py-0.5 rounded-full">
                          {categoryLabel(ex.category)}
                        </span>
                      )}
                      {(ex.muscles || []).slice(0, 2).map((m) => (
                        <span key={m.id} className="text-[10px] bg-white/5 text-slate-400 px-1.5 py-0.5 rounded-full">
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 flex-shrink-0" />
                </motion.button>
              ))}
            </AnimatePresence>

            {exercises.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-8">
                {debouncedQ ? t('exerciseSearch.emptySearch') : t('exerciseSearch.emptyList')}
              </p>
            )}

            {!debouncedQ && data?.pages && data.pages > 1 && (
              <div className="flex items-center gap-2 pt-2 justify-center">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-xs disabled:opacity-30 hover:bg-white/10 transition-colors"
                >
                  {t('exerciseSearch.prev')}
                </button>
                <span className="text-slate-400 text-xs">{t('exerciseSearch.page', { page, pages: data.pages })}</span>
                <button
                  onClick={() => setPage(Math.min(data.pages, page + 1))}
                  disabled={page === data.pages}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-xs disabled:opacity-30 hover:bg-white/10 transition-colors"
                >
                  {t('exerciseSearch.next')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
