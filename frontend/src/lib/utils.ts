import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import type { Macros, MacrosPer100g } from '../types';
import i18n from '../i18n';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getDateFnsLocale() {
  return i18n.language?.toLowerCase().startsWith('en') ? enUS : es;
}

export function formatDate(date: string | Date, fmt = 'd MMMM yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: getDateFnsLocale() });
}

export function formatDateLabel(date: string) {
  const d = parseISO(date);
  if (isToday(d)) return i18n.t('common.today');
  if (isYesterday(d)) return i18n.t('common.yesterday');
  return format(d, 'EEEE, d MMMM', { locale: getDateFnsLocale() });
}

export function greetingForHour(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return i18n.t('time.goodMorning');
  if (h < 20) return i18n.t('time.goodAfternoon');
  return i18n.t('time.goodEvening');
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
  const key = `meals.${mealType}`;
  const translated = i18n.t(key);
  return translated === key ? mealType : translated;
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
    return i18n.t('weightWarning.high', { med: Math.round(med) });
  }
  if (weight < med / 3) {
    return i18n.t('weightWarning.low', { med: Math.round(med) });
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

export function translateExerciseCategory(
  name: string | null | undefined,
  t: (key: string) => string,
): string {
  if (!name) return '';
  const key = `exerciseSearch.${name}`;
  const translated = t(key);
  return translated === key ? name : translated;
}

export type { Macros, MacrosPer100g, FoodProduct, MealLog, WorkoutLog, ExerciseLog, ExerciseSet, Exercise, ExerciseReorder, Routine, RoutineDay, RoutineExercise } from '../types';
