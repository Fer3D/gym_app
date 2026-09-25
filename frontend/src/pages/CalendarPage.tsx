import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar';
import { Link } from 'react-router-dom';
import { format, isSameDay, isToday as isDateToday } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Utensils,
  Scale,
  ArrowUpRight,
} from 'lucide-react';
import { calendarApi } from '../lib/api';
import { mockCalendarSummary, withFallback } from '../lib/mock';
import { cn, dateToString, formatDateLabel, pct } from '../lib/utils';
import type { CalendarDaySummary } from '../types';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

function DayDots({ day }: { day?: CalendarDaySummary }) {
  if (!day) return <span className="ft-cal__dots" aria-hidden />;

  const hasNutrition = !!day.nutrition;
  const goalMet = !!day.nutrition?.goalMet;
  const hasWorkout = !!(day.workouts && day.workouts.length > 0);

  if (!hasNutrition && !hasWorkout) {
    return <span className="ft-cal__dots" aria-hidden />;
  }

  return (
    <span className="ft-cal__dots" aria-hidden>
      {hasNutrition && (
        <span
          className={
            goalMet ? 'ft-cal__dot ft-cal__dot--goal' : 'ft-cal__dot ft-cal__dot--food'
          }
        />
      )}
      {hasWorkout && <span className="ft-cal__dot ft-cal__dot--workout" />}
    </span>
  );
}

