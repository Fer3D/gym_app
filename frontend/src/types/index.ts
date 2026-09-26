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

export interface NutritionDay {
  date: string;
  meals: Record<string, MealLog[]>;
  totals: Macros;
  weight?: number | null;
}

export interface UserProfile {
  name: string;
  weight?: number | null;
  height?: number | null;
  birthDate?: string | null;
  gender?: string;
  objective?: string;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatsGoal: number;
}

export interface TdeeResult {
  bmr: number;
  tdee: number;
  goal: number;
  activityMultiplier?: number;
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

export interface WorkoutLog {
  id: number;
  date: string;
  name: string;
  notes?: string;
  duration?: number;
  exerciseLogs: ExerciseLog[];
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
  id: number | string;
  name: string;
  description?: string;
  level: string;
  daysPerWeek: number;
  tags?: string[];
  days: RoutineDay[];
  source?: string;
  sourceId?: string;
  createdAt?: string;
}

export interface WeeklyNutritionPoint {
  date: string;
  calories: number;
  proteins?: number;
  carbs?: number;
  fats?: number;
}

export interface CalendarDaySummary {
  nutrition?: {
    calories: number;
    proteins?: number;
    carbs?: number;
    fats?: number;
    meals?: number;
    goalMet?: boolean;
    weight?: number;
  };
  workouts?: Array<{
    id: number;
    name: string;
    exercises: number;
    totalSets: number;
    totalVolume: number;
  }>;
}

export interface CalendarSummary {
  calorieGoal: number;
  days: Record<string, CalendarDaySummary>;
}
