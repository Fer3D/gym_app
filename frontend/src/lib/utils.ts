import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import type { Macros, MacrosPer100g } from '../types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date, fmt = 'd MMMM yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: es });
}

export function formatDateLabel(date: string) {
  const d = parseISO(date);
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "EEEE, d MMMM", { locale: es });
}

export function greetingForHour(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function todayString() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function dateToString(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export function isValidDateString(value: string | null | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return format(d, 'yyyy-MM-dd');
}

export function calcMacrosFromPer100g(per100g: MacrosPer100g, quantity: number): Macros {
  const factor = quantity / 100;
  return {
    calories: Math.round(per100g.calories * factor),
    proteins: Math.round(per100g.proteins * factor * 10) / 10,
    carbs: Math.round(per100g.carbs * factor * 10) / 10,
    fats: Math.round(per100g.fats * factor * 10) / 10,
    fiber: Math.round((per100g.fiber || 0) * factor * 10) / 10,
    sugar: Math.round((per100g.sugar || 0) * factor * 10) / 10,
    sodium: Math.round((per100g.sodium || 0) * factor * 10) / 10,
  };
}

export function getMealLabel(mealType: string) {
  const labels: Record<string, string> = {
    desayuno: 'Desayuno',
    almuerzo: 'Comida',
    cena: 'Cena',
    snack: 'Snacks',
  };
  return labels[mealType] || mealType;
}

export function pct(value: number, goal: number) {
  if (!goal) return 0;
  return Math.min(100, Math.round((value / goal) * 100));
}

export function remaining(value: number, goal: number) {
  return Math.max(0, goal - value);
}

export function median(values: number[]): number | null {
  const nums = values.filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
}

export function weightAnomalyWarning(weight: number, historyWeights: number[]): string | null {
  if (!Number.isFinite(weight) || weight <= 0) return null;
  const med = median(historyWeights);
  if (med == null || historyWeights.filter((w) => w > 0).length < 3) return null;
  if (weight > med * 2.5) {
    return `Peso muy alto vs tu media (~${Math.round(med)} kg). ¿Seguro?`;
  }
  if (weight < med / 3) {
    return `Peso muy bajo vs tu media (~${Math.round(med)} kg). ¿Seguro?`;
  }
  return null;
}

export const EXERCISE_CATEGORY_ICONS: Record<string, string> = {
  Abs: '🏋️',
  Arms: '💪',
  Back: '🦴',
  Calves: '🦵',
  Cardio: '🏃',
  Chest: '🫁',
  Legs: '🦿',
  Shoulders: '🤷',
};

export function exerciseCategoryIcon(category?: string | null) {
  return EXERCISE_CATEGORY_ICONS[category || ''] || '🏋️';
}

export type { Macros, MacrosPer100g, FoodProduct, MealLog, WorkoutLog, ExerciseLog, ExerciseSet, Exercise, ExerciseReorder, Routine, RoutineDay, RoutineExercise } from '../types';