export function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;

  const { data: summary, isLoading } = useQuery({
    queryKey: ['calendar-summary', year, month],
    queryFn: () =>
      withFallback(
        () => calendarApi.summary(year, month).then((r) => r.data),
        mockCalendarSummary(year, month)
      ),
    staleTime: 2 * 60 * 1000,
  });

  const selectedStr = dateToString(selectedDate);
  const dayData = summary?.days?.[selectedStr] as CalendarDaySummary | undefined;
  const calorieGoal = summary?.calorieGoal || 2500;

  const monthLabel = useMemo(
    () => format(viewDate, 'MMMM yyyy', { locale: es }),
    [viewDate]
  );

  const monthStats = useMemo(() => {
    const days = Object.values(summary?.days || {}) as CalendarDaySummary[];
    let nutritionDays = 0;
    let goalDays = 0;
    let workoutDays = 0;
    let totalKcal = 0;

    for (const d of days) {
      if (d.nutrition) {
        nutritionDays += 1;
        totalKcal += d.nutrition.calories || 0;
        if (d.nutrition.goalMet) goalDays += 1;
      }
      if (d.workouts?.length) workoutDays += 1;
    }

    return {
      nutritionDays,
      goalDays,
      workoutDays,
      avgKcal: nutritionDays ? Math.round(totalKcal / nutritionDays) : 0,
    };
  }, [summary]);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
    setViewDate(next);
  };

  const goToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    const classes = ['ft-cal__tile'];
    const d = summary?.days?.[dateToString(date)];
    if (d?.nutrition) classes.push('ft-cal__tile--food');
    if (d?.nutrition?.goalMet) classes.push('ft-cal__tile--goal');
    if (d?.workouts?.length) classes.push('ft-cal__tile--workout');
    if (isDateToday(date)) classes.push('ft-cal__tile--today');
    if (isSameDay(date, selectedDate)) classes.push('ft-cal__tile--selected');
    return classes.join(' ');
  };

  const hasAnyActivity = !!(
    dayData?.nutrition ||
    (dayData?.workouts && dayData.workouts.length > 0)
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.375rem] font-semibold tracking-tight text-[#eef0f3] sm:text-2xl">
            Calendario
          </h1>
          <p className="mt-0.5 text-sm capitalize text-[#9aa3b2]">{monthLabel}</p>
        </div>
        <button
          type="button"
          onClick={goToday}
          className="h-9 shrink-0 rounded-md border border-[#2a2f3a] bg-[#14171c] px-3 text-sm text-[#c8ced8] transition-colors hover:bg-[#1b1f27] hover:text-[#eef0f3]"
        >
          Hoy
        </button>
      </header>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#2a2f3a] bg-[#2a2f3a] sm:grid-cols-4">
        {[
          { label: 'Días con comida', value: monthStats.nutritionDays },
          { label: 'Objetivo cumplido', value: monthStats.goalDays },
          { label: 'Días de entreno', value: monthStats.workoutDays },
          {
            label: 'Media kcal',
            value: monthStats.avgKcal > 0 ? monthStats.avgKcal.toLocaleString('es-ES') : '—',
          },
        ].map((s) => (
          <div key={s.label} className="bg-[#14171c] px-3 py-3 sm:px-4">
            <p className="text-[11px] text-[#6b7385]">{s.label}</p>
            <p className="mt-1 font-mono text-lg font-medium tabular-nums text-[#eef0f3]">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1.2fr_0.8fr]">

        <section className="order-1 space-y-3 lg:order-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium capitalize text-[#eef0f3]">
              {formatDateLabel(selectedStr)}
            </h2>
            <span className="font-mono text-xs tabular-nums text-[#6b7385]">
              {format(selectedDate, "d 'de' MMMM", { locale: es })}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedStr}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="min-h-[280px] rounded-lg border border-[#2a2f3a] bg-[#14171c]"
            >
              {!hasAnyActivity ? (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-5 py-10 text-center">
                  <p className="text-sm text-[#9aa3b2]">Sin actividad este día.</p>
                  <p className="mt-1 max-w-[240px] text-xs text-[#6b7385]">
                    Registra comida o inicia un entrenamiento para ver el resumen aquí.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <Link
                      to="/nutricion"
                      className="inline-flex h-10 items-center rounded-md bg-[#3ecf8e] px-4 text-sm font-semibold text-[#062016]"
                    >
                      Añadir comida
                    </Link>
                    <Link
                      to="/entreno"
                      className="inline-flex h-10 items-center rounded-md border border-[#2a2f3a] bg-[#1b1f27] px-4 text-sm text-[#eef0f3]"
                    >
                      Entreno
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[#1f2430]">
                  {dayData?.nutrition && (
                    <div className="space-y-4 p-4 sm:p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#9aa3b2]">
                          <Utensils size={14} strokeWidth={1.75} />
                          <span className="text-xs font-medium uppercase tracking-wide">
                            Nutrición
                          </span>
                        </div>
                        {dayData.nutrition.goalMet ? (
                          <span className="text-[11px] font-medium text-[#3ecf8e]">
                            Objetivo
                          </span>
                        ) : (
                          <Link
                            to="/nutricion"
                            className="inline-flex items-center gap-0.5 text-xs text-[#9aa3b2] hover:text-[#eef0f3]"
                          >
                            Abrir <ArrowUpRight size={12} />
                          </Link>
                        )}
                      </div>

                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-[#eef0f3]">
                            {Math.round(dayData.nutrition.calories).toLocaleString('es-ES')}
                          </span>
                          <span className="text-sm text-[#6b7385]">
                            / {calorieGoal.toLocaleString('es-ES')} kcal
                          </span>
                        </div>
                        <div className="mt-3 h-1 overflow-hidden rounded-sm bg-[#232833]">
                          <div
                            className={cn(
                              'h-full rounded-sm transition-[width] duration-300',
                              dayData.nutrition.goalMet ? 'bg-[#3ecf8e]' : 'bg-[#9aa3b2]'
                            )}
                            style={{
                              width: `${Math.min(
                                100,
                                pct(dayData.nutrition.calories, calorieGoal)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 border-t border-[#1f2430] pt-3">
                        {[
                          { label: 'Prot.', value: dayData.nutrition.proteins || 0 },
                          { label: 'Carb.', value: dayData.nutrition.carbs || 0 },
                          { label: 'Grasa', value: dayData.nutrition.fats || 0 },
                        ].map((m) => (
                          <div key={m.label}>
                            <p className="text-[11px] text-[#6b7385]">{m.label}</p>
                            <p className="mt-0.5 font-mono text-sm tabular-nums text-[#eef0f3]">
                              {Math.round(m.value)}
                              <span className="text-[#6b7385]"> g</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {dayData?.nutrition?.weight != null && (
                    <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                      <Scale size={14} className="text-[#6b7385]" strokeWidth={1.75} />
                      <span className="flex-1 text-xs text-[#9aa3b2]">Peso</span>
                      <span className="font-mono text-sm tabular-nums text-[#eef0f3]">
                        {dayData.nutrition.weight} kg
                      </span>
                    </div>
                  )}

                  {dayData?.workouts && dayData.workouts.length > 0 && (
                    <div className="space-y-3 p-4 sm:p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#9aa3b2]">
                          <Dumbbell size={14} strokeWidth={1.75} />
                          <span className="text-xs font-medium uppercase tracking-wide">
                            Entrenamiento
                          </span>
                        </div>
                        <Link
                          to="/entreno"
                          className="inline-flex items-center gap-0.5 text-xs text-[#9aa3b2] hover:text-[#eef0f3]"
                        >
                          Abrir <ArrowUpRight size={12} />
                        </Link>
                      </div>

                      <ul className="space-y-2">
                        {dayData.workouts.map((w) => (
                          <li
                            key={w.id}
                            className="flex items-center justify-between gap-3 rounded-md border border-[#1f2430] bg-[#0c0e12]/60 px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#eef0f3]">
                                {w.name}
                              </p>
                              <p className="text-xs text-[#6b7385]">
                                {w.exercises > 0
                                  ? `${w.exercises} ejercicios · ${w.totalSets} series`
                                  : 'Sesión iniciada'}
                              </p>
                            </div>
                            {w.totalVolume > 0 && (
                              <div className="text-right">
                                <p className="font-mono text-sm tabular-nums text-[#eef0f3]">
                                  {Math.round(w.totalVolume).toLocaleString('es-ES')}
                                </p>
                                <p className="text-[10px] uppercase tracking-wide text-[#6b7385]">
                                  kg
                                </p>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        <section className="order-2 lg:order-1">
          <div className="rounded-lg border border-[#2a2f3a] bg-[#14171c] p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="inline-flex size-9 items-center justify-center rounded-md text-[#9aa3b2] hover:bg-[#1b1f27] hover:text-[#eef0f3]"
                aria-label="Mes anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <p className="text-sm font-medium capitalize text-[#eef0f3]">{monthLabel}</p>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="inline-flex size-9 items-center justify-center rounded-md text-[#9aa3b2] hover:bg-[#1b1f27] hover:text-[#eef0f3]"
                aria-label="Mes siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] text-[#6b7385]">
              <span className="inline-flex items-center gap-1.5">
                <span className="ft-cal__dot ft-cal__dot--food" /> Nutrición
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="ft-cal__dot ft-cal__dot--goal" /> Objetivo
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="ft-cal__dot ft-cal__dot--workout" /> Entreno
              </span>
            </div>

            {isLoading && (
              <div className="mb-2 h-0.5 overflow-hidden rounded-full bg-[#232833]">
                <div className="h-full w-1/3 animate-pulse bg-[#3ecf8e]/50" />
              </div>
            )}

            <Calendar
              className="ft-cal"
              value={selectedDate}
              activeStartDate={viewDate}
              onChange={(v: Value) => {
                if (v instanceof Date) setSelectedDate(v);
              }}
              onActiveStartDateChange={({ activeStartDate }) => {
                if (activeStartDate) {
                  setViewDate(
                    new Date(activeStartDate.getFullYear(), activeStartDate.getMonth(), 1)
                  );
                }
              }}
              tileContent={({ date, view }) =>
                view === 'month' ? (
                  <DayDots day={summary?.days?.[dateToString(date)]} />
                ) : null
              }
              tileClassName={tileClassName}
              locale="es-ES"
              maxDate={new Date()}
              showNeighboringMonth
              next2Label={null}
              prev2Label={null}
              nextLabel={null}
              prevLabel={null}
              navigationLabel={() => null}
              formatShortWeekday={(_locale, date) =>
                format(date, 'EEEEEE', { locale: es }).toUpperCase()
              }
            />
          </div>
        </section>
      </div>
    </div>
  );
}
