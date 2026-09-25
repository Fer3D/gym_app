import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const workoutRouter = Router();

workoutRouter.get('/day/:date', async (req: Request, res: Response) => {
  const workouts = await prisma.workoutLog.findMany({
    where: { date: String(req.params.date), userId: 1 },
    include: {
      exerciseLogs: {
        include: { sets: { orderBy: { setNumber: 'asc' } } },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(workouts);
});

workoutRouter.post('/day/:date', async (req: Request, res: Response) => {
  try {
    const { name, notes } = req.body;
    const workout = await prisma.workoutLog.create({
      data: { date: String(req.params.date), userId: 1, name: name || 'Mi entrenamiento', notes },
      include: { exerciseLogs: { include: { sets: true } } },
    });
    return res.json(workout);
  } catch {
    return res.status(500).json({ error: 'Error al crear entrenamiento' });
  }
});

workoutRouter.put('/:id', async (req: Request, res: Response) => {
  const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {};
  const data: { name?: string; notes?: string | null; duration?: number | null } = {};

  if ('name' in body) {
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 120) {
      return res.status(400).json({ error: 'Nombre inválido' });
    }
    data.name = body.name.trim();
  }
  if ('notes' in body) {
    if (body.notes === null || body.notes === '') data.notes = null;
    else if (typeof body.notes === 'string' && body.notes.length <= 2000) data.notes = body.notes;
    else return res.status(400).json({ error: 'Notas inválidas' });
  }
  if ('duration' in body) {
    if (body.duration === null || body.duration === '') data.duration = null;
    else {
      const d = Number(body.duration);
      if (!Number.isFinite(d) || d < 0 || d > 600) return res.status(400).json({ error: 'Duración inválida' });
      data.duration = Math.round(d);
    }
  }
  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Sin campos válidos' });

  const updated = await prisma.workoutLog.update({
    where: { id: parseInt(String(req.params.id)) },
    data,
    include: { exerciseLogs: { include: { sets: true } } },
  });
  return res.json(updated);
});

workoutRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.workoutLog.delete({ where: { id: parseInt(String(req.params.id)) } });
  return res.json({ success: true });
});

workoutRouter.post('/:workoutId/exercise', async (req: Request, res: Response) => {
  try {
    const { exerciseId, exerciseName, muscleGroup, category, notes, order } = req.body;
    const exercise = await prisma.exerciseLog.create({
      data: {
        workoutLogId: parseInt(String(req.params.workoutId)),
        exerciseId: String(exerciseId),
        exerciseName,
        muscleGroup: muscleGroup || null,
        category: category || null,
        notes: notes || null,
        order: order || 0,
      },
      include: { sets: true },
    });
    return res.json(exercise);
  } catch {
    return res.status(500).json({ error: 'Error al agregar ejercicio' });
  }
});

workoutRouter.delete('/exercise/:id', async (req: Request, res: Response) => {
  await prisma.exerciseLog.delete({ where: { id: parseInt(String(req.params.id)) } });
  return res.json({ success: true });
});

workoutRouter.post('/exercise/:exerciseId/set', async (req: Request, res: Response) => {
  try {
    const { setNumber, reps, weight, duration, distance, restTime, rpe } = req.body;
    const set = await prisma.exerciseSet.create({
      data: {
        exerciseLogId: parseInt(String(req.params.exerciseId)),
        setNumber: setNumber || 1,
        reps: reps ? parseInt(reps) : null,
        weight: weight ? parseFloat(weight) : null,
        duration: duration ? parseInt(duration) : null,
        distance: distance ? parseFloat(distance) : null,
        restTime: restTime ? parseInt(restTime) : null,
        rpe: rpe ? parseInt(rpe) : null,
      },
    });
    return res.json(set);
  } catch {
    return res.status(500).json({ error: 'Error al agregar serie' });
  }
});

workoutRouter.put('/set/:id', async (req: Request, res: Response) => {
  const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {};
  const data: {
    setNumber?: number;
    reps?: number | null;
    weight?: number | null;
    duration?: number | null;
    distance?: number | null;
    restTime?: number | null;
    completed?: boolean;
    rpe?: number | null;
  } = {};

  const intOrNull = (v: unknown, min: number, max: number) => {
    if (v === null || v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < min || n > max) return NaN;
    return Math.round(n);
  };
  const floatOrNull = (v: unknown, min: number, max: number) => {
    if (v === null || v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < min || n > max) return NaN;
    return n;
  };

  if ('setNumber' in body) {
    const n = intOrNull(body.setNumber, 1, 50);
    if (n === null || Number.isNaN(n)) return res.status(400).json({ error: 'setNumber inválido' });
    data.setNumber = n;
  }
  if ('reps' in body) {
    const n = intOrNull(body.reps, 0, 1000);
    if (Number.isNaN(n as number)) return res.status(400).json({ error: 'reps inválidas' });
    data.reps = n;
  }
  if ('weight' in body) {
    const n = floatOrNull(body.weight, 0, 2000);
    if (Number.isNaN(n as number)) return res.status(400).json({ error: 'peso inválido' });
    data.weight = n;
  }
  if ('duration' in body) {
    const n = intOrNull(body.duration, 0, 86400);
    if (Number.isNaN(n as number)) return res.status(400).json({ error: 'duración inválida' });
    data.duration = n;
  }
  if ('distance' in body) {
    const n = floatOrNull(body.distance, 0, 1000);
    if (Number.isNaN(n as number)) return res.status(400).json({ error: 'distancia inválida' });
    data.distance = n;
  }
  if ('restTime' in body) {
    const n = intOrNull(body.restTime, 0, 3600);
    if (Number.isNaN(n as number)) return res.status(400).json({ error: 'restTime inválido' });
    data.restTime = n;
  }
  if ('rpe' in body) {
    const n = intOrNull(body.rpe, 1, 10);
    if (Number.isNaN(n as number)) return res.status(400).json({ error: 'rpe inválido' });
    data.rpe = n;
  }
  if ('completed' in body) {
    if (typeof body.completed !== 'boolean') return res.status(400).json({ error: 'completed inválido' });
    data.completed = body.completed;
  }
  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Sin campos válidos' });

  const updated = await prisma.exerciseSet.update({
    where: { id: parseInt(String(req.params.id)) },
    data,
  });
  return res.json(updated);
});

workoutRouter.delete('/set/:id', async (req: Request, res: Response) => {
  await prisma.exerciseSet.delete({ where: { id: parseInt(String(req.params.id)) } });
  return res.json({ success: true });
});

workoutRouter.get('/progress/:exerciseName', async (req: Request, res: Response) => {
  const exerciseName = decodeURIComponent(String(req.params.exerciseName));
  const logs = await prisma.exerciseLog.findMany({
    where: { exerciseName: { contains: exerciseName } },
    include: {
      sets: true,
      workoutLog: { select: { date: true } },
    },
    orderBy: { workoutLog: { date: 'asc' } },
    take: 50,
  });

  const progress = logs.map((log) => {
    const maxWeight = Math.max(...log.sets.map((s) => s.weight || 0));
    const totalVolume = log.sets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
    return {
      date: log.workoutLog.date,
      maxWeight,
      totalVolume,
      sets: log.sets.length,
    };
  });

  return res.json(progress);
});

workoutRouter.get('/stats/weekly/:startDate', async (req: Request, res: Response) => {
  const startDate = String(req.params.startDate);
  const start = new Date(startDate);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const workouts = await prisma.workoutLog.findMany({
    where: { date: { in: dates }, userId: 1 },
    include: { exerciseLogs: { include: { sets: true } } },
  });

  const stats = dates.map((date) => {
    const dayWorkouts = workouts.filter((w) => w.date === date);
    const totalSets = dayWorkouts.reduce((sum, w) => sum + w.exerciseLogs.reduce((s, e) => s + e.sets.length, 0), 0);
    const totalVolume = dayWorkouts.reduce((sum, w) =>
      sum + w.exerciseLogs.reduce((s, e) =>
        s + e.sets.reduce((sv, set) => sv + (set.weight || 0) * (set.reps || 0), 0), 0), 0);
    return { date, workouts: dayWorkouts.length, totalSets, totalVolume };
  });

  return res.json(stats);
});
