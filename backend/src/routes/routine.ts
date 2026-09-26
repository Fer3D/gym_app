import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const routineRouter = Router();

const EXPLORE_ROUTINES = [
  {
    id: 'ppl',
    name: 'Push Pull Legs (PPL)',
    description: 'Programa de 6 días dividido en Empuje, Tirón y Piernas. Clásico para ganar músculo y fuerza con alta frecuencia.',
    level: 'intermediate',
    daysPerWeek: 6,
    tags: ['fuerza', 'hipertrofia'],
    days: [
      {
        day: 1, dayName: 'Empuje A',
        exercises: [
          { name: 'Press de banca', category: 'Chest', muscleGroup: 'Pecho', sets: 4, reps: 8 },
          { name: 'Press de hombros con barra', category: 'Shoulders', muscleGroup: 'Hombros', sets: 4, reps: 8 },
          { name: 'Press inclinado con mancuernas', category: 'Chest', muscleGroup: 'Pecho', sets: 3, reps: 10 },
          { name: 'Extensión de tríceps en polea', category: 'Arms', muscleGroup: 'Tríceps', sets: 3, reps: 12 },
          { name: 'Elevaciones laterales', category: 'Shoulders', muscleGroup: 'Hombros', sets: 4, reps: 15 },
          { name: 'Fondos en paralelas', category: 'Arms', muscleGroup: 'Tríceps', sets: 3, reps: 12 },
        ],
      },
      {
        day: 2, dayName: 'Tirón A',
        exercises: [
          { name: 'Dominadas', category: 'Back', muscleGroup: 'Espalda', sets: 4, reps: 8 },
          { name: 'Remo con barra', category: 'Back', muscleGroup: 'Espalda', sets: 4, reps: 8 },
          { name: 'Curl de bíceps con barra', category: 'Arms', muscleGroup: 'Bíceps', sets: 4, reps: 10 },
          { name: 'Remo con mancuerna', category: 'Back', muscleGroup: 'Espalda', sets: 3, reps: 12 },
          { name: 'Face pull', category: 'Shoulders', muscleGroup: 'Hombros', sets: 3, reps: 15 },
          { name: 'Curl martillo', category: 'Arms', muscleGroup: 'Bíceps', sets: 3, reps: 12 },
        ],
      },
      {
        day: 3, dayName: 'Piernas A',
        exercises: [
          { name: 'Sentadilla', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 4, reps: 8 },
          { name: 'Peso muerto rumano', category: 'Legs', muscleGroup: 'Isquiotibiales', sets: 4, reps: 8 },
          { name: 'Prensa de piernas', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 3, reps: 12 },
          { name: 'Curl femoral acostado', category: 'Legs', muscleGroup: 'Isquiotibiales', sets: 3, reps: 12 },
          { name: 'Extensión de cuádriceps', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 3, reps: 15 },
          { name: 'Elevación de gemelos de pie', category: 'Calves', muscleGroup: 'Gemelos', sets: 4, reps: 15 },
        ],
      },
      {
        day: 4, dayName: 'Empuje B',
        exercises: [
          { name: 'Press inclinado con barra', category: 'Chest', muscleGroup: 'Pecho', sets: 4, reps: 8 },
          { name: 'Press militar', category: 'Shoulders', muscleGroup: 'Hombros', sets: 4, reps: 8 },
          { name: 'Aperturas en cable', category: 'Chest', muscleGroup: 'Pecho', sets: 3, reps: 12 },
          { name: 'Press francés', category: 'Arms', muscleGroup: 'Tríceps', sets: 3, reps: 10 },
          { name: 'Elevaciones laterales con cable', category: 'Shoulders', muscleGroup: 'Hombros', sets: 3, reps: 15 },
          { name: 'Patada de tríceps', category: 'Arms', muscleGroup: 'Tríceps', sets: 3, reps: 15 },
        ],
      },
      {
        day: 5, dayName: 'Tirón B',
        exercises: [
          { name: 'Peso muerto', category: 'Back', muscleGroup: 'Espalda', sets: 4, reps: 5 },
          { name: 'Jalón al pecho', category: 'Back', muscleGroup: 'Espalda', sets: 4, reps: 10 },
          { name: 'Remo en polea baja', category: 'Back', muscleGroup: 'Espalda', sets: 3, reps: 12 },
          { name: 'Curl concentrado', category: 'Arms', muscleGroup: 'Bíceps', sets: 3, reps: 12 },
          { name: 'Pull over con mancuerna', category: 'Back', muscleGroup: 'Espalda', sets: 3, reps: 12 },
          { name: 'Curl de bíceps en polea', category: 'Arms', muscleGroup: 'Bíceps', sets: 3, reps: 15 },
        ],
      },
      {
        day: 6, dayName: 'Piernas B',
        exercises: [
          { name: 'Sentadilla frontal', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 4, reps: 8 },
          { name: 'Hip thrust', category: 'Legs', muscleGroup: 'Glúteos', sets: 4, reps: 12 },
          { name: 'Zancadas', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 3, reps: 12 },
          { name: 'Curl femoral sentado', category: 'Legs', muscleGroup: 'Isquiotibiales', sets: 3, reps: 12 },
          { name: 'Sentadilla búlgara', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 3, reps: 10 },
          { name: 'Elevación de gemelos sentado', category: 'Calves', muscleGroup: 'Gemelos', sets: 4, reps: 20 },
        ],
      },
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body 3x',
    description: 'Entrena todo el cuerpo 3 veces por semana con patrones de movimiento fundamentales. Ideal para principiantes y personas con poco tiempo.',
    level: 'beginner',
    daysPerWeek: 3,
    tags: ['principiante', 'fuerza'],
    days: [
      {
        day: 1, dayName: 'Día A',
        exercises: [
          { name: 'Sentadilla', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 3, reps: 8 },
          { name: 'Press de banca', category: 'Chest', muscleGroup: 'Pecho', sets: 3, reps: 8 },
          { name: 'Remo con barra', category: 'Back', muscleGroup: 'Espalda', sets: 3, reps: 8 },
          { name: 'Press de hombros con barra', category: 'Shoulders', muscleGroup: 'Hombros', sets: 3, reps: 8 },
          { name: 'Curl de bíceps con barra', category: 'Arms', muscleGroup: 'Bíceps', sets: 3, reps: 10 },
          { name: 'Extensión de tríceps en polea', category: 'Arms', muscleGroup: 'Tríceps', sets: 3, reps: 10 },
        ],
      },
      {
        day: 2, dayName: 'Día B',
        exercises: [
          { name: 'Peso muerto', category: 'Back', muscleGroup: 'Espalda', sets: 3, reps: 6 },
          { name: 'Sentadilla frontal', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 3, reps: 8 },
          { name: 'Dominadas', category: 'Back', muscleGroup: 'Espalda', sets: 3, reps: 8 },
          { name: 'Press inclinado con mancuernas', category: 'Chest', muscleGroup: 'Pecho', sets: 3, reps: 10 },
          { name: 'Elevaciones laterales', category: 'Shoulders', muscleGroup: 'Hombros', sets: 3, reps: 12 },
          { name: 'Plancha', category: 'Abs', muscleGroup: 'Abdominales', sets: 3, reps: 60 },
        ],
      },
      {
        day: 3, dayName: 'Día C',
        exercises: [
          { name: 'Sentadilla', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 3, reps: 8 },
          { name: 'Press de banca', category: 'Chest', muscleGroup: 'Pecho', sets: 3, reps: 8 },
          { name: 'Peso muerto rumano', category: 'Legs', muscleGroup: 'Isquiotibiales', sets: 3, reps: 10 },
          { name: 'Remo en polea baja', category: 'Back', muscleGroup: 'Espalda', sets: 3, reps: 10 },
          { name: 'Fondos en paralelas', category: 'Arms', muscleGroup: 'Tríceps', sets: 3, reps: 10 },
          { name: 'Crunch abdominal', category: 'Abs', muscleGroup: 'Abdominales', sets: 3, reps: 15 },
        ],
      },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Superior / Inferior 4x',
    description: 'División superior-inferior durante 4 días. Equilibra volumen y recuperación para ganar fuerza e hipertrofia.',
    level: 'intermediate',
    daysPerWeek: 4,
    tags: ['fuerza', 'hipertrofia'],
    days: [
      {
        day: 1, dayName: 'Superior A',
        exercises: [
          { name: 'Press de banca', category: 'Chest', muscleGroup: 'Pecho', sets: 4, reps: 8 },
          { name: 'Remo con barra', category: 'Back', muscleGroup: 'Espalda', sets: 4, reps: 8 },
          { name: 'Press de hombros con barra', category: 'Shoulders', muscleGroup: 'Hombros', sets: 3, reps: 10 },
          { name: 'Jalón al pecho', category: 'Back', muscleGroup: 'Espalda', sets: 3, reps: 10 },
          { name: 'Curl de bíceps con barra', category: 'Arms', muscleGroup: 'Bíceps', sets: 3, reps: 12 },
          { name: 'Extensión de tríceps en polea', category: 'Arms', muscleGroup: 'Tríceps', sets: 3, reps: 12 },
        ],
      },
      {
        day: 2, dayName: 'Inferior A',
        exercises: [
          { name: 'Sentadilla', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 4, reps: 8 },
          { name: 'Peso muerto rumano', category: 'Legs', muscleGroup: 'Isquiotibiales', sets: 3, reps: 10 },
          { name: 'Prensa de piernas', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 3, reps: 12 },
          { name: 'Curl femoral acostado', category: 'Legs', muscleGroup: 'Isquiotibiales', sets: 3, reps: 12 },
          { name: 'Elevación de gemelos de pie', category: 'Calves', muscleGroup: 'Gemelos', sets: 4, reps: 15 },
          { name: 'Plancha', category: 'Abs', muscleGroup: 'Abdominales', sets: 3, reps: 60 },
        ],
      },
      {
        day: 3, dayName: 'Superior B',
        exercises: [
          { name: 'Press inclinado con barra', category: 'Chest', muscleGroup: 'Pecho', sets: 4, reps: 10 },
          { name: 'Dominadas', category: 'Back', muscleGroup: 'Espalda', sets: 4, reps: 8 },
          { name: 'Press militar', category: 'Shoulders', muscleGroup: 'Hombros', sets: 3, reps: 10 },
          { name: 'Remo con mancuerna', category: 'Back', muscleGroup: 'Espalda', sets: 3, reps: 12 },
          { name: 'Curl martillo', category: 'Arms', muscleGroup: 'Bíceps', sets: 3, reps: 12 },
          { name: 'Fondos en paralelas', category: 'Arms', muscleGroup: 'Tríceps', sets: 3, reps: 12 },
        ],
      },
      {
        day: 4, dayName: 'Inferior B',
        exercises: [
          { name: 'Peso muerto', category: 'Back', muscleGroup: 'Isquiotibiales', sets: 4, reps: 5 },
          { name: 'Sentadilla búlgara', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 3, reps: 10 },
          { name: 'Hip thrust', category: 'Legs', muscleGroup: 'Glúteos', sets: 4, reps: 12 },
          { name: 'Curl femoral sentado', category: 'Legs', muscleGroup: 'Isquiotibiales', sets: 3, reps: 12 },
          { name: 'Extensión de cuádriceps', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 3, reps: 15 },
          { name: 'Elevación de gemelos sentado', category: 'Calves', muscleGroup: 'Gemelos', sets: 4, reps: 20 },
        ],
      },
    ],
  },
  {
    id: 'bro-split',
    name: 'Bro Split 5x',
    description: 'Un grupo muscular por día durante 5 días. Enfocado en volumen y bomba muscular. Para intermediate-avanzado.',
    level: 'advanced',
    daysPerWeek: 5,
    tags: ['volumen', 'hipertrofia'],
    days: [
      {
        day: 1, dayName: 'Pecho',
        exercises: [
          { name: 'Press de banca', category: 'Chest', muscleGroup: 'Pecho', sets: 4, reps: 8 },
          { name: 'Press inclinado con mancuernas', category: 'Chest', muscleGroup: 'Pecho', sets: 4, reps: 10 },
          { name: 'Aperturas con mancuernas', category: 'Chest', muscleGroup: 'Pecho', sets: 3, reps: 12 },
          { name: 'Fondos en paralelas', category: 'Chest', muscleGroup: 'Pecho', sets: 3, reps: 12 },
          { name: 'Cruce de cables', category: 'Chest', muscleGroup: 'Pecho', sets: 3, reps: 15 },
          { name: 'Pull over con mancuerna', category: 'Chest', muscleGroup: 'Pecho', sets: 3, reps: 12 },
        ],
      },
      {
        day: 2, dayName: 'Espalda',
        exercises: [
          { name: 'Peso muerto', category: 'Back', muscleGroup: 'Espalda', sets: 4, reps: 5 },
          { name: 'Dominadas', category: 'Back', muscleGroup: 'Espalda', sets: 4, reps: 8 },
          { name: 'Remo con barra', category: 'Back', muscleGroup: 'Espalda', sets: 4, reps: 8 },
          { name: 'Jalón al pecho', category: 'Back', muscleGroup: 'Espalda', sets: 3, reps: 10 },
          { name: 'Remo en polea baja', category: 'Back', muscleGroup: 'Espalda', sets: 3, reps: 12 },
          { name: 'Remo con mancuerna', category: 'Back', muscleGroup: 'Espalda', sets: 3, reps: 12 },
        ],
      },
      {
        day: 3, dayName: 'Piernas',
        exercises: [
          { name: 'Sentadilla', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 4, reps: 8 },
          { name: 'Peso muerto rumano', category: 'Legs', muscleGroup: 'Isquiotibiales', sets: 4, reps: 10 },
          { name: 'Prensa de piernas', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 3, reps: 12 },
          { name: 'Hip thrust', category: 'Legs', muscleGroup: 'Glúteos', sets: 4, reps: 12 },
          { name: 'Curl femoral acostado', category: 'Legs', muscleGroup: 'Isquiotibiales', sets: 3, reps: 12 },
          { name: 'Elevación de gemelos de pie', category: 'Calves', muscleGroup: 'Gemelos', sets: 5, reps: 20 },
        ],
      },
      {
        day: 4, dayName: 'Hombros',
        exercises: [
          { name: 'Press militar', category: 'Shoulders', muscleGroup: 'Hombros', sets: 4, reps: 8 },
          { name: 'Elevaciones laterales', category: 'Shoulders', muscleGroup: 'Hombros', sets: 5, reps: 15 },
          { name: 'Press Arnold', category: 'Shoulders', muscleGroup: 'Hombros', sets: 3, reps: 10 },
          { name: 'Face pull', category: 'Shoulders', muscleGroup: 'Hombros', sets: 3, reps: 15 },
          { name: 'Elevaciones frontales', category: 'Shoulders', muscleGroup: 'Hombros', sets: 3, reps: 12 },
          { name: 'Encogimiento de trapecios', category: 'Shoulders', muscleGroup: 'Trapecios', sets: 3, reps: 15 },
        ],
      },
      {
        day: 5, dayName: 'Brazos',
        exercises: [
          { name: 'Curl de bíceps con barra', category: 'Arms', muscleGroup: 'Bíceps', sets: 4, reps: 10 },
          { name: 'Press francés', category: 'Arms', muscleGroup: 'Tríceps', sets: 4, reps: 10 },
          { name: 'Curl martillo', category: 'Arms', muscleGroup: 'Bíceps', sets: 3, reps: 12 },
          { name: 'Fondos en paralelas', category: 'Arms', muscleGroup: 'Tríceps', sets: 3, reps: 12 },
          { name: 'Curl concentrado', category: 'Arms', muscleGroup: 'Bíceps', sets: 3, reps: 12 },
          { name: 'Extensión de tríceps en polea', category: 'Arms', muscleGroup: 'Tríceps', sets: 3, reps: 15 },
        ],
      },
    ],
  },
  {
    id: 'cardio-strength',
    name: 'Cardio + Fuerza 3x',
    description: 'Combina ejercicios de fuerza funcional con cardio en circuito. Perfecto para perder grasa manteniendo músculo.',
    level: 'beginner',
    daysPerWeek: 3,
    tags: ['cardio', 'pérdida de grasa'],
    days: [
      {
        day: 1, dayName: 'Circuito A',
        exercises: [
          { name: 'Sentadilla con salto', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 3, reps: 15 },
          { name: 'Flexiones', category: 'Chest', muscleGroup: 'Pecho', sets: 3, reps: 15 },
          { name: 'Zancadas', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 3, reps: 12 },
          { name: 'Remo con mancuerna', category: 'Back', muscleGroup: 'Espalda', sets: 3, reps: 12 },
          { name: 'Plancha', category: 'Abs', muscleGroup: 'Abdominales', sets: 3, reps: 45 },
          { name: 'Burpees', category: 'Cardio', muscleGroup: 'Cuerpo completo', sets: 3, reps: 10 },
        ],
      },
      {
        day: 2, dayName: 'Circuito B',
        exercises: [
          { name: 'Peso muerto con mancuernas', category: 'Back', muscleGroup: 'Espalda', sets: 3, reps: 12 },
          { name: 'Press de hombros con mancuernas', category: 'Shoulders', muscleGroup: 'Hombros', sets: 3, reps: 12 },
          { name: 'Hip thrust', category: 'Legs', muscleGroup: 'Glúteos', sets: 3, reps: 15 },
          { name: 'Remo en TRX', category: 'Back', muscleGroup: 'Espalda', sets: 3, reps: 12 },
          { name: 'Crunch abdominal', category: 'Abs', muscleGroup: 'Abdominales', sets: 3, reps: 20 },
          { name: 'Mountain climbers', category: 'Cardio', muscleGroup: 'Cuerpo completo', sets: 3, reps: 30 },
        ],
      },
      {
        day: 3, dayName: 'Circuito C',
        exercises: [
          { name: 'Sentadilla con mancuernas', category: 'Legs', muscleGroup: 'Cuádriceps', sets: 3, reps: 15 },
          { name: 'Press de banca con mancuernas', category: 'Chest', muscleGroup: 'Pecho', sets: 3, reps: 12 },
          { name: 'Dominadas asistidas', category: 'Back', muscleGroup: 'Espalda', sets: 3, reps: 8 },
          { name: 'Extensión de cadera en máquina', category: 'Legs', muscleGroup: 'Glúteos', sets: 3, reps: 15 },
          { name: 'Plancha lateral', category: 'Abs', muscleGroup: 'Abdominales', sets: 3, reps: 30 },
          { name: 'Saltar a la comba', category: 'Cardio', muscleGroup: 'Gemelos', sets: 3, reps: 60 },
        ],
      },
    ],
  },
];

routineRouter.get('/explore', (_req: Request, res: Response) => {
  return res.json(EXPLORE_ROUTINES);
});

routineRouter.get('/', async (_req: Request, res: Response) => {
  const routines = await prisma.routine.findMany({
    where: { userId: 1 },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(routines.map((r) => ({
    ...r,
    days: JSON.parse(r.days),
  })));
});

routineRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, level, daysPerWeek, days, source, sourceId } = req.body;
    if (!name || !days) return res.status(400).json({ error: 'Nombre y días son obligatorios' });

    const routine = await prisma.routine.create({
      data: {
        userId: 1,
        name,
        description: description || null,
        level: level || 'intermediate',
        daysPerWeek: daysPerWeek || days.length,
        days: JSON.stringify(days),
        source: source || 'user',
        sourceId: sourceId || null,
      },
    });
    return res.json({ ...routine, days: JSON.parse(routine.days) });
  } catch {
    return res.status(500).json({ error: 'Error al guardar la rutina' });
  }
});

