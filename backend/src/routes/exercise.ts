import { Router, Request, Response } from 'express';
import axios from 'axios';
import { exerciseCache } from '../lib/cache';

export const exerciseRouter = Router();

const WGER_BASE = 'https://wger.de/api/v2';

function isExercisePhoto(url: string): boolean {
  return /\/media\/exercise-images\//i.test(url);
}

function pickImages(data: any): string[] {
  const rows = Array.isArray(data.images) ? [...data.images] : [];
  rows.sort((a: any, b: any) => Number(Boolean(b?.is_main)) - Number(Boolean(a?.is_main)));

  return rows
    .map((img: any) => img.image || img.thumbnails?.medium || img.thumbnails?.small)
    .filter((u: unknown): u is string => typeof u === 'string' && isExercisePhoto(u));
}

export async function resolveExerciseImage(exerciseId: string): Promise<string | null> {
  const id = String(exerciseId).trim();
  if (!/^\d+$/.test(id)) return null;

  const cacheKey = `img:${id}`;
  const cached = exerciseCache.get(cacheKey) as unknown as string | null | undefined;
  if (cached !== undefined) {
    if (cached === null || isExercisePhoto(cached)) return cached;
    exerciseCache.delete(cacheKey);
  }

  try {
    const infoRes = await axios.get(`${WGER_BASE}/exerciseinfo/${id}/?format=json`, { timeout: 5000 });
    const url = pickImages(infoRes.data)[0] || null;
    exerciseCache.set(cacheKey, url as unknown as unknown[]);
    return url;
  } catch {
    exerciseCache.set(cacheKey, null as unknown as unknown[]);
    return null;
  }
}

async function getSearchIndex(): Promise<ReturnType<typeof formatExercise>[]> {
  const cacheKey = 'search-index';
  const cached = exerciseCache.get(cacheKey) as unknown as ReturnType<typeof formatExercise>[] | undefined;
  if (cached) return cached;

  const offsets = [0, 50, 100, 150, 200, 250];
  const pages = await Promise.all(
    offsets.map((offset) =>
      axios.get(`${WGER_BASE}/exerciseinfo/`, {
        params: { format: 'json', limit: 50, offset },
        timeout: 12000,
      })
    )
  );

  const exercises = pages
    .flatMap((p) => (p.data.results || []).map(formatExercise))
    .filter(Boolean) as ReturnType<typeof formatExercise>[];

  exerciseCache.set(cacheKey, exercises as unknown as unknown[]);
  return exercises;
}

exerciseRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, category, muscle, equipment, page = 1 } = req.query;

    if (q && String(q).trim().length > 1) {
      const term = String(q).trim().toLowerCase();
      const index = await getSearchIndex();
      const exercises = index
        .filter((ex) => {
          const name = (ex?.name || '').toLowerCase();
          const cat = (ex?.category || '').toLowerCase();
          return name.includes(term) || cat.includes(term);
        })
        .slice(0, 30);
      return res.json({ exercises, count: exercises.length });
    }

    const params: any = {
      format: 'json',
      language: 2,
      limit: 50,
      offset: (parseInt(page as string) - 1) * 50,
    };

    if (category) params.category = category;
    if (muscle) params.muscles = muscle;
    if (equipment) params.equipment = equipment;

    const response = await axios.get(`${WGER_BASE}/exercise/`, { params, timeout: 8000 });

    const exercisesWithInfo = await Promise.all(
      (response.data.results || []).map(async (ex: any) => {
        try {
          const infoRes = await axios.get(`${WGER_BASE}/exerciseinfo/${ex.id}/?format=json`, { timeout: 5000 });
          return formatExercise(infoRes.data);
        } catch {
          return formatExerciseBasic(ex);
        }
      })
    );

    return res.json({ exercises: exercisesWithInfo.filter(Boolean), count: response.data.count });
  } catch (error) {
    console.error('Error buscando ejercicios:', error);
    return res.status(500).json({ error: 'Error al buscar ejercicios' });
  }
});

