import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: es });
}

export function formatDateLabel(date: string) {
  const d = parseISO(date);
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "EEEE, d 'de' MMMM", { locale: es });
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

export function calorieColor(current: number, goal: number) {
  const pct = (current / goal) * 100;
  if (pct < 60) return '#6366f1';
  if (pct < 90) return '#f59e0b';
  if (pct <= 110) return '#22c55e';
  return '#ef4444';
}

export function getMealIcon(mealType: string) {
  const icons: Record<string, string> = {
    desayuno: '☀️',
    almuerzo: '🍽️',
    cena: '🌙',
    snack: '🍎',
  };
  return icons[mealType] || '🍽️';
}

export function getMealLabel(mealType: string) {
  const labels: Record<string, string> = {
    desayuno: 'Desayuno',
    almuerzo: 'Almuerzo',
    cena: 'Cena',
    snack: 'Snack',
  };
  return labels[mealType] || mealType;
}

export interface Macros {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface MacrosPer100g {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface FoodProduct {
  id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  servingSize?: number;
  per100g: MacrosPer100g;
}

export interface MealLog {
  id: number;
  mealType: string;
  foodId: string;
  foodName: string;
  brand?: string;
  quantity: number;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  fiber: number;
  imageUrl?: string;
}

export interface WorkoutLog {
  id: number;
  date: string;
  name: string;
  notes?: string;
  duration?: number;
  exerciseLogs: ExerciseLog[];
}

export interface ExerciseLog {
  id: number;
  exerciseId: string;
  exerciseName: string;
  muscleGroup?: string;
  category?: string;
  notes?: string;
  order: number;
  sets: ExerciseSet[];
}

export interface ExerciseSet {
  id: number;
  setNumber: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  completed: boolean;
  rpe?: number;
}

export interface Exercise {
  id: number;
  name: string;
  description?: string;
  category: string;
  muscles: { id: number; name: string }[];
  musclesSecondary: { id: number; name: string }[];
  equipment: { id: number; name: string }[];
  images: string[];
}

export interface RoutineExercise {
  name: string;
  category: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  exerciseId?: string;
}

export interface RoutineDay {
  day: number;
  dayName: string;
  exercises: RoutineExercise[];
}

export interface Routine {
  id: number | string;  // number for saved, string for explore
  name: string;
  description?: string;
  level: string;
  daysPerWeek: number;
  tags?: string[];
  days: RoutineDay[];
  source?: string;      // 'user' | 'explore'
  sourceId?: string;
  createdAt?: string;
}
