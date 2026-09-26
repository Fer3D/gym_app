import type {
  CalendarSummary,
  NutritionDay,
  WorkoutLog,
} from '../types';
import { format, subDays } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

export const mockNutritionDay = (date = today()): NutritionDay => ({
  date,
  weight: 78.5,
  totals: {
    calories: 2140,
    proteins: 165,
    carbs: 220,
    fats: 62,
  },
  meals: {
    desayuno: [
      {
        id: 1,
        mealType: 'desayuno',
        foodId: 'oats',
        foodName: 'Avena integral',
        brand: 'Hacendado',
        quantity: 80,
        calories: 310,
        proteins: 11,
        carbs: 54,
        fats: 6,
        fiber: 8,
      },
      {
        id: 2,
        mealType: 'desayuno',
        foodId: 'egg',
        foodName: 'Huevos revueltos',
        quantity: 120,
        calories: 186,
        proteins: 15,
        carbs: 1,
        fats: 14,
        fiber: 0,
      },
    ],
    almuerzo: [
      {
        id: 3,
        mealType: 'almuerzo',
        foodId: 'chicken',
        foodName: 'Pechuga de pollo a la plancha',
        quantity: 200,
        calories: 330,
        proteins: 62,
        carbs: 0,
        fats: 7,
        fiber: 0,
      },
      {
        id: 4,
        mealType: 'almuerzo',
        foodId: 'rice',
        foodName: 'Arroz blanco cocido',
        quantity: 180,
        calories: 234,
        proteins: 4,
        carbs: 52,
        fats: 0.5,
        fiber: 1,
      },
      {
        id: 5,
        mealType: 'almuerzo',
        foodId: 'broccoli',
        foodName: 'Brócoli al vapor',
        quantity: 150,
        calories: 51,
        proteins: 4,
        carbs: 10,
        fats: 0.5,
        fiber: 4,
      },
    ],
    cena: [
      {
        id: 6,
        mealType: 'cena',
        foodId: 'salmon',
        foodName: 'Salmón a la plancha',
        quantity: 160,
        calories: 332,
        proteins: 36,
        carbs: 0,
        fats: 20,
        fiber: 0,
      },
      {
        id: 7,
        mealType: 'cena',
        foodId: 'potato',
        foodName: 'Patata asada',
        quantity: 200,
        calories: 186,
        proteins: 4,
        carbs: 42,
        fats: 0.2,
        fiber: 4,
      },
    ],
    snack: [
      {
        id: 8,
        mealType: 'snack',
        foodId: 'yogurt',
        foodName: 'Yogur griego 0%',
        brand: 'Fage',
        quantity: 170,
        calories: 97,
        proteins: 17,
        carbs: 6,
        fats: 0,
        fiber: 0,
      },
      {
        id: 9,
        mealType: 'snack',
        foodId: 'almonds',
        foodName: 'Almendras',
        quantity: 25,
        calories: 144,
        proteins: 5,
        carbs: 5,
        fats: 12,
        fiber: 3,
      },
    ],
  },
});

export const mockWorkouts = (date = today()): WorkoutLog[] => [
  {
    id: 101,
    date,
    name: 'Push A',
    duration: 45,
    exerciseLogs: [
      {
        id: 1,
        exerciseId: 'bench',
        exerciseName: 'Bench Press',
        muscleGroup: 'Pecho',
        category: 'Fuerza',
        order: 0,
        sets: [
          { id: 11, setNumber: 1, weight: 80, reps: 8, completed: true },
          { id: 12, setNumber: 2, weight: 80, reps: 8, completed: true },
          { id: 13, setNumber: 3, weight: 82.5, reps: 6, completed: true },
          { id: 14, setNumber: 4, weight: 82.5, reps: 6, completed: false },
        ],
      },
      {
        id: 2,
        exerciseId: 'ohp',
        exerciseName: 'Overhead Press',
        muscleGroup: 'Hombros',
        category: 'Fuerza',
        order: 1,
        sets: [
          { id: 21, setNumber: 1, weight: 50, reps: 8, completed: true },
          { id: 22, setNumber: 2, weight: 50, reps: 8, completed: true },
          { id: 23, setNumber: 3, weight: 52.5, reps: 6, completed: false },
        ],
      },
      {
        id: 3,
        exerciseId: 'incline',
        exerciseName: 'Incline Dumbbell Press',
        muscleGroup: 'Pecho',
        category: 'Fuerza',
        order: 2,
        sets: [
          { id: 31, setNumber: 1, weight: 30, reps: 10, completed: false },
          { id: 32, setNumber: 2, weight: 30, reps: 10, completed: false },
          { id: 33, setNumber: 3, weight: 30, reps: 10, completed: false },
        ],
      },
    ],
  },
];

export const mockCalendarSummary = (year: number, month: number): CalendarSummary => {
  const days: CalendarSummary['days'] = {};
  const t = new Date();
  for (let i = 0; i < 14; i++) {
    const d = subDays(t, i);
    if (d.getFullYear() !== year || d.getMonth() + 1 !== month) continue;
    const key = format(d, 'yyyy-MM-dd');
    const cals = 1900 + ((i * 137) % 600);
    days[key] = {
      nutrition: {
        calories: cals,
        proteins: Math.round(cals * 0.075),
        carbs: Math.round(cals * 0.1),
        fats: Math.round(cals * 0.028),
        meals: 3 + (i % 2),
        goalMet: cals >= 2300 && cals <= 2600,
        weight: i === 0 ? 78.5 : undefined,
      },
      workouts:
        i % 2 === 0
          ? [{ id: 100 + i, name: i % 4 === 0 ? 'Push A' : 'Pull A', exercises: 6, totalSets: 18, totalVolume: 4200 + i * 80 }]
          : [],
    };
  }
  return { calorieGoal: 2500, days };
}
