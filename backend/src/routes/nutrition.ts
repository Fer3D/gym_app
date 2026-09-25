import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const nutritionRouter = Router();

async function getOrCreateDailyLog(date: string, userId = 1) {
  let log = await prisma.dailyLog.findFirst({ where: { date, userId } });
  if (!log) {
    log = await prisma.dailyLog.create({ data: { date, userId } });
  }
  return log;
}

nutritionRouter.get('/day/:date', async (req: Request, res: Response) => {
  const date = String(req.params.date);
  const log = await prisma.dailyLog.findFirst({
    where: { date, userId: 1 },
    include: {
      mealLogs: { orderBy: { createdAt: 'asc' } },
    },
  }) as any;

  if (!log) return res.json({ date, meals: { desayuno: [], almuerzo: [], cena: [], snack: [] }, totals: emptyTotals() });

  const meals: Record<string, any[]> = { desayuno: [], almuerzo: [], cena: [], snack: [] };
  ((log.mealLogs as any[]) || []).forEach((meal: any) => {
    if (meals[meal.mealType]) meals[meal.mealType].push(meal);
    else meals['snack'].push(meal);
  });

  const totals = calculateTotals((log.mealLogs as any[]) || []);
  return res.json({ date, logId: log.id, notes: log.notes, weight: log.weight, meals, totals });
});

nutritionRouter.post('/day/:date/meal', async (req: Request, res: Response) => {
  try {
    const date = String(req.params.date);
    const { mealType, foodId, foodName, brand, quantity, calories, proteins, carbs, fats, fiber, sugar, sodium, imageUrl } = req.body;

    const log = await getOrCreateDailyLog(date);

    const meal = await prisma.mealLog.create({
      data: {
        dailyLogId: log.id,
        mealType,
        foodId,
        foodName,
        brand: brand || null,
        quantity: parseFloat(quantity),
        calories: parseFloat(calories),
        proteins: parseFloat(proteins || 0),
        carbs: parseFloat(carbs || 0),
        fats: parseFloat(fats || 0),
        fiber: parseFloat(fiber || 0),
        sugar: parseFloat(sugar || 0),
        sodium: parseFloat(sodium || 0),
        imageUrl: imageUrl || null,
      },
    });

    return res.json(meal);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al agregar alimento' });
  }
});

nutritionRouter.put('/meal/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { quantity, mealType } = req.body;
    const existing = await prisma.mealLog.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ error: 'No encontrado' });

    const factor = parseFloat(quantity) / existing.quantity;
    const updated = await prisma.mealLog.update({
      where: { id: parseInt(String(id)) },
      data: {
        quantity: parseFloat(quantity),
        mealType: mealType || existing.mealType,
        calories: existing.calories * factor,
        proteins: existing.proteins * factor,
        carbs: existing.carbs * factor,
        fats: existing.fats * factor,
        fiber: existing.fiber * factor,
        sugar: existing.sugar * factor,
        sodium: existing.sodium * factor,
      },
    });
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: 'Error al actualizar comida' });
  }
});

nutritionRouter.delete('/meal/:id', async (req: Request, res: Response) => {
  await prisma.mealLog.delete({ where: { id: parseInt(String(req.params.id)) } });
  return res.json({ success: true });
});

nutritionRouter.patch('/day/:date', async (req: Request, res: Response) => {
  const date = String(req.params.date);
  const log = await getOrCreateDailyLog(date);
  const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {};
  const data: { notes?: string | null; weight?: number | null } = {};

  if ('notes' in body) {
    if (body.notes === null || body.notes === '') data.notes = null;
    else if (typeof body.notes === 'string' && body.notes.length <= 2000) data.notes = body.notes;
    else return res.status(400).json({ error: 'Notas inválidas' });
  }
  if ('weight' in body) {
    if (body.weight === null || body.weight === '') data.weight = null;
    else {
      const w = Number(body.weight);
      if (!Number.isFinite(w) || w < 20 || w > 400) return res.status(400).json({ error: 'Peso inválido' });
      data.weight = w;
    }
  }
  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Sin campos válidos' });

  const updated = await prisma.dailyLog.update({ where: { id: log.id }, data });
  return res.json(updated);
});

nutritionRouter.get('/stats/weekly/:startDate', async (req: Request, res: Response) => {
  const startDate = String(req.params.startDate);
  const start = new Date(startDate);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const logs = await prisma.dailyLog.findMany({
    where: { date: { in: dates }, userId: 1 },
    include: { mealLogs: true },
  }) as any[];

  const stats = dates.map((date) => {
    const log = logs.find((l: any) => l.date === date);
    const totals = log ? calculateTotals(log.mealLogs || []) : emptyTotals();
    return { date, ...totals, weight: log?.weight || null };
  });

  return res.json(stats);
});

nutritionRouter.get('/stats/monthly/:year/:month', async (req: Request, res: Response) => {
  const year = String(req.params.year);
  const month = String(req.params.month);
  const prefix = `${year}-${month.padStart(2, '0')}`;

  const logs = await prisma.dailyLog.findMany({
    where: { date: { startsWith: prefix }, userId: 1 },
    include: { mealLogs: true },
  }) as any[];

  const stats = logs.map((log: any) => ({
    date: log.date,
    ...calculateTotals(log.mealLogs || []),
    weight: log.weight,
  }));

  return res.json(stats);
});

function calculateTotals(meals: any[]) {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      proteins: acc.proteins + (m.proteins || 0),
      carbs: acc.carbs + (m.carbs || 0),
      fats: acc.fats + (m.fats || 0),
      fiber: acc.fiber + (m.fiber || 0),
    }),
    emptyTotals()
  );
}

function emptyTotals() {
  return { calories: 0, proteins: 0, carbs: 0, fats: 0, fiber: 0 };
}
