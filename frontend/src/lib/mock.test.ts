import { describe, it, expect } from 'vitest';
import {
  mockNutritionDay,
  mockCalendarSummary,
  mockWorkouts,
} from './mock';

describe('mockNutritionDay', () => {
  it('devuelve totales realistas', () => {
    const day = mockNutritionDay('2026-09-25');
    expect(day.date).toBe('2026-09-25');
    expect(day.totals.calories).toBe(2140);
    expect(day.totals.proteins).toBe(165);
    expect(day.meals.desayuno.length).toBeGreaterThan(0);
    expect(day.meals.almuerzo.length).toBeGreaterThan(0);
  });
});

describe('mockWorkouts', () => {
  it('incluye Push A con series', () => {
    const workouts = mockWorkouts('2026-09-25');
    expect(workouts).toHaveLength(1);
    expect(workouts[0].name).toBe('Push A');
    expect(workouts[0].exerciseLogs[0].sets.length).toBeGreaterThanOrEqual(3);
  });
});

describe('mockCalendarSummary', () => {
  it('respeta year/month y objetivo', () => {
    const summary = mockCalendarSummary(2026, 9);
    expect(summary.calorieGoal).toBe(2500);
    const keys = Object.keys(summary.days);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(key.startsWith('2026-09-')).toBe(true);
    }
  });
});