routineRouter.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const existing = await prisma.routine.findFirst({ where: { id, userId: 1 } });
  if (!existing) return res.status(404).json({ error: 'Rutina no encontrada' });

  await prisma.routine.delete({ where: { id } });
  return res.json({ success: true });
});

routineRouter.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const { date, dayIndex = 0 } = req.body;
    if (!date) return res.status(400).json({ error: 'Fecha requerida' });

    const routine = await prisma.routine.findUnique({
      where: { id: parseInt(String(req.params.id)) },
    });
    if (!routine) return res.status(404).json({ error: 'Rutina no encontrada' });

    const days: any[] = JSON.parse(routine.days);
    const selectedDay = days[dayIndex] || days[0];
    if (!selectedDay) return res.status(400).json({ error: 'Día no encontrado en la rutina' });

    const workout = await prisma.workoutLog.create({
      data: {
        date: String(date),
        userId: 1,
        name: `${routine.name} — ${selectedDay.dayName}`,
        notes: `Iniciado desde la rutina "${routine.name}"`,
      },
      include: { exerciseLogs: { include: { sets: true } } },
    });

    await Promise.all(
      (selectedDay.exercises || []).map((ex: any, i: number) =>
        prisma.exerciseLog.create({
          data: {
            workoutLogId: workout.id,
            exerciseId: String(ex.exerciseId || ex.name),
            exerciseName: ex.name,
            muscleGroup: ex.muscleGroup || null,
            category: ex.category || null,
            imageUrl: ex.imageUrl || null,
            order: i,
          },
        })
      )
    );

    const result = await prisma.workoutLog.findUnique({
      where: { id: workout.id },
      include: { exerciseLogs: { include: { sets: true }, orderBy: { order: 'asc' } } },
    });
    return res.json(result);
  } catch (err) {
    console.error('Error al iniciar rutina:', err);
    return res.status(500).json({ error: 'Error al iniciar el entrenamiento' });
  }
});

