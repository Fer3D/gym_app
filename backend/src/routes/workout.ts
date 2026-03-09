import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const workoutRouter = Router();

// Obtener entrenamientos del día
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

// Crear entrenamiento
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

// Actualizar entrenamiento
workoutRouter.put('/:id', async (req: Request, res: Response) => {
  const updated = await prisma.workoutLog.update({
    where: { id: parseInt(String(req.params.id)) },
    data: req.body,
    include: { exerciseLogs: { include: { sets: true } } },
  });
  return res.json(updated);
});

// Eliminar entrenamiento
workoutRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.workoutLog.delete({ where: { id: parseInt(String(req.params.id)) } });
  return res.json({ success: true });
});

// Agregar ejercicio al entrenamiento
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

// Eliminar ejercicio del entrenamiento
workoutRouter.delete('/exercise/:id', async (req: Request, res: Response) => {
  await prisma.exerciseLog.delete({ where: { id: parseInt(String(req.params.id)) } });
  return res.json({ success: true });
});

// Agregar serie a ejercicio
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

// Actualizar serie
workoutRouter.put('/set/:id', async (req: Request, res: Response) => {
  const updated = await prisma.exerciseSet.update({
    where: { id: parseInt(String(req.params.id)) },
    data: req.body,
  });
  return res.json(updated);
});

// Eliminar serie
workoutRouter.delete('/set/:id', async (req: Request, res: Response) => {
  await prisma.exerciseSet.delete({ where: { id: parseInt(String(req.params.id)) } });
  return res.json({ success: true });
});

// Estadísticas de un ejercicio específico (progresión)
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

// Resumen de entrenamientos por semana
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
