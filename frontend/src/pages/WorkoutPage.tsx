import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Check, X,
  Zap, BookOpen, Compass, Play,
  ChevronDown, ChevronUp, Pencil,
} from 'lucide-react';
import { workoutApi, routineApi } from '../lib/api';
import type { Exercise, WorkoutLog, ExerciseLog, Routine } from '../lib/utils';
import { todayString, dateToString, formatDateLabel, isValidDateString, weightAnomalyWarning, exerciseCategoryIcon, translateExerciseCategory } from '../lib/utils';
import type { ExerciseSet } from '../lib/utils';
import { ExerciseSearch } from '../components/workout/ExerciseSearch';
import { RoutineBuilder } from '../components/workout/RoutineBuilder';
import { ExploreRoutines } from '../components/workout/ExploreRoutines';
import { Modal, Spinner, EmptyState, QueryError, MutationError } from '../components/common/UI';
import { format, addDays, parseISO } from 'date-fns';

type MainTab = 'today' | 'routines';
type RoutinesSubView = 'list' | 'create' | 'explore';

export function WorkoutPage() {
  const { t } = useTranslation();
  const freeWorkoutName = t('workout.freeName');
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [mainTab, setMainTab] = useState<MainTab>('today');
  const [routinesSubView, setRoutinesSubView] = useState<RoutinesSubView>('list');
  const [selectedDate, setSelectedDate] = useState(() =>
    isValidDateString(searchParams.get('date')) ? searchParams.get('date')! : todayString()
  );
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [activeWorkoutId, setActiveWorkoutId] = useState<number | null>(null);
  const [openSetTypeId, setOpenSetTypeId] = useState<number | null>(null);

  const [startingRoutine, setStartingRoutine] = useState<Routine | null>(null);

  useEffect(() => {
    if (openSetTypeId == null) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest('[data-set-type-menu], [data-set-type-trigger]')) return;
      setOpenSetTypeId(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [openSetTypeId]);

  useEffect(() => {
    const fromUrl = searchParams.get('date');
    if (isValidDateString(fromUrl)) setSelectedDate(fromUrl);
  }, [searchParams]);

  const {
    data: workouts = [],
    isLoading,
    isError: workoutsError,
    refetch: refetchWorkouts,
  } = useQuery({
    queryKey: ['workout-day', selectedDate],
    queryFn: () => workoutApi.getDay(selectedDate).then((r) => r.data),
  });

  const invalidateWorkoutDay = () => {
    void qc.invalidateQueries({ queryKey: ['workout-day', selectedDate] });
    void qc.invalidateQueries({ queryKey: ['calendar-summary'] });
  };

  const createWorkoutMutation = useMutation({
    mutationFn: (name: string) => workoutApi.create(selectedDate, { name }),
    onSuccess: (res) => {
      invalidateWorkoutDay();
      setActiveWorkoutId(res.data.id);
      setMainTab('today');
    },
  });

  const deleteWorkoutMutation = useMutation({
    mutationFn: (id: number) => workoutApi.delete(id),
    onSuccess: () => invalidateWorkoutDay(),
  });

  const addExerciseMutation = useMutation({
    mutationFn: ({ workoutId, exercise }: { workoutId: number; exercise: Exercise }) =>
      workoutApi.addExercise(workoutId, {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroup: (exercise.muscles[0]?.name) || '',
        category: exercise.category,
        imageUrl: exercise.images?.[0] || null,
      }),
    onSuccess: () => {
      invalidateWorkoutDay();
      setShowExerciseSearch(false);
    },
  });

  const reorderExercisesMutation = useMutation({
    mutationFn: ({ workoutId, orderedIds }: { workoutId: number; orderedIds: number[] }) =>
      workoutApi.reorderExercises(workoutId, { orderedIds }),
    onSuccess: () => invalidateWorkoutDay(),
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: (id: number) => workoutApi.deleteExercise(id),
    onSuccess: () => invalidateWorkoutDay(),
  });

  const updateExerciseMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      workoutApi.updateExercise(id, data),
    onSuccess: () => invalidateWorkoutDay(),
  });

  const addSetMutation = useMutation({
    mutationFn: ({ exerciseId, data }: { exerciseId: number; data: any }) => workoutApi.addSet(exerciseId, data),
    onSuccess: () => invalidateWorkoutDay(),
  });

  const updateSetMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => workoutApi.updateSet(id, data),
    onSuccess: () => invalidateWorkoutDay(),
  });

  const deleteSetMutation = useMutation({
    mutationFn: (id: number) => workoutApi.deleteSet(id),
    onSuccess: () => invalidateWorkoutDay(),
  });

  const {
    data: savedRoutines = [],
    isError: routinesError,
    isLoading: routinesLoading,
    refetch: refetchRoutines,
  } = useQuery<Routine[]>({
    queryKey: ['routines'],
    queryFn: () => routineApi.getAll().then((r) => r.data),
  });

  const deleteRoutineMutation = useMutation({
    mutationFn: (id: number) => routineApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });

  const startFromSavedMutation = useMutation({
    mutationFn: ({ id, dayIndex }: { id: number; dayIndex: number }) =>
      routineApi.startFromSaved(id, selectedDate, dayIndex),
    onSuccess: (res) => {
      invalidateWorkoutDay();
      setActiveWorkoutId(res.data.id);
      setStartingRoutine(null);
      setMainTab('today');
    },
  });

  const mutationError =
    (createWorkoutMutation.isError && t('workout.errCreate')) ||
    (deleteWorkoutMutation.isError && t('workout.errDelete')) ||
    (addExerciseMutation.isError && t('workout.errAddExercise')) ||
    (reorderExercisesMutation.isError && t('workout.errReorder')) ||
    (deleteExerciseMutation.isError && t('workout.errDeleteExercise')) ||
    (updateExerciseMutation.isError && t('workout.errUpdateExercise')) ||
    (addSetMutation.isError && t('workout.errAddSet')) ||
    (updateSetMutation.isError && t('workout.errUpdateSet')) ||
    (deleteSetMutation.isError && t('workout.errDeleteSet')) ||
    (deleteRoutineMutation.isError && t('workout.errDeleteRoutine')) ||
    (startFromSavedMutation.isError && t('workout.errStartRoutine')) ||
    null;

  const goToDay = (delta: number) => {
    const d = parseISO(selectedDate);
    setSelectedDate(dateToString(addDays(d, delta)));
  };

  const activeWorkout = (workouts as WorkoutLog[]).find((w) => w.id === activeWorkoutId)
    || (workouts as WorkoutLog[])[0];

  const handleWorkoutStarted = (workoutId: number) => {
    invalidateWorkoutDay();
    setActiveWorkoutId(workoutId);
    setMainTab('today');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('workout.title')}</h1>
        {mainTab === 'today' && (workouts as WorkoutLog[]).length === 0 && !isLoading && selectedDate === todayString() && (
          <button
            onClick={() => createWorkoutMutation.mutate(freeWorkoutName)}
            disabled={createWorkoutMutation.isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Zap size={15} /> {t('workout.start')}
          </button>
        )}
      </div>

      <div className="flex gap-1 p-1 glass border border-white/5 rounded-2xl" role="tablist" aria-label={t('workout.tabAria')}>
        {([['today', t('workout.tabToday')], ['routines', t('workout.tabRoutines')]] as [MainTab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={mainTab === tab}
            onClick={() => setMainTab(tab)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              mainTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mainTab === 'today' && (
        <div className="space-y-4">

          <div className="flex items-center gap-3 glass border border-indigo-500/10 rounded-2xl px-4 py-3">
            <button type="button" onClick={() => goToDay(-1)} aria-label={t('workout.previousDay')} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
              <ChevronLeft size={18} />
            </button>
            <div className="flex-1 text-center">
              <p className="text-white font-semibold text-sm capitalize">{formatDateLabel(selectedDate)}</p>
              <p className="text-slate-400 text-xs">{format(parseISO(selectedDate), 'dd/MM/yyyy')}</p>
            </div>
            <button
              type="button"
              onClick={() => goToDay(1)}
              disabled={selectedDate >= todayString()}
              aria-label={t('workout.nextDay')}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {mutationError && <MutationError message={mutationError} />}

          {(workouts as WorkoutLog[]).length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(workouts as WorkoutLog[]).map((w) => (
                <button
                  key={w.id}
                  onClick={() => setActiveWorkoutId(w.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                    activeWorkout?.id === w.id ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {w.name}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner size={36} /></div>
          ) : workoutsError ? (
            <div className="glass border border-red-500/20 rounded-2xl">
              <QueryError
                message={t('workout.errLoadDay')}
                onRetry={() => void refetchWorkouts()}
              />
            </div>
          ) : !activeWorkout ? (
            <WorkoutHub
              date={selectedDate}
              onEmpty={() => createWorkoutMutation.mutate(freeWorkoutName)}
              onCreateRoutine={() => { setMainTab('routines'); setRoutinesSubView('create'); }}
              onExplore={() => { setMainTab('routines'); setRoutinesSubView('explore'); }}
              onUseSaved={() => { setMainTab('routines'); setRoutinesSubView('list'); }}
              hasSavedRoutines={(savedRoutines as Routine[]).length > 0}
              isCreating={createWorkoutMutation.isPending}
            />
          ) : (

            <div className="space-y-4">
              <div className="glass border border-indigo-500/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{activeWorkout.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {t('workout.stats', {
                      exercises: activeWorkout.exerciseLogs?.length || 0,
                      sets: activeWorkout.exerciseLogs?.reduce((s, e) => s + (e.sets?.length || 0), 0) || 0,
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowExerciseSearch(true)}
                    className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 px-3 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    <Plus size={14} /> {t('workout.addExerciseShort')}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteWorkoutMutation.mutate(activeWorkout.id)}
                    aria-label={t('workout.deleteWorkoutAria')}
                    className="p-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {(!activeWorkout.exerciseLogs || activeWorkout.exerciseLogs.length === 0) ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm">{t('workout.noExercises')}</p>
                  <button
                    onClick={() => setShowExerciseSearch(true)}
                    className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm transition-colors"
                  >
                    {t('workout.addExerciseCta')}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeWorkout.exerciseLogs.map((ex: ExerciseLog, idx: number) => {
                    const logs = activeWorkout.exerciseLogs;
                    const move = (dir: -1 | 1) => {
                      const next = idx + dir;
                      if (next < 0 || next >= logs.length) return;
                      const orderedIds = logs.map((e) => e.id);
                      const tmp = orderedIds[idx];
                      orderedIds[idx] = orderedIds[next];
                      orderedIds[next] = tmp;
                      reorderExercisesMutation.mutate({ workoutId: activeWorkout.id, orderedIds });
                    };
                    return (
                      <ExerciseCard
                        key={ex.id}
                        exercise={ex}
                        canMoveUp={idx > 0}
                        canMoveDown={idx < logs.length - 1}
                        onMoveUp={() => move(-1)}
                        onMoveDown={() => move(1)}
                        openSetTypeId={openSetTypeId}
                        onOpenSetTypeId={setOpenSetTypeId}
                        onAddSet={(data) => addSetMutation.mutate({ exerciseId: ex.id, data })}
                        onUpdateSet={(id, data) => updateSetMutation.mutate({ id, data })}
                        onDeleteSet={(id) => deleteSetMutation.mutate(id)}
                        onUpdateExercise={(data) => updateExerciseMutation.mutate({ id: ex.id, data })}
                        onDelete={() => deleteExerciseMutation.mutate(ex.id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {mainTab === 'routines' && (
        <div className="space-y-4">
          {routinesSubView === 'create' ? (
            <RoutineBuilder
              onSaved={() => setRoutinesSubView('list')}
              onCancel={() => setRoutinesSubView('list')}
            />
          ) : routinesSubView === 'explore' ? (
            <ExploreRoutines
              onWorkoutStarted={handleWorkoutStarted}
              onClose={() => setRoutinesSubView('list')}
            />
          ) : routinesLoading ? (
            <div className="flex justify-center py-12"><Spinner size={36} /></div>
          ) : routinesError ? (
            <div className="glass border border-red-500/20 rounded-2xl">
              <QueryError
                message={t('workout.errLoadRoutines')}
                onRetry={() => void refetchRoutines()}
              />
            </div>
          ) : (
            <SavedRoutinesList
              routines={savedRoutines as Routine[]}
              onCreate={() => setRoutinesSubView('create')}
              onExplore={() => setRoutinesSubView('explore')}
              onDelete={(id) => deleteRoutineMutation.mutate(id as number)}
              onStart={(routine) =>
                routine.days.length > 1
                  ? setStartingRoutine(routine)
                  : startFromSavedMutation.mutate({ id: routine.id as number, dayIndex: 0 })
              }
              isDeleting={deleteRoutineMutation.isPending}
            />
          )}
        </div>
      )}

      <AnimatePresence>
        {showExerciseSearch && (
          <Modal title={t('workout.addExerciseModal')} onClose={() => setShowExerciseSearch(false)}>
            <ExerciseSearch
              onSelect={(exercise) => {
                if (activeWorkout) addExerciseMutation.mutate({ workoutId: activeWorkout.id, exercise });
              }}
            />
          </Modal>
        )}
      </AnimatePresence>

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
                <h3 className="text-white font-semibold">{t('workout.pickDayTitle')}</h3>
                <p className="text-slate-400 text-xs mt-1">{startingRoutine.name}</p>
              </div>
              <div className="space-y-2">
                {startingRoutine.days.map((day, idx) => (
                  <button
                    key={idx}
                    onClick={() => startFromSavedMutation.mutate({ id: startingRoutine.id as number, dayIndex: idx })}
                    disabled={startFromSavedMutation.isPending}
                    className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/30 rounded-xl text-left transition-colors"
                  >
                    <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-400 text-xs font-bold">{day.day}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{day.dayName}</p>
                      <p className="text-slate-500 text-xs">{t('workout.exercisesCount', { count: day.exercises.length })}</p>
                    </div>
                    <Play size={14} className="text-indigo-400" />
                  </button>
                ))}
              </div>
              <button onClick={() => setStartingRoutine(null)} className="w-full py-2 text-slate-400 text-sm hover:text-white transition-colors">
                {t('common.cancel')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function WorkoutHub({
  date, onEmpty, onCreateRoutine, onExplore, onUseSaved, hasSavedRoutines, isCreating,
}: {
  date: string;
  onEmpty: () => void;
  onCreateRoutine: () => void;
  onExplore: () => void;
  onUseSaved: () => void;
  hasSavedRoutines: boolean;
  isCreating: boolean;
}) {
  const { t } = useTranslation();
  const isToday = date === todayString();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {!isToday && (
        <EmptyState icon="📅" title={t('workout.emptyPastTitle')} description={t('workout.emptyPastDesc')} />
      )}
      {isToday && (
        <>
          <p className="text-slate-400 text-sm text-center">{t('workout.hubPrompt')}</p>
          <div className="grid gap-3">

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onEmpty}
              disabled={isCreating}
              className="group w-full glass border border-white/5 hover:border-indigo-500/30 rounded-2xl p-5 text-left transition-all hover:bg-indigo-600/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600/20 group-hover:bg-indigo-600/30 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                  <Zap size={22} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">{t('workout.freeTitle')}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{t('workout.freeDesc')}</p>
                </div>
              </div>
            </motion.button>

            {hasSavedRoutines && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onUseSaved}
                className="group w-full glass border border-white/5 hover:border-purple-500/30 rounded-2xl p-5 text-left transition-all hover:bg-purple-600/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-600/20 group-hover:bg-purple-600/30 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                    <BookOpen size={22} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{t('workout.useSavedTitle')}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{t('workout.useSavedDesc')}</p>
                  </div>
                </div>
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onCreateRoutine}
              className="group w-full glass border border-white/5 hover:border-green-500/30 rounded-2xl p-5 text-left transition-all hover:bg-green-600/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600/20 group-hover:bg-green-600/30 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                  <Pencil size={22} className="text-green-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">{t('workout.createRoutineTitle')}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{t('workout.createRoutineDesc')}</p>
                </div>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onExplore}
              className="group w-full glass border border-white/5 hover:border-cyan-500/30 rounded-2xl p-5 text-left transition-all hover:bg-cyan-600/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-600/20 group-hover:bg-cyan-600/30 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                  <Compass size={22} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">{t('workout.exploreTitle')}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{t('workout.exploreDesc')}</p>
                </div>
              </div>
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
}

function SavedRoutinesList({
  routines, onCreate, onExplore, onDelete, onStart, isDeleting,
}: {
  routines: Routine[];
  onCreate: () => void;
  onExplore: () => void;
  onDelete: (id: number | string) => void;
  onStart: (routine: Routine) => void;
  isDeleting: boolean;
}) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<number | string | null>(null);

  return (
    <div className="space-y-4">

      <div className="flex gap-2">
        <button
          onClick={onCreate}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors"
        >
          <Pencil size={15} /> {t('workout.createRoutine')}
        </button>
        <button
          onClick={onExplore}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors"
        >
          <Compass size={15} /> {t('workout.explore')}
        </button>
      </div>

      {routines.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 space-y-3">
          <p className="text-4xl">📋</p>
          <p className="text-white font-semibold">{t('workout.emptyRoutinesTitle')}</p>
          <p className="text-slate-400 text-sm">{t('workout.emptyRoutinesDesc')}</p>
          <div className="flex gap-2 justify-center pt-2">
            <button onClick={onCreate} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors">
              {t('workout.createRoutine')}
            </button>
            <button onClick={onExplore} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm rounded-xl transition-colors">
              {t('workout.explore')}
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => {
            const isExpanded = expandedId === routine.id;
            return (
              <motion.div
                key={routine.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass border border-white/5 rounded-2xl overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3 justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          routine.source === 'explore'
                            ? 'bg-cyan-900/40 text-cyan-400'
                            : 'bg-indigo-900/40 text-indigo-400'
                        }`}>
                          {routine.source === 'explore' ? t('workout.badgeCurated') : t('workout.badgeOwn')}
                        </span>
                        <span className="text-slate-500 text-[10px]">{t('workout.daysPerWeek', { days: routine.daysPerWeek })}</span>
                      </div>
                      <p className="text-white font-semibold text-sm">{routine.name}</p>
                      {routine.description && (
                        <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{routine.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : routine.id)}
                      className="p-1 text-slate-500 hover:text-white transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onStart(routine)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                    >
                      <Play size={13} /> {t('workout.startToday')}
                    </button>
                    <button
                      onClick={() => onDelete(routine.id)}
                      disabled={isDeleting}
                      className="py-2 px-3 rounded-xl bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs transition-colors"
                    >
                      <Trash2 size={13} />
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
                            <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">{day.dayName}</p>
                            <div className="space-y-1">
                              {day.exercises.map((ex, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
                                  <span className="flex-1 text-slate-300 text-xs">{ex.name}</span>
                                  <span className="text-slate-500 text-[10px]">{ex.sets}×{ex.reps}</span>
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
      )}
    </div>
  );
}
function buildRestOptions(restNoneLabel: string) {
  return [
    { value: 0, label: restNoneLabel },
    ...Array.from({ length: 20 }, (_, i) => {
      const value = (i + 1) * 15;
      const m = Math.floor(value / 60);
      const s = value % 60;
      return {
        value,
        label: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      };
    }),
  ];
}

function buildSetTypeOptions(t: (key: string) => string): { value: NonNullable<ExerciseSet['setType']>; label: string; badge: string }[] {
  return [
    { value: 'warmup', label: t('workout.setWarmup'), badge: 'W' },
    { value: 'normal', label: t('workout.setNormal'), badge: '1' },
    { value: 'failure', label: t('workout.setFailure'), badge: 'F' },
    { value: 'drop', label: t('workout.setDrop'), badge: 'D' },
  ];
}

function formatRest(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function setBadge(set: ExerciseSet, normalIndex: number) {
  const t = set.setType || 'normal';
  if (t === 'warmup') return 'W';
  if (t === 'failure') return 'F';
  if (t === 'drop') return 'D';
  return String(normalIndex);
}

function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const { t } = useTranslation();
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    setLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (left <= 0) {
      onDone();
      return;
    }
    const id = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left, onDone]);

  const pctLeft = seconds > 0 ? (left / seconds) * 100 : 0;

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-indigo-300">{t('workout.rest')}</p>
        <span className="font-mono text-lg font-bold tabular-nums text-white">{formatRest(left)}</span>
      </div>
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-indigo-500 transition-[width] duration-1000 linear" style={{ width: `${pctLeft}%` }} />
      </div>
      <button
        type="button"
        onClick={onDone}
        className="w-full rounded-lg bg-white/10 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/15"
      >
        {t('workout.restSkip')}
      </button>
    </div>
  );
}

function ExerciseCard({
  exercise,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  openSetTypeId,
  onOpenSetTypeId,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onUpdateExercise,
  onDelete,
}: {
  exercise: ExerciseLog;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  openSetTypeId: number | null;
  onOpenSetTypeId: (id: number | null) => void;
  onAddSet: (data: Record<string, unknown>) => void;
  onUpdateSet: (id: number, data: Record<string, unknown>) => void;
  onDeleteSet: (id: number) => void;
  onUpdateExercise: (data: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const restOptions = useMemo(() => buildRestOptions(t('workout.restNone')), [t]);
  const [collapsed, setCollapsed] = useState(false);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [weightWarning, setWeightWarning] = useState<string | null>(null);

  const { data: history = [] } = useQuery({
    queryKey: ['exercise-history', exercise.exerciseId],
    queryFn: () => workoutApi.exerciseHistory(exercise.exerciseId).then((r) => r.data as { weight: number }[]),
    staleTime: 60_000,
  });

  const nextSet = (exercise.sets?.length || 0) + 1;
  const last = exercise.sets?.[exercise.sets.length - 1];
  const defaultWeight = last?.weight || 0;
  const defaultReps = last?.reps || 10;
  const defaultRepsMin = last?.repsMin || 8;
  const defaultRepsMax = last?.repsMax || 10;
  const repMode = exercise.repMode || 'reps';
  const restSeconds = exercise.restSeconds ?? 120;

  const totalVolume = (exercise.sets || []).reduce((sum, s) => {
    const r = s.reps ?? (s.repsMin && s.repsMax ? (s.repsMin + s.repsMax) / 2 : 0);
    return sum + (s.weight || 0) * r;
  }, 0);

  let normalCounter = 0;
  const setsWithBadge = (exercise.sets || []).map((set) => {
    const isNormal = (set.setType || 'normal') === 'normal';
    if (isNormal) normalCounter += 1;
    return { set, badge: setBadge(set, normalCounter) };
  });

  const checkWeight = (w: number) => {
    const hist = history.map((h) => h.weight).filter((x) => x > 0);
    setWeightWarning(weightAnomalyWarning(w, hist));
  };

  const handleComplete = (setId: number, data: Record<string, unknown>, completing: boolean) => {
    onUpdateSet(setId, data);
    if (completing && restSeconds > 0) setRestTimer(restSeconds);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-white/5"
    >
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-purple-900/30 text-base">
          {exercise.imageUrl ? (
            <img
              src={exercise.imageUrl}
              alt=""
              className="h-full w-full object-contain bg-slate-900/40"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = 'block';
              }}
            />
          ) : null}
          <span style={{ display: exercise.imageUrl ? 'none' : 'block' }}>
            {exerciseCategoryIcon(exercise.category)}
          </span>
        </div>
        <button type="button" className="flex-1 text-left" onClick={() => setCollapsed(!collapsed)}>
          <p className="text-sm font-medium text-white">{exercise.exerciseName}</p>
          <p className="text-xs text-slate-500">
            {(exercise.category || exercise.muscleGroup) &&
              `${translateExerciseCategory(exercise.category || exercise.muscleGroup, t)} · `}
            {t('workout.setsCount', { count: exercise.sets?.length || 0 })}
            {totalVolume > 0 && t('workout.volumeSuffix', { volume: Math.round(totalVolume) })}
          </p>
        </button>
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label={t('workout.moveUp')}
            className="p-0.5 text-slate-500 transition-colors hover:text-white disabled:opacity-20 disabled:hover:text-slate-500"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label={t('workout.moveDown')}
            className="p-0.5 text-slate-500 transition-colors hover:text-white disabled:opacity-20 disabled:hover:text-slate-500"
          >
            <ChevronDown size={14} />
          </button>
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label={t('workout.deleteExerciseAria', { name: exercise.exerciseName })}
          className="p-1 text-slate-400 transition-colors hover:text-red-400"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-3 border-t border-white/5 px-4 pb-4 pt-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <span>{t('workout.rest')}</span>
              <select
                value={restSeconds}
                onChange={(e) => onUpdateExercise({ restSeconds: parseInt(e.target.value, 10) })}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                {restOptions.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#14171c]">
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {restTimer != null && (
            <RestTimer seconds={restTimer} onDone={() => setRestTimer(null)} />
          )}

          {weightWarning && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-xs text-amber-300">
              {weightWarning}
            </div>
          )}

          <div className="grid grid-cols-12 gap-2 px-1 text-[10px] uppercase tracking-wide text-slate-500">
            <span className="col-span-2">{t('workout.colSet')}</span>
            <span className="col-span-3">{t('workout.colKg')}</span>
            <button
              type="button"
              className="col-span-4 flex items-center gap-0.5 text-left hover:text-indigo-400"
              onClick={() => onUpdateExercise({ repMode: repMode === 'reps' ? 'range' : 'reps' })}
            >
              {repMode === 'range' ? t('workout.colRange') : t('workout.colReps')}
              <ChevronDown size={10} />
            </button>
            <span className="col-span-2">✓</span>
            <span className="col-span-1" />
          </div>

          {setsWithBadge.map(({ set, badge }) => (
            <SetRow
              key={set.id}
              set={set}
              badge={badge}
              repMode={repMode}
              typeOpen={openSetTypeId === set.id}
              onToggleType={() =>
                onOpenSetTypeId(openSetTypeId === set.id ? null : set.id)
              }
              onCloseType={() => onOpenSetTypeId(null)}
              onUpdate={(data) => onUpdateSet(set.id, data)}
              onComplete={(data, completing) => handleComplete(set.id, data, completing)}
              onDelete={() => onDeleteSet(set.id)}
              onWeightCheck={checkWeight}
            />
          ))}

          <button
            type="button"
            onClick={() =>
              onAddSet({
                setNumber: nextSet,
                setType: 'normal',
                weight: defaultWeight,
                ...(repMode === 'range'
                  ? { repsMin: defaultRepsMin, repsMax: defaultRepsMax }
                  : { reps: defaultReps }),
              })
            }
            className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-white/10 py-2 text-xs text-slate-500 transition-colors hover:border-indigo-500/30 hover:text-indigo-400"
          >
            <Plus size={12} /> {t('workout.addSet')}
          </button>
        </div>
      )}
    </motion.div>
  );
}

function SetRow({
  set,
  badge,
  repMode,
  typeOpen,
  onToggleType,
  onCloseType,
  onUpdate,
  onComplete,
  onDelete,
  onWeightCheck,
}: {
  set: ExerciseSet;
  badge: string;
  repMode: 'reps' | 'range';
  typeOpen: boolean;
  onToggleType: () => void;
  onCloseType: () => void;
  onUpdate: (d: Record<string, unknown>) => void;
  onComplete: (d: Record<string, unknown>, completing: boolean) => void;
  onDelete: () => void;
  onWeightCheck: (w: number) => void;
}) {
  const { t } = useTranslation();
  const setTypeOptions = useMemo(() => buildSetTypeOptions(t), [t]);
  const [weight, setWeight] = useState(String(set.weight ?? ''));
  const [reps, setReps] = useState(String(set.reps ?? ''));
  const [repsMin, setRepsMin] = useState(String(set.repsMin ?? ''));
  const [repsMax, setRepsMax] = useState(String(set.repsMax ?? ''));
  const [completed, setCompleted] = useState(set.completed);

  useEffect(() => {
    setWeight(String(set.weight ?? ''));
    setReps(String(set.reps ?? ''));
    setRepsMin(String(set.repsMin ?? ''));
    setRepsMax(String(set.repsMax ?? ''));
    setCompleted(set.completed);
  }, [set.weight, set.reps, set.repsMin, set.repsMax, set.completed]);

  const payload = () => {
    const w = parseFloat(weight) || 0;
    return {
      weight: w,
      completed,
      setType: set.setType || 'normal',
      ...(repMode === 'range'
        ? {
            repsMin: parseInt(repsMin, 10) || 0,
            repsMax: parseInt(repsMax, 10) || 0,
            reps: null,
          }
        : {
            reps: parseInt(reps, 10) || 0,
          }),
    };
  };

  const handleBlur = () => {
    const w = parseFloat(weight) || 0;
    onWeightCheck(w);
    onUpdate(payload());
  };

  const toggleCompleted = () => {
    const nc = !completed;
    setCompleted(nc);
    const data = { ...payload(), completed: nc };
    onComplete(data, nc);
  };

  const currentType = set.setType || 'normal';
  const typeColor =
    currentType === 'warmup'
      ? 'text-cyan-400'
      : currentType === 'failure'
        ? 'text-red-400'
        : currentType === 'drop'
          ? 'text-amber-400'
          : 'text-slate-300';

  return (
    <div className={`relative grid grid-cols-12 items-center gap-2 rounded-lg px-1 py-1 transition-colors ${completed ? 'bg-green-900/10' : ''}`}>
      <div className="col-span-2">
        <button
          type="button"
          data-set-type-trigger
          onClick={onToggleType}
          aria-label={t('workout.setTypeAria', {
            type: setTypeOptions.find((o) => o.value === currentType)?.label || t('workout.setNormal'),
          })}
          aria-haspopup="menu"
          aria-expanded={typeOpen}
          className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-xs font-bold ${typeColor}`}
        >
          {badge}
        </button>
        {typeOpen && (
          <div
            data-set-type-menu
            className="absolute left-0 bottom-full z-50 mb-1 w-44 rounded-xl border border-white/10 bg-[#1b1f27] py-1 shadow-xl"
          >
            {setTypeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-white/5"
                onClick={() => {
                  onCloseType();
                  onUpdate({ ...payload(), setType: opt.value });
                }}
              >
                <span className="w-4 font-bold text-indigo-400">{opt.badge}</span>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="col-span-3">
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={handleBlur}
          placeholder="0"
          step="0.5"
          aria-label={t('workout.weightAria')}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center text-xs text-white focus:border-indigo-500 focus:outline-none"
        />
      </div>
      {repMode === 'range' ? (
        <div className="col-span-4 flex items-center gap-1">
          <input
            type="number"
            value={repsMin}
            onChange={(e) => setRepsMin(e.target.value)}
            onBlur={handleBlur}
            placeholder="8"
            aria-label={t('workout.repsMinAria')}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-1 py-1.5 text-center text-xs text-white focus:border-indigo-500 focus:outline-none"
          />
          <span className="text-slate-400" aria-hidden>-</span>
          <input
            type="number"
            value={repsMax}
            onChange={(e) => setRepsMax(e.target.value)}
            onBlur={handleBlur}
            placeholder="10"
            aria-label={t('workout.repsMaxAria')}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-1 py-1.5 text-center text-xs text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
      ) : (
        <div className="col-span-4">
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onBlur={handleBlur}
            placeholder="0"
            aria-label={t('workout.repsAria')}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center text-xs text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
      )}
      <button
        type="button"
        onClick={toggleCompleted}
        aria-label={completed ? t('workout.markIncomplete') : t('workout.markComplete')}
        aria-pressed={completed}
        className={`col-span-2 flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
          completed ? 'bg-green-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-green-900/30 hover:text-green-400'
        }`}
      >
        <Check size={13} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={t('workout.deleteSetAria')}
        className="col-span-1 flex items-center justify-center text-slate-400 transition-colors hover:text-red-400"
      >
        <X size={12} />
      </button>
    </div>
  );
}
