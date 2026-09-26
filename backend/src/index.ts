import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
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
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: true, limit: '32kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones, espera un momento' },
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas escrituras, espera un momento' },
});

app.use('/api/', apiLimiter);
app.use('/api/', (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  return writeLimiter(req, res, next);
});

app.use('/api/foods', foodRouter);
app.use('/api/exercises', exerciseRouter);
app.use('/api/nutrition', nutritionRouter);
app.use('/api/workouts', workoutRouter);
app.use('/api/routines', routineRouter);
app.use('/api/user', userRouter);
app.use('/api/calendar', calendarRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'FitTrack API funcionando correctamente', timestamp: new Date().toISOString() });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Error interno' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
