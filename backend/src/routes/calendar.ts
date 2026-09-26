import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const calendarRouter = Router();

calendarRouter.get('/summary/:year/:month', async (req: Request, res: Response) => {
  const year = String(req.params.year);
  const month = String(req.params.month);
  const prefix = `${year}-${month.padStart(2, '0')}`;

  const [nutritionLogs, workoutLogs] = await Promise.all([
    prisma.dailyLog.findMany({
      where: { date: { startsWith: prefix }, userId: 1 },
      include: { mealLogs: true },
    }) as any,
    prisma.workoutLog.findMany({
      where: { date: { startsWith: prefix }, userId: 1 },
      include: { exerciseLogs: { include: { sets: true } } },
    }),
  ]);

  const user = await prisma.user.findFirst({ where: { id: 1 } });
  const calorieGoal = user?.calorieGoal || 2000;

  const dayMap: Record<string, any> = {};

  nutritionLogs.forEach((log) => {
    const totalCals = log.mealLogs.reduce((sum, m) => sum + m.calories, 0);
    const totalProteins = log.mealLogs.reduce((sum, m) => sum + m.proteins, 0);
    if (!dayMap[log.date]) dayMap[log.date] = {};
    dayMap[log.date].nutrition = {
      calories: Math.round(totalCals),
      proteins: Math.round(totalProteins),
      meals: log.mealLogs.length,
      goalMet: totalCals >= calorieGoal * 0.9 && totalCals <= calorieGoal * 1.1,
      weight: log.weight,
    };
  });

  workoutLogs.forEach((log) => {
    if (!dayMap[log.date]) dayMap[log.date] = {};
    if (!dayMap[log.date].workouts) dayMap[log.date].workouts = [];
    dayMap[log.date].workouts.push({
      id: log.id,
      name: log.name,
      exercises: log.exerciseLogs.length,
      totalSets: log.exerciseLogs.reduce((sum, e) => sum + e.sets.length, 0),
      totalVolume: log.exerciseLogs.reduce((sum, e) =>
        sum + e.sets.reduce((sv, s) => sv + (s.weight || 0) * (s.reps || 0), 0), 0),
    });
  });

  return res.json({ days: dayMap, calorieGoal });
});