routineRouter.post('/explore/:id/start', async (req: Request, res: Response) => {
  try {
    const { date, dayIndex = 0 } = req.body;
    if (!date) return res.status(400).json({ error: 'Fecha requerida' });

    const routine = EXPLORE_ROUTINES.find((r) => r.id === String(req.params.id));
    if (!routine) return res.status(404).json({ error: 'Rutina no encontrada' });

    const selectedDay = routine.days[dayIndex] || routine.days[0];

    const workout = await prisma.workoutLog.create({
      data: {
        date: String(date),
        userId: 1,
        name: `${routine.name} — ${selectedDay.dayName}`,
        notes: `Iniciado desde "${routine.name}"`,
      },
      include: { exerciseLogs: { include: { sets: true } } },
    });

    await Promise.all(
      selectedDay.exercises.map((ex: any, i: number) =>
        prisma.exerciseLog.create({
          data: {
            workoutLogId: workout.id,
            exerciseId: String(ex.name),
            exerciseName: ex.name,
            muscleGroup: ex.muscleGroup || null,
            category: ex.category || null,
            imageUrl: ex.imageUrl || null,
            order: i,
          },
        })
      )
    );

    const result = await prisma.workoutLog.findUnique({
      where: { id: workout.id },
      include: { exerciseLogs: { include: { sets: true }, orderBy: { order: 'asc' } } },
    });
    return res.json(result);
  } catch (err) {
    console.error('Error al iniciar rutina curada:', err);
    return res.status(500).json({ error: 'Error al iniciar el entrenamiento' });
  }
});
