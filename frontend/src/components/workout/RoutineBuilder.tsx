import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, Save } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { routineApi } from '../../lib/api';
import type { RoutineDay, RoutineExercise } from '../../lib/utils';
import { ExerciseSearch } from './ExerciseSearch';
import { Modal, MutationError } from '../common/UI';
import type { Exercise } from '../../lib/utils';

interface RoutineBuilderProps {
  onSaved: () => void;
  onCancel: () => void;
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export function RoutineBuilder({ onSaved, onCancel }: RoutineBuilderProps) {
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [days, setDays] = useState<RoutineDay[]>([
    { day: 1, dayName: 'Día 1', exercises: [] },
  ]);
  const [expandedDay, setExpandedDay] = useState(0);
  const [showExerciseSearch, setShowExerciseSearch] = useState<number | null>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      routineApi.save({
        name,
        description,
        level,
        daysPerWeek: days.length,
        days,
        source: 'user',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routines'] });
      onSaved();
    },
  });

  const addDay = () => {
    setDays((prev) => [
      ...prev,
      { day: prev.length + 1, dayName: `Día ${prev.length + 1}`, exercises: [] },
    ]);
    setExpandedDay(days.length);
  };

  const removeDay = (idx: number) => {
    setDays((prev) => prev.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 })));
    if (expandedDay >= idx) setExpandedDay(Math.max(0, expandedDay - 1));
  };

  const updateDayName = (idx: number, name: string) => {
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, dayName: name } : d)));
  };

  const addExercise = (dayIdx: number, exercise: Exercise) => {
    const newEx: RoutineExercise = {
      exerciseId: String(exercise.id),
      name: exercise.name,
      category: exercise.category,
      muscleGroup: exercise.muscles[0]?.name || exercise.category,
      sets: 3,
      reps: 10,
      imageUrl: exercise.images?.[0] || undefined,
    };
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx ? { ...d, exercises: [...d.exercises, newEx] } : d
      )
    );
    setShowExerciseSearch(null);
  };

  const removeExercise = (dayIdx: number, exIdx: number) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) } : d
      )
    );
  };

  const updateExercise = (dayIdx: number, exIdx: number, field: 'sets' | 'reps', value: number) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              exercises: d.exercises.map((ex, j) =>
                j === exIdx ? { ...ex, [field]: value } : ex
              ),
            }
          : d
      )
    );
  };

  const totalExercises = days.reduce((s, d) => s + d.exercises.length, 0);
  const canSave = name.trim() && days.length > 0 && totalExercises > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Nueva rutina</h2>
          <p className="text-slate-400 text-xs mt-0.5">{days.length} día{days.length !== 1 ? 's' : ''} · {totalExercises} ejercicios</p>
        </div>
        <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors text-sm">
          Cancelar
        </button>
      </div>

      <div className="glass border border-white/5 rounded-2xl p-4 space-y-3">
        <input
          type="text"
          placeholder="Nombre de la rutina *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <textarea
          placeholder="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
        />
        <div className="flex gap-2">
          {Object.entries(LEVEL_LABELS).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setLevel(val)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                level === val
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {days.map((day, dayIdx) => (
          <div key={dayIdx} className="glass border border-white/5 rounded-2xl overflow-hidden">

            <div className="flex items-center gap-3 p-4">
              <GripVertical size={14} className="text-slate-600 flex-shrink-0" />
              <input
                type="text"
                value={day.dayName}
                onChange={(e) => updateDayName(dayIdx, e.target.value)}
                className="flex-1 bg-transparent text-white text-sm font-medium focus:outline-none placeholder:text-slate-500"
              />
              <span className="text-slate-500 text-xs flex-shrink-0">{day.exercises.length} ejerc.</span>
              <button
                onClick={() => removeDay(dayIdx)}
                disabled={days.length === 1}
                className="p-1 text-slate-600 hover:text-red-400 transition-colors disabled:opacity-20"
              >
                <Trash2 size={13} />
              </button>
              <button
                onClick={() => setExpandedDay(expandedDay === dayIdx ? -1 : dayIdx)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                {expandedDay === dayIdx ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>

            <AnimatePresence>
              {expandedDay === dayIdx && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-t border-white/5"
                >
                  <div className="p-4 pt-3 space-y-2">
                    {day.exercises.length === 0 && (
                      <p className="text-slate-500 text-xs text-center py-2">Sin ejercicios todavía</p>
                    )}
                    {day.exercises.map((ex, exIdx) => (
                      <div key={exIdx} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{ex.name}</p>
                          <p className="text-slate-500 text-[10px]">{ex.muscleGroup}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
                            <input
                              type="number"
                              value={ex.sets}
                              onChange={(e) => updateExercise(dayIdx, exIdx, 'sets', parseInt(e.target.value) || 1)}
                              className="w-6 bg-transparent text-white text-xs text-center focus:outline-none"
                              min={1}
                            />
                            <span className="text-slate-500 text-[10px]">ser</span>
                          </div>
                          <span className="text-slate-600 text-xs">×</span>
                          <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
                            <input
                              type="number"
                              value={ex.reps}
                              onChange={(e) => updateExercise(dayIdx, exIdx, 'reps', parseInt(e.target.value) || 1)}
                              className="w-6 bg-transparent text-white text-xs text-center focus:outline-none"
                              min={1}
                            />
                            <span className="text-slate-500 text-[10px]">rep</span>
                          </div>
                          <button
                            onClick={() => removeExercise(dayIdx, exIdx)}
                            className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => setShowExerciseSearch(dayIdx)}
                      className="w-full py-2 rounded-xl border border-dashed border-white/10 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 text-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus size={12} /> Añadir ejercicio
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        <button
          onClick={addDay}
          className="w-full py-3 rounded-2xl border border-dashed border-white/10 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Añadir día
        </button>
      </div>

      <button
        onClick={() => saveMutation.mutate()}
        disabled={!canSave || saveMutation.isPending}
        className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
      >
        <Save size={16} />
        {saveMutation.isPending ? 'Guardando...' : 'Guardar rutina'}
      </button>

      {saveMutation.isError && (
        <MutationError message="No se pudo guardar la rutina. Reintenta." />
      )}

      {!canSave && name && (
        <p className="text-slate-500 text-xs text-center">
          {totalExercises === 0 ? 'Añade al menos un ejercicio para guardar' : ''}
        </p>
      )}

      <AnimatePresence>
        {showExerciseSearch !== null && (
          <Modal title={`Añadir ejercicio — ${days[showExerciseSearch]?.dayName}`} onClose={() => setShowExerciseSearch(null)}>
            <ExerciseSearch
              onSelect={(exercise) => addExercise(showExerciseSearch, exercise)}
            />
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