exerciseRouter.get('/list', async (req: Request, res: Response) => {
  try {
    const { page = 1, category, muscle, equipment } = req.query;
    const limit = 20;
    const offset = (parseInt(page as string) - 1) * limit;

    const cacheKey = `list:${page}:${category || ''}:${muscle || ''}:${equipment || ''}`;
    if (exerciseCache.has(cacheKey)) {
      const cached = exerciseCache.get(cacheKey) as unknown as Record<string, unknown>;
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const params: Record<string, unknown> = { format: 'json', limit, offset };
    if (category) params.category = category;
    if (muscle) params.muscles = muscle;
    if (equipment) params.equipment = equipment;

    const response = await axios.get(`${WGER_BASE}/exerciseinfo/`, { params, timeout: 10000 });
    const exercises = (response.data.results || []).map(formatExercise).filter(Boolean);

    const result = { exercises, count: response.data.count, pages: Math.ceil(response.data.count / limit) };
    exerciseCache.set(cacheKey, result as unknown as unknown[]);
    return res.json(result);
  } catch (error) {
    console.error('Error listando ejercicios:', error);
    return res.status(500).json({ error: 'Error al listar ejercicios' });
  }
});

exerciseRouter.get('/meta/categories', async (_req: Request, res: Response) => {
  try {
    const response = await axios.get(`${WGER_BASE}/exercisecategory/?format=json&limit=100`, { timeout: 8000 });
    return res.json(response.data.results || []);
  } catch {
    return res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

function formatExercise(data: any) {
  if (!data) return null;

  const translations = data.translations || [];
  const esTranslation = translations.find((t: any) => t.language === 4);
  const enTranslation = translations.find((t: any) => t.language === 2);
  const translation = esTranslation || enTranslation || translations[0] || {};

  const name = translation.name || data.name || `Ejercicio ${data.id}`;

  return {
    id: data.id,
    name,
    description: stripHtml(translation.description || ''),
    category: data.category?.name || 'Sin categoría',
    categoryId: data.category?.id,
    muscles: (data.muscles || []).map((m: any) => ({ id: m.id, name: muscleNameES(m.name_en || m.name) })),
    musclesSecondary: (data.muscles_secondary || []).map((m: any) => ({ id: m.id, name: muscleNameES(m.name_en || m.name) })),
    equipment: (data.equipment || []).map((e: any) => ({ id: e.id, name: equipmentNameES(e.name) })),
    images: pickImages(data),
  };
}

function formatExerciseBasic(data: any) {
  return { id: data.id, name: `Ejercicio ${data.id}`, category: '', muscles: [], equipment: [], images: [] as string[] };
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

const MUSCLE_ES: Record<string, string> = {
  'Biceps brachii': 'Bíceps', 'Anterior deltoid': 'Deltoides anterior', 'Serratus anterior': 'Serrato anterior',
  'Pectoralis major': 'Pectoral mayor', 'Rectus abdominis': 'Abdominales', 'Brachialis': 'Braquial',
  'Latissimus dorsi': 'Dorsal ancho', 'Triceps brachii': 'Tríceps', 'Quadriceps femoris': 'Cuádriceps',
  'Gastrocnemius': 'Gemelos', 'Soleus': 'Sóleo', 'Gluteus maximus': 'Glúteo mayor',
  'Biceps femoris': 'Isquiotibiales', 'Trapezius': 'Trapecio', 'Deltoid': 'Deltoides',
  'Rhomboids': 'Romboides', 'Erector spinae': 'Erector espinal', 'Iliopsoas': 'Iliopsoas',
  'Obliquus externus abdominis': 'Oblicuos externos', 'Wrist extensors': 'Extensores de muñeca',
  'Wrist flexors': 'Flexores de muñeca', 'Tibialis anterior': 'Tibial anterior',
};

function muscleNameES(name: string) {
  return MUSCLE_ES[name] || name;
}

const EQUIP_ES: Record<string, string> = {
  'Barbell': 'Barra olímpica', 'Dumbbell': 'Mancuernas', 'Kettlebell': 'Kettlebell',
  'Cable': 'Cable/Polea', 'Bench': 'Banco', 'Pull-up bar': 'Barra dominadas',
  'Body weight': 'Peso corporal', 'Machine': 'Máquina', 'Resistance band': 'Banda elástica',
  'Foam roll': 'Foam roller', 'Plate': 'Disco', 'Ez bar': 'Barra EZ',
  'Incline bench': 'Banco inclinado', 'Hammer': 'Martillo', 'Gym mat': 'Esterilla',
  'Swiss ball': 'Balón suizo', 'TRX': 'TRX', 'None': 'Sin equipamiento',
};

function equipmentNameES(name: string) {
  return EQUIP_ES[name] || name;
}
