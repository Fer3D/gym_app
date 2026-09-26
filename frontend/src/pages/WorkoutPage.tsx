import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Check, X,
  Dumbbell as DumbbellIcon, Zap, BookOpen, Compass, Play,
  ChevronDown, ChevronUp, Pencil,
} from 'lucide-react';
import { workoutApi, routineApi } from '../lib/api';
import type { Exercise, WorkoutLog, ExerciseLog, Routine } from '../lib/utils';
import { todayString, dateToString, formatDateLabel } from '../lib/utils';
import { ExerciseSearch } from '../components/workout/ExerciseSearch';
import { RoutineBuilder } from '../components/workout/RoutineBuilder';
import { ExploreRoutines } from '../components/workout/ExploreRoutines';
import { Modal, Spinner, EmptyState, QueryError, MutationError } from '../components/common/UI';
import { format, addDays, parseISO } from 'date-fns';

type MainTab = 'today' | 'routines';
type RoutinesSubView = 'list' | 'create' | 'explore';

export function WorkoutPage() {
  const qc = useQueryClient();
  const [mainTab, setMainTab] = useState<MainTab>('today');
  const [routinesSubView, setRoutinesSubView] = useState<RoutinesSubView>('list');
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [activeWorkoutId, setActiveWorkoutId] = useState<number | null>(null);

  const [startingRoutine, setStartingRoutine] = useState<Routine | null>(null);

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
        order: 0,
      }),
    onSuccess: () => {
      invalidateWorkoutDay();
      setShowExerciseSearch(false);
    },
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: (id: number) => workoutApi.deleteExercise(id),
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
    (createWorkoutMutation.isError && 'No se pudo crear el entrenamiento.') ||
    (deleteWorkoutMutation.isError && 'No se pudo eliminar el entrenamiento.') ||
    (addExerciseMutation.isError && 'No se pudo añadir el ejercicio.') ||
    (deleteExerciseMutation.isError && 'No se pudo eliminar el ejercicio.') ||
    (addSetMutation.isError && 'No se pudo añadir la serie.') ||
    (updateSetMutation.isError && 'No se pudo actualizar la serie.') ||
    (deleteSetMutation.isError && 'No se pudo eliminar la serie.') ||
    (deleteRoutineMutation.isError && 'No se pudo eliminar la rutina.') ||
    (startFromSavedMutation.isError && 'No se pudo iniciar la rutina.') ||
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
        <h1 className="text-2xl font-bold text-white">Entrenamiento</h1>
        {mainTab === 'today' && (workouts as WorkoutLog[]).length === 0 && !isLoading && selectedDate === todayString() && (
          <button
            onClick={() => createWorkoutMutation.mutate('Entrenamiento libre')}
            disabled={createWorkoutMutation.isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Zap size={15} /> Iniciar
          </button>
        )}
      </div>

      <div className="flex gap-1 p-1 glass border border-white/5 rounded-2xl">
        {([['today', '🏋️ Hoy'], ['routines', '📋 Rutinas']] as [MainTab, string][]).map(([tab, label]) => (
          <button
            key={tab}
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
            <button onClick={() => goToDay(-1)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
              <ChevronLeft size={18} />
            </button>
            <div className="flex-1 text-center">
              <p className="text-white font-semibold text-sm capitalize">{formatDateLabel(selectedDate)}</p>
              <p className="text-slate-500 text-xs">{format(parseISO(selectedDate), 'dd/MM/yyyy')}</p>
            </div>
            <button
              onClick={() => goToDay(1)}
              disabled={selectedDate >= todayString()}
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
                message="No se pudo cargar los entrenamientos de este día."
                onRetry={() => void refetchWorkouts()}
              />
            </div>
          ) : !activeWorkout ? (
            <WorkoutHub
              date={selectedDate}
              onEmpty={() => createWorkoutMutation.mutate('Entrenamiento libre')}
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
                    {activeWorkout.exerciseLogs?.length || 0} ejercicios ·{' '}
                    {activeWorkout.exerciseLogs?.reduce((s, e) => s + (e.sets?.length || 0), 0) || 0} series
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowExerciseSearch(true)}
                    className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 px-3 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    <Plus size={14} /> Ejercicio
                  </button>
                  <button
                    onClick={() => deleteWorkoutMutation.mutate(activeWorkout.id)}
                    className="p-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {(!activeWorkout.exerciseLogs || activeWorkout.exerciseLogs.length === 0) ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm">Sin ejercicios. Añade el primero.</p>
                  <button
                    onClick={() => setShowExerciseSearch(true)}
                    className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm transition-colors"
                  >
                    + Añadir ejercicio
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeWorkout.exerciseLogs.map((ex: ExerciseLog) => (
                    <ExerciseCard
                      key={ex.id}
                      exercise={ex}
                      onAddSet={(data) => addSetMutation.mutate({ exerciseId: ex.id, data })}
                      onUpdateSet={(id, data) => updateSetMutation.mutate({ id, data })}
                      onDeleteSet={(id) => deleteSetMutation.mutate(id)}
                      onDelete={() => deleteExerciseMutation.mutate(ex.id)}
                    />
                  ))}
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
                message="No se pudo cargar tus rutinas."
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
          <Modal title="Añadir ejercicio" onClose={() => setShowExerciseSearch(false)}>
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
                <h3 className="text-white font-semibold">¿Qué día entrenas hoy?</h3>
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
                      <p className="text-slate-500 text-xs">{day.exercises.length} ejercicios</p>
                    </div>
                    <Play size={14} className="text-indigo-400" />
                  </button>
                ))}
              </div>
              <button onClick={() => setStartingRoutine(null)} className="w-full py-2 text-slate-400 text-sm hover:text-white transition-colors">
                Cancelar
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
  const isToday = date === todayString();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {!isToday && (
        <EmptyState icon="📅" title="Sin entrenamientos" description={`No hay entrenamientos registrados para este día`} />
      )}
      {isToday && (
        <>
          <p className="text-slate-400 text-sm text-center">¿Cómo quieres entrenar hoy?</p>
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
                  <p className="text-white font-semibold">Entrenamiento libre</p>
                  <p className="text-slate-400 text-xs mt-0.5">Improvisado, sin plantilla. Añade ejercicios sobre la marcha.</p>
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
                    <p className="text-white font-semibold">Usar rutina guardada</p>
                    <p className="text-slate-400 text-xs mt-0.5">Inicia un entrenamiento desde una de tus rutinas.</p>
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
                  <p className="text-white font-semibold">Crear nueva rutina</p>
                  <p className="text-slate-400 text-xs mt-0.5">Diseña tu propio programa personalizado y guárdalo.</p>
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
                  <p className="text-white font-semibold">Explorar rutinas</p>
                  <p className="text-slate-400 text-xs mt-0.5">PPL, Full Body, Upper/Lower y más programas curados.</p>
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
  const [expandedId, setExpandedId] = useState<number | string | null>(null);

  return (
    <div className="space-y-4">

      <div className="flex gap-2">
        <button
          onClick={onCreate}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors"
        >
          <Pencil size={15} /> Crear rutina
        </button>
        <button
          onClick={onExplore}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors"
        >
          <Compass size={15} /> Explorar
        </button>
      </div>

      {routines.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 space-y-3">
          <p className="text-4xl">📋</p>
          <p className="text-white font-semibold">Sin rutinas guardadas</p>
          <p className="text-slate-400 text-sm">Crea tu primera rutina o explora programas populares</p>
          <div className="flex gap-2 justify-center pt-2">
            <button onClick={onCreate} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors">
              Crear rutina
            </button>
            <button onClick={onExplore} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm rounded-xl transition-colors">
              Explorar
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
                          {routine.source === 'explore' ? '✦ Curada' : '✎ Propia'}
                        </span>
                        <span className="text-slate-500 text-[10px]">{routine.daysPerWeek} días/sem</span>
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
                      <Play size={13} /> Empezar hoy
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

function ExerciseCard({ exercise, onAddSet, onUpdateSet, onDeleteSet, onDelete }: {
  exercise: ExerciseLog;
  onAddSet: (data: any) => void;
  onUpdateSet: (id: number, data: any) => void;
  onDeleteSet: (id: number) => void;
  onDelete: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const nextSet = (exercise.sets?.length || 0) + 1;

  const defaultWeight = exercise.sets && exercise.sets.length > 0
    ? exercise.sets[exercise.sets.length - 1].weight || 0 : 0;
  const defaultReps = exercise.sets && exercise.sets.length > 0
    ? exercise.sets[exercise.sets.length - 1].reps || 10 : 10;

  const totalVolume = (exercise.sets || []).reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass border border-white/5 rounded-2xl overflow-hidden"
    >

      <div className="flex items-center gap-3 p-4">
        <div className="w-9 h-9 bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
          <DumbbellIcon size={18} className="text-purple-400" />
        </div>
        <button className="flex-1 text-left" onClick={() => setCollapsed(!collapsed)}>
          <p className="text-white font-medium text-sm">{exercise.exerciseName}</p>
          <p className="text-slate-500 text-xs">
            {exercise.muscleGroup && `${exercise.muscleGroup} · `}
            {exercise.sets?.length || 0} series{totalVolume > 0 && ` · ${Math.round(totalVolume)}kg vol.`}
          </p>
        </button>
        <button onClick={onDelete} className="text-slate-600 hover:text-red-400 transition-colors p-1">
          <Trash2 size={14} />
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">

          <div className="grid grid-cols-12 gap-2 text-[10px] text-slate-500 px-1 uppercase tracking-wide">
            <span className="col-span-1">#</span>
            <span className="col-span-4">Peso (kg)</span>
            <span className="col-span-4">Reps</span>
            <span className="col-span-2">✓</span>
            <span className="col-span-1"></span>
          </div>

          {(exercise.sets || []).map((set) => (
            <SetRow
              key={set.id}
              set={set}
              onUpdate={(data) => onUpdateSet(set.id, data)}
              onDelete={() => onDeleteSet(set.id)}
            />
          ))}

          <button
            onClick={() => onAddSet({ setNumber: nextSet, reps: defaultReps, weight: defaultWeight })}
            className="w-full py-2 rounded-xl border border-dashed border-white/10 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 text-xs transition-colors flex items-center justify-center gap-1"
          >
            <Plus size={12} /> Añadir serie {nextSet}
          </button>
        </div>
      )}
    </motion.div>
  );
}

function SetRow({ set, onUpdate, onDelete }: { set: any; onUpdate: (d: any) => void; onDelete: () => void }) {
  const [weight, setWeight] = useState(set.weight ?? '');
  const [reps, setReps] = useState(set.reps ?? '');
  const [completed, setCompleted] = useState(set.completed);

  const handleBlur = () => {
    onUpdate({ weight: parseFloat(weight as string) || 0, reps: parseInt(reps as string) || 0, completed });
  };

  const toggleCompleted = () => {
    const nc = !completed;
    setCompleted(nc);
    onUpdate({ weight: parseFloat(weight as string) || 0, reps: parseInt(reps as string) || 0, completed: nc });
  };

  return (
    <div className={`grid grid-cols-12 gap-2 items-center rounded-lg px-1 py-1 transition-colors ${completed ? 'bg-green-900/10' : ''}`}>
      <span className="col-span-1 text-slate-500 text-xs font-mono">{set.setNumber}</span>
      <div className="col-span-4">
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={handleBlur}
          placeholder="0"
          step="0.5"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs text-center focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div className="col-span-4">
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onBlur={handleBlur}
          placeholder="0"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs text-center focus:outline-none focus:border-indigo-500"
        />
      </div>
      <button
        onClick={toggleCompleted}
        className={`col-span-2 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
          completed ? 'bg-green-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-green-900/30 hover:text-green-400'
        }`}
      >
        <Check size={13} />
      </button>
      <button onClick={onDelete} className="col-span-1 text-slate-600 hover:text-red-400 transition-colors flex items-center justify-center">
        <X size={12} />
      </button>
    </div>
  );
}
