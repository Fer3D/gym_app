import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  calcMacrosFromPer100g,
  pct,
  remaining,
  getMealLabel,
  dateToString,
  getWeekStart,
  greetingForHour,
  formatDate,
  weightAnomalyWarning,
} from './utils';

describe('calcMacrosFromPer100g', () => {
  const chicken = {
    calories: 165,
    proteins: 31,
    carbs: 0,
    fats: 3.6,
    fiber: 0,
  };

  it('escala macros a 200g', () => {
    const result = calcMacrosFromPer100g(chicken, 200);
    expect(result.calories).toBe(330);
    expect(result.proteins).toBe(62);
    expect(result.carbs).toBe(0);
    expect(result.fats).toBe(7.2);
  });

  it('escala macros a 50g', () => {
    const result = calcMacrosFromPer100g(chicken, 50);
    expect(result.calories).toBe(83);
    expect(result.proteins).toBe(15.5);
  });
});

describe('pct', () => {
  it('calcula porcentaje redondeado', () => {
    expect(pct(2140, 2500)).toBe(86);
  });

  it('cap a 100', () => {
    expect(pct(3000, 2500)).toBe(100);
  });

  it('goal 0 → 0', () => {
    expect(pct(100, 0)).toBe(0);
  });
});

describe('remaining', () => {
  it('kcal restantes', () => {
    expect(remaining(2140, 2500)).toBe(360);
  });

  it('no baja de 0', () => {
    expect(remaining(2800, 2500)).toBe(0);
  });
});

describe('weightAnomalyWarning', () => {
  it('avisa si peso >> media', () => {
    expect(weightAnomalyWarning(100, [10, 15, 20, 12])).toMatch(/muy alto/);
  });

  it('avisa si peso << media', () => {
    expect(weightAnomalyWarning(2, [20, 22, 25, 18])).toMatch(/muy bajo/);
  });

  it('sin historial suficiente → null', () => {
    expect(weightAnomalyWarning(100, [20, 22])).toBeNull();
  });
});

describe('getMealLabel', () => {
  it('traduce tipos conocidos', () => {
    expect(getMealLabel('desayuno')).toBe('Desayuno');
    expect(getMealLabel('almuerzo')).toBe('Comida');
    expect(getMealLabel('cena')).toBe('Cena');
    expect(getMealLabel('snack')).toBe('Snacks');
  });

  it('deja pasar tipos desconocidos', () => {
    expect(getMealLabel('brunch')).toBe('brunch');
  });
});

describe('fechas', () => {
  it('dateToString usa yyyy-MM-dd', () => {
    expect(dateToString(new Date(2026, 8, 25))).toBe('2026-09-25');
  });

  it('getWeekStart es lunes', () => {

    expect(getWeekStart(new Date(2026, 8, 25))).toBe('2026-09-21');
  });

  it('formatDate locale ES', () => {
    expect(formatDate('2026-09-25')).toBe('25 septiembre 2026');
  });
});

describe('greetingForHour', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('mañana', () => {
    vi.setSystemTime(new Date(2026, 8, 25, 9, 0, 0));
    expect(greetingForHour()).toBe('Buenos días');
  });

  it('tarde', () => {
    vi.setSystemTime(new Date(2026, 8, 25, 15, 0, 0));
    expect(greetingForHour()).toBe('Buenas tardes');
  });

  it('noche', () => {
    vi.setSystemTime(new Date(2026, 8, 25, 22, 0, 0));
    expect(greetingForHour()).toBe('Buenas noches');
  });
});
