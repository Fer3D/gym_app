import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { foodRouter } from './routes/food';
import { exerciseRouter } from './routes/exercise';
import { nutritionRouter } from './routes/nutrition';
import { workoutRouter } from './routes/workout';
import { routineRouter } from './routes/routine';
import { userRouter } from './routes/user';
import { calendarRouter } from './routes/calendar';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/foods', foodRouter);
app.use('/api/exercises', exerciseRouter);
app.use('/api/nutrition', nutritionRouter);
app.use('/api/workouts', workoutRouter);
app.use('/api/routines', routineRouter);
app.use('/api/user', userRouter);
app.use('/api/calendar', calendarRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'FitTrack ES API funcionando correctamente', timestamp: new Date().toISOString() });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Error interno' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
