import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { resolveExerciseImage } from './exercise';

export const workoutRouter = Router();

const SET_TYPES = new Set(['warmup', 'normal', 'failure', 'drop']);
const REP_MODES = new Set(['reps', 'range']);

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

  await Promise.all(
    workouts.flatMap((w) =>
      w.exerciseLogs.map(async (ex) => {
        const badStored =
          !!ex.imageUrl && !/\/media\/exercise-images\//i.test(ex.imageUrl);
        if (ex.imageUrl && !badStored) return;

        const imageUrl = await resolveExerciseImage(ex.exerciseId);
        if (imageUrl) {
          await prisma.exerciseLog.update({
            where: { id: ex.id },
            data: { imageUrl: imageUrl.slice(0, 500) },
          });
          ex.imageUrl = imageUrl.slice(0, 500);
          return;
        }

        if (badStored) {
          await prisma.exerciseLog.update({
            where: { id: ex.id },
            data: { imageUrl: null },
          });
          ex.imageUrl = null;
        }
      })
    )
  );

  return res.json(workouts);
});

workoutRouter.get('/exercise-history/:exerciseId', async (req: Request, res: Response) => {
  const exerciseId = String(req.params.exerciseId);
  const sets = await prisma.exerciseSet.findMany({
    where: {
      weight: { gt: 0 },
      completed: true,
      exerciseLog: { exerciseId, workoutLog: { userId: 1 } },
    },
    orderBy: { id: 'desc' },
    take: 30,
    select: { weight: true, reps: true, setType: true },
  });
  return res.json(sets);
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

workoutRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.workoutLog.delete({ where: { id: parseInt(String(req.params.id)) } });
  return res.json({ success: true });
});

workoutRouter.post('/:workoutId/exercise', async (req: Request, res: Response) => {
  try {
    const { exerciseId, exerciseName, muscleGroup, category, notes, order, restSeconds, repMode, imageUrl } = req.body;
    const exercise = await prisma.exerciseLog.create({
      data: {
        workoutLogId: parseInt(String(req.params.workoutId)),
        exerciseId: String(exerciseId),
        exerciseName,
        muscleGroup: muscleGroup || null,
        category: category || null,
        imageUrl: typeof imageUrl === 'string' && imageUrl.length > 0 ? imageUrl.slice(0, 500) : null,
        notes: notes || null,
        restSeconds: typeof restSeconds === 'number' ? restSeconds : 120,
        repMode: REP_MODES.has(repMode) ? repMode : 'reps',
        order: order || 0,
      },
      include: { sets: true },
    });
    return res.json(exercise);
  } catch {
    return res.status(500).json({ error: 'Error al agregar ejercicio' });
  }
});

workoutRouter.put('/exercise/:id', async (req: Request, res: Response) => {
  const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
  const data: {
    notes?: string | null;
    restSeconds?: number | null;
    repMode?: string;
  } = {};

  if ('notes' in body) {
    if (body.notes === null || body.notes === '') data.notes = null;
    else if (typeof body.notes === 'string' && body.notes.length <= 500) data.notes = body.notes;
    else return res.status(400).json({ error: 'notes inválida' });
  }
  if ('restSeconds' in body) {
    const n = intOrNull(body.restSeconds, 0, 3600);
    if (Number.isNaN(n as number)) return res.status(400).json({ error: 'restSeconds inválido' });
    data.restSeconds = n;
  }
  if ('repMode' in body) {
    if (typeof body.repMode !== 'string' || !REP_MODES.has(body.repMode)) {
      return res.status(400).json({ error: 'repMode inválido' });
    }
    data.repMode = body.repMode;
  }
  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Sin campos válidos' });

  const updated = await prisma.exerciseLog.update({
    where: { id: parseInt(String(req.params.id)) },
    data,
    include: { sets: { orderBy: { setNumber: 'asc' } } },
  });
  return res.json(updated);
});

workoutRouter.delete('/exercise/:id', async (req: Request, res: Response) => {
  await prisma.exerciseLog.delete({ where: { id: parseInt(String(req.params.id)) } });
  return res.json({ success: true });
});

workoutRouter.post('/exercise/:exerciseId/set', async (req: Request, res: Response) => {
  try {
    const { setNumber, reps, repsMin, repsMax, weight, duration, distance, restTime, rpe, setType } = req.body;
    if (setType != null && !SET_TYPES.has(String(setType))) {
      return res.status(400).json({ error: 'setType inválido' });
    }
    const set = await prisma.exerciseSet.create({
      data: {
        exerciseLogId: parseInt(String(req.params.exerciseId)),
        setNumber: setNumber || 1,
        setType: setType && SET_TYPES.has(String(setType)) ? String(setType) : 'normal',
        reps: reps != null && reps !== '' ? parseInt(reps) : null,
        repsMin: repsMin != null && repsMin !== '' ? parseInt(repsMin) : null,
        repsMax: repsMax != null && repsMax !== '' ? parseInt(repsMax) : null,
        weight: weight != null && weight !== '' ? parseFloat(weight) : null,
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
  const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
  const data: {
    setNumber?: number;
    setType?: string;
    reps?: number | null;
    repsMin?: number | null;
    repsMax?: number | null;
    weight?: number | null;
    duration?: number | null;
    distance?: number | null;
    restTime?: number | null;
    completed?: boolean;
    rpe?: number | null;
  } = {};

  if ('setNumber' in body) {
    const n = intOrNull(body.setNumber, 1, 50);
    if (n === null || Number.isNaN(n)) return res.status(400).json({ error: 'setNumber inválido' });
    data.setNumber = n;
  }
  if ('setType' in body) {
    if (typeof body.setType !== 'string' || !SET_TYPES.has(body.setType)) {
      return res.status(400).json({ error: 'setType inválido' });
    }
    data.setType = body.setType;
  }
  if ('reps' in body) {
    const n = intOrNull(body.reps, 0, 1000);
    if (Number.isNaN(n as number)) return res.status(400).json({ error: 'reps inválidas' });
    data.reps = n;
  }
  if ('repsMin' in body) {
    const n = intOrNull(body.repsMin, 0, 1000);
    if (Number.isNaN(n as number)) return res.status(400).json({ error: 'repsMin inválidas' });
    data.repsMin = n;
  }
  if ('repsMax' in body) {
    const n = intOrNull(body.repsMax, 0, 1000);
    if (Number.isNaN(n as number)) return res.status(400).json({ error: 'repsMax inválidas' });
    data.repsMax = n;
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
