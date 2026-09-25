import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

export const userRouter = Router();

const GENDERS = new Set(['masculino', 'femenino', 'no_especificado']);
const OBJECTIVES = new Set(['perder_peso', 'mantener', 'ganar_musculo']);

type ParseResult =
  | { ok: true; value: number | null }
  | { ok: false };

function parseOptionalNumber(
  value: unknown,
  opts: { min: number; max: number; integer?: boolean; allowNull?: boolean },
): ParseResult {
  if (value === null || value === '') {
    return opts.allowNull === false ? { ok: false } : { ok: true, value: null };
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return { ok: false };
  if (opts.integer && !Number.isInteger(n)) return { ok: false };
  if (n < opts.min || n > opts.max) return { ok: false };
  return { ok: true, value: n };
}

function parseProfileUpdate(body: unknown): { data?: Prisma.UserUpdateInput; error?: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Cuerpo inválido' };
  }
  const raw = body as Record<string, unknown>;
  const data: Prisma.UserUpdateInput = {};

  if ('name' in raw) {
    if (typeof raw.name !== 'string') return { error: 'Nombre inválido' };
    const name = raw.name.trim();
    if (!name || name.length > 80) return { error: 'Nombre inválido' };
    data.name = name;
  }

  if ('weight' in raw) {
    const parsed = parseOptionalNumber(raw.weight, { min: 20, max: 400 });
    if (!parsed.ok) return { error: 'Peso inválido (20–400 kg)' };
    data.weight = parsed.value;
  }

  if ('height' in raw) {
    const parsed = parseOptionalNumber(raw.height, { min: 80, max: 250 });
    if (!parsed.ok) return { error: 'Altura inválida (80–250 cm)' };
    data.height = parsed.value;
  }

  if ('birthDate' in raw) {
    if (raw.birthDate === null || raw.birthDate === '') {
      data.birthDate = null;
    } else {
      const d = new Date(String(raw.birthDate));
      if (Number.isNaN(d.getTime())) return { error: 'Fecha de nacimiento inválida' };
      const year = d.getFullYear();
      if (year < 1920 || year > new Date().getFullYear() - 10) {
        return { error: 'Fecha de nacimiento fuera de rango' };
      }
      data.birthDate = d;
    }
  }

  if ('gender' in raw) {
    if (typeof raw.gender !== 'string' || !GENDERS.has(raw.gender)) {
      return { error: 'Sexo biológico inválido' };
    }
    data.gender = raw.gender;
  }

  if ('objective' in raw) {
    if (typeof raw.objective !== 'string' || !OBJECTIVES.has(raw.objective)) {
      return { error: 'Objetivo inválido' };
    }
    data.objective = raw.objective;
  }

  if ('calorieGoal' in raw) {
    const parsed = parseOptionalNumber(raw.calorieGoal, { min: 800, max: 10000, integer: true, allowNull: false });
    if (!parsed.ok || parsed.value === null) return { error: 'Calorías objetivo inválidas (800–10000)' };
    data.calorieGoal = parsed.value;
  }

  if ('proteinGoal' in raw) {
    const parsed = parseOptionalNumber(raw.proteinGoal, { min: 20, max: 500, allowNull: false });
    if (!parsed.ok || parsed.value === null) return { error: 'Proteína objetivo inválida (20–500 g)' };
    data.proteinGoal = parsed.value;
  }

  if ('carbsGoal' in raw) {
    const parsed = parseOptionalNumber(raw.carbsGoal, { min: 20, max: 1000, allowNull: false });
    if (!parsed.ok || parsed.value === null) return { error: 'Carbohidratos objetivo inválidos (20–1000 g)' };
    data.carbsGoal = parsed.value;
  }

  if ('fatsGoal' in raw) {
    const parsed = parseOptionalNumber(raw.fatsGoal, { min: 10, max: 400, allowNull: false });
    if (!parsed.ok || parsed.value === null) return { error: 'Grasas objetivo inválidas (10–400 g)' };
    data.fatsGoal = parsed.value;
  }

  if (Object.keys(data).length === 0) {
    return { error: 'Sin campos válidos para actualizar' };
  }

  return { data };
}

userRouter.get('/profile', async (_req: Request, res: Response) => {
  let user = await prisma.user.findFirst({ where: { id: 1 } });
  if (!user) {
    user = await prisma.user.create({
      data: { id: 1, name: 'Usuario', email: 'user@fittrack.es' },
    });
  }
  return res.json(user);
});

userRouter.put('/profile', async (req: Request, res: Response) => {
  try {
    const parsed = parseProfileUpdate(req.body);
    if (parsed.error || !parsed.data) {
      return res.status(400).json({ error: parsed.error || 'Datos inválidos' });
    }

    let user = await prisma.user.findFirst({ where: { id: 1 } });
    if (!user) {
      user = await prisma.user.create({ data: { id: 1, name: 'Usuario', email: 'user@fittrack.es' } });
    }

    const updated = await prisma.user.update({ where: { id: 1 }, data: parsed.data });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

userRouter.get('/tdee', async (_req: Request, res: Response) => {
  const user = await prisma.user.findFirst({ where: { id: 1 } });
  if (!user || !user.weight || !user.height) {
    return res.json({ bmr: 0, tdee: 0, goal: 0 });
  }

  const age = user.birthDate
    ? Math.floor((Date.now() - new Date(user.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 30;

  let bmr = 10 * user.weight + 6.25 * user.height - 5 * age;
  if (user.gender === 'masculino') bmr += 5;
  else bmr -= 161;

  const tdee = Math.round(bmr * 1.55);

  let goal = tdee;
  if (user.objective === 'perder_peso') goal = tdee - 500;
  else if (user.objective === 'ganar_musculo') goal = tdee + 300;

  return res.json({ bmr: Math.round(bmr), tdee, goal });
});
