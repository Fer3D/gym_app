import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight } from 'lucide-react';
import { exerciseApi } from '../../lib/api';
import type { Exercise } from '../../lib/utils';
import { Spinner } from '../common/UI';

interface ExerciseSearchProps {
  onSelect: (exercise: Exercise) => void;
}

const CATEGORY_ES: Record<string, string> = {
  'Abs': 'Abdominales',
  'Arms': 'Brazos',
  'Back': 'Espalda',
  'Calves': 'Gemelos',
  'Cardio': 'Cardio',
  'Chest': 'Pecho',
  'Legs': 'Piernas',
  'Shoulders': 'Hombros',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Abs': '🏋️', 'Arms': '💪', 'Back': '🦴', 'Calves': '🦵',
  'Cardio': '🏃', 'Chest': '🫁', 'Legs': '🦿', 'Shoulders': '🤷',
};

export function ExerciseSearch({ onSelect }: ExerciseSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const { data: categories } = useQuery({
    queryKey: ['exercise-categories'],
    queryFn: () => exerciseApi.categories().then((r) => r.data),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const { data, isLoading } = useQuery({
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

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 pb-2 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Buscar ejercicio... (p.ej. sentadilla, press)"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category filter */}
        {!debouncedQ && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => { setSelectedCategory(null); setPage(1); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!selectedCategory ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              Todos
            </button>
            {(categories || []).map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.name); setPage(1); }}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedCategory === cat.name ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
              >
                <span>{CATEGORY_ICONS[cat.name] || '🏋️'}</span>
                {CATEGORY_ES[cat.name] || cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}
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
              {/* Category icon */}
              <div className="w-10 h-10 bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">
                {CATEGORY_ICONS[ex.category] || '🏋️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium leading-tight">{ex.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {ex.category && (
                    <span className="text-[10px] bg-indigo-900/40 text-indigo-400 px-1.5 py-0.5 rounded-full">
                      {CATEGORY_ES[ex.category] || ex.category}
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

        {/* Pagination */}
        {!debouncedQ && data?.pages && data.pages > 1 && (
          <div className="flex items-center gap-2 pt-2 justify-center">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-xs disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              ← Anterior
            </button>
            <span className="text-slate-400 text-xs">{page} / {data.pages}</span>
            <button
              onClick={() => setPage(Math.min(data.pages, page + 1))}
              disabled={page === data.pages}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-xs disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
