import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { calendarApi } from '../lib/api';
import { dateToString, formatDateLabel } from '../lib/utils';
import { Flame, Dumbbell, Scale } from 'lucide-react';
import { Spinner } from '../components/common/UI';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;

  const { data: summary, isLoading } = useQuery({
    queryKey: ['calendar-summary', year, month],
    queryFn: () => calendarApi.summary(year, month).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const selectedStr = dateToString(selectedDate);
  const dayData = summary?.days?.[selectedStr];
  const calorieGoal = summary?.calorieGoal || 2000;

  const getTileContent = ({ date }: { date: Date }) => {
    const str = dateToString(date);
    const d = summary?.days?.[str];
    if (!d) return null;

    const hasNutrition = !!d.nutrition;
    const hasWorkout = d.workouts && d.workouts.length > 0;

    return (
      <div className="flex justify-center gap-0.5 mt-0.5">
        {hasNutrition && (
          <span className={`w-1.5 h-1.5 rounded-full ${d.nutrition.goalMet ? 'bg-green-500' : 'bg-indigo-500'}`} />
        )}
        {hasWorkout && (
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
        )}
      </div>
    );
  };

  const getTileClassName = ({ date }: { date: Date }) => {
    const str = dateToString(date);
    const d = summary?.days?.[str];
    if (!d) return '';
    return '';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Calendario</h1>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Obj. nutricional cumplido</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Nutrición registrada</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Entrenamiento</span>
      </div>

      {/* Calendar */}
      <div className="glass border border-indigo-500/10 rounded-2xl p-4 md:p-6">
        {isLoading && (
          <div className="flex justify-center pb-4"><Spinner /></div>
        )}
        <Calendar
          value={selectedDate}
          onChange={(v: Value) => {
            if (v instanceof Date) setSelectedDate(v);
          }}
          onActiveStartDateChange={({ activeStartDate }) => {
            if (activeStartDate) setViewDate(activeStartDate);
          }}
          tileContent={getTileContent}
          tileClassName={getTileClassName}
          locale="es-ES"
          maxDate={new Date()}
        />
      </div>

      {/* Selected day detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedStr}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="space-y-3"
        >
          <h2 className="text-white font-semibold capitalize">{formatDateLabel(selectedStr)}</h2>

          {!dayData ? (
            <div className="glass border border-white/5 rounded-2xl p-6 text-center">
              <p className="text-slate-400 text-sm">Sin registros para este día</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Nutrition summary */}
              {dayData.nutrition && (
                <div className="glass border border-indigo-500/10 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                      <Flame size={16} className="text-indigo-400" />
                    </div>
                    <p className="text-white font-medium text-sm">Nutrición</p>
                    {dayData.nutrition.goalMet && (
                      <span className="ml-auto text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">✓ Obj. cumplido</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/3 rounded-xl p-3 text-center">
                      <p className="text-white font-bold text-lg">{dayData.nutrition.calories}</p>
                      <p className="text-slate-500 text-[10px]">kcal</p>
                    </div>
                    <div className="bg-white/3 rounded-xl p-3 text-center">
                      <p className="text-indigo-400 font-bold text-lg">{Math.round(dayData.nutrition.proteins || 0)}g</p>
                      <p className="text-slate-500 text-[10px]">proteínas</p>
                    </div>
                    <div className="bg-white/3 rounded-xl p-3 text-center">
                      <p className="text-slate-300 font-bold text-lg">{dayData.nutrition.meals}</p>
                      <p className="text-slate-500 text-[10px]">comidas</p>
                    </div>
                  </div>
                  {/* Calorie bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Progreso calórico</span>
                      <span>{dayData.nutrition.calories} / {calorieGoal} kcal</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${dayData.nutrition.goalMet ? 'bg-green-500' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.min(100, (dayData.nutrition.calories / calorieGoal) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Weight */}
              {dayData.nutrition?.weight && (
                <div className="glass border border-cyan-500/10 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                    <Scale size={16} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Peso registrado</p>
                    <p className="text-white font-bold text-lg">{dayData.nutrition.weight} kg</p>
                  </div>
                </div>
              )}

              {/* Workouts */}
              {dayData.workouts && dayData.workouts.length > 0 && (
                <div className="glass border border-purple-500/10 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                      <Dumbbell size={16} className="text-purple-400" />
                    </div>
                    <p className="text-white font-medium text-sm">Entrenamientos ({dayData.workouts.length})</p>
                  </div>
                  {dayData.workouts.map((w: any) => (
                    <div key={w.id} className="flex items-center gap-3 py-2 border-t border-white/5">
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{w.name}</p>
                        <p className="text-slate-500 text-xs">{w.exercises} ejercicios · {w.totalSets} series</p>
                      </div>
                      {w.totalVolume > 0 && (
                        <div className="text-right">
                          <p className="text-purple-400 text-sm font-bold">{Math.round(w.totalVolume)}kg</p>
                          <p className="text-slate-500 text-[10px]">volumen</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
