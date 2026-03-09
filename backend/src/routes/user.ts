import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const userRouter = Router();

// Obtener perfil de usuario (solo hay 1 usuario)
userRouter.get('/profile', async (_req: Request, res: Response) => {
  let user = await prisma.user.findFirst({ where: { id: 1 } });
  if (!user) {
    user = await prisma.user.create({
      data: { id: 1, name: 'Usuario', email: 'user@fittrack.es' },
    });
  }
  return res.json(user);
});

// Actualizar perfil
userRouter.put('/profile', async (req: Request, res: Response) => {
  try {
    let user = await prisma.user.findFirst({ where: { id: 1 } });
    if (!user) {
      user = await prisma.user.create({ data: { id: 1, name: 'Usuario', email: 'user@fittrack.es' } });
    }
    const updated = await prisma.user.update({ where: { id: 1 }, data: req.body });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// Calcular TDEE (Total Daily Energy Expenditure)
userRouter.get('/tdee', async (_req: Request, res: Response) => {
  const user = await prisma.user.findFirst({ where: { id: 1 } });
  if (!user || !user.weight || !user.height) {
    return res.json({ bmr: 0, tdee: 0, goal: 0 });
  }

  const age = user.birthDate
    ? Math.floor((Date.now() - new Date(user.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 30;

  // Fórmula Mifflin-St Jeor
  let bmr = 10 * user.weight + 6.25 * user.height - 5 * age;
  if (user.gender === 'masculino') bmr += 5;
  else bmr -= 161;

  // Actividad moderada (1.55)
  const tdee = Math.round(bmr * 1.55);

  let goal = tdee;
  if (user.objective === 'perder_peso') goal = tdee - 500;
  else if (user.objective === 'ganar_musculo') goal = tdee + 300;

  return res.json({ bmr: Math.round(bmr), tdee, goal });
});
