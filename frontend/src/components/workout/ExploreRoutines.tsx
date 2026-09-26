import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, Play, Bookmark, Check } from 'lucide-react';
import { routineApi } from '../../lib/api';
import type { Routine } from '../../lib/utils';
import { Spinner, QueryError, MutationError } from '../common/UI';
import { todayString } from '../../lib/utils';

interface ExploreRoutinesProps {
  onWorkoutStarted: (workoutId: number) => void;
  onClose: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-900/40 text-green-400',
  intermediate: 'bg-amber-900/40 text-amber-400',
  advanced: 'bg-red-900/40 text-red-400',
};

const CATEGORY_COLORS: Record<string, string> = {
  'fuerza': 'bg-indigo-900/40 text-indigo-400',
  'hipertrofia': 'bg-purple-900/40 text-purple-400',
  'cardio': 'bg-cyan-900/40 text-cyan-400',
  'principiante': 'bg-green-900/40 text-green-400',
  'volumen': 'bg-pink-900/40 text-pink-400',
  'pérdida de grasa': 'bg-orange-900/40 text-orange-400',
};

export function ExploreRoutines({ onWorkoutStarted, onClose }: ExploreRoutinesProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [startingRoutine, setStartingRoutine] = useState<{ id: string; dayIndex: number } | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const levelLabel = (level: string) => {
    const key = `explore.${level}`;
    const translated = t(key);
    return translated === key ? level : translated;
  };

  const { data: routines = [], isLoading, isError, refetch } = useQuery<Routine[]>({
    queryKey: ['explore-routines'],
    queryFn: () => routineApi.explore().then((r) => r.data),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: (routine: Routine) =>
      routineApi.save({
        name: routine.name,
        description: routine.description,
        level: routine.level,
        daysPerWeek: routine.daysPerWeek,
        days: routine.days,
        source: 'explore',
        sourceId: String(routine.id),
      }),
    onSuccess: (_data, routine) => {
      setSavedIds((prev) => new Set([...prev, String(routine.id)]));
      qc.invalidateQueries({ queryKey: ['routines'] });
    },
  });

  const startMutation = useMutation({
    mutationFn: ({ id, dayIndex }: { id: string; dayIndex: number }) =>
      routineApi.startFromExplore(id, todayString(), dayIndex),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['workout-day', todayString()] });
      setStartingRoutine(null);
      onWorkoutStarted(res.data.id);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={36} />
      </div>
    );
  }

  if (isError) {
    return (
      <QueryError
        message={t('explore.loadError')}
        onRetry={() => void refetch()}
        className="py-16"
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {(saveMutation.isError || startMutation.isError) && (
        <MutationError
          message={
            saveMutation.isError
              ? t('explore.saveError')
              : t('explore.startError')
          }
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{t('explore.title')}</h2>
          <p className="text-slate-400 text-xs mt-0.5">{t('explore.subtitle', { count: routines.length })}</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-sm">
          {t('explore.back')}
        </button>
      </div>

      <div className="space-y-4">
        {routines.map((routine) => {
          const rid = String(routine.id);
          const isExpanded = expandedId === rid;
          const isSaved = savedIds.has(rid) || saveMutation.variables?.id === routine.id;
          const isStarting = startingRoutine?.id === rid;

          return (
            <motion.div
              key={rid}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass border border-white/5 rounded-2xl overflow-hidden"
            >

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[routine.level] || 'bg-white/10 text-slate-400'}`}>
                        {levelLabel(routine.level)}
                      </span>
                      <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <BookOpen size={9} /> {t('explore.daysPerWeek', { days: routine.daysPerWeek })}
                      </span>
                      {(routine.tags || []).map((tag) => (
                        <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full ${CATEGORY_COLORS[tag] || 'bg-white/5 text-slate-400'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-white font-semibold text-sm">{routine.name}</h3>
                    {routine.description && (
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed line-clamp-2">{routine.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : rid)}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {isExpanded ? t('explore.hideExercises') : t('explore.showExercises')}
                  </button>
                  <button
                    onClick={() => !isSaved && saveMutation.mutate(routine)}
                    disabled={isSaved || saveMutation.isPending}
                    className={`py-2 px-3 rounded-xl text-xs transition-colors flex items-center gap-1.5 ${
                      isSaved
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-white/5 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300'
                    }`}
                  >
                    {isSaved ? <Check size={13} /> : <Bookmark size={13} />}
                    {isSaved ? t('explore.saved') : t('explore.save')}
                  </button>
                  <button
                    onClick={() =>
                      routine.days.length > 1
                        ? setStartingRoutine({ id: rid, dayIndex: 0 })
                        : startMutation.mutate({ id: rid, dayIndex: 0 })
                    }
                    disabled={startMutation.isPending && isStarting}
                    className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Play size={12} />
                    {startMutation.isPending && isStarting ? t('explore.starting') : t('explore.start')}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-white/5"
                  >
                    <div className="p-4 space-y-4">
                      {routine.days.map((day) => (
                        <div key={day.day}>
                          <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                            {day.dayName}
                          </p>
                          <div className="space-y-1.5">
                            {day.exercises.map((ex, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 flex-shrink-0" />
                                <span className="flex-1 text-slate-300 text-xs truncate">{ex.name}</span>
                                <span className="text-slate-500 text-[10px] flex-shrink-0">
                                  {ex.sets}×{ex.reps}
                                </span>
                                <span className="text-slate-600 text-[10px] flex-shrink-0">{ex.muscleGroup}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {startingRoutine && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setStartingRoutine(null)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm glass border border-white/10 rounded-2xl p-5 space-y-4"
            >
              <div>
                <h3 className="text-white font-semibold">{t('explore.pickDayTitle')}</h3>
                <p className="text-slate-400 text-xs mt-1">
                  {routines.find((r) => String(r.id) === startingRoutine.id)?.name}
                </p>
              </div>
              <div className="space-y-2">
                {routines
                  .find((r) => String(r.id) === startingRoutine.id)
                  ?.days.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => startMutation.mutate({ id: startingRoutine.id, dayIndex: idx })}
                      disabled={startMutation.isPending}
                      className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/30 rounded-xl text-left transition-colors"
                    >
                      <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-400 text-xs font-bold">{day.day}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{day.dayName}</p>
                        <p className="text-slate-500 text-xs">{t('explore.exercisesCount', { count: day.exercises.length })}</p>
                      </div>
                      <Play size={14} className="text-indigo-400 flex-shrink-0" />
                    </button>
                  ))}
              </div>
              <button
                onClick={() => setStartingRoutine(null)}
                className="w-full py-2 text-slate-400 text-sm hover:text-white transition-colors"
              >
                {t('explore.cancel')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
