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

export type { Macros, MacrosPer100g, FoodProduct, MealLog, WorkoutLog, ExerciseLog, ExerciseSet, Exercise, Routine, RoutineDay, RoutineExercise } from '../types';
