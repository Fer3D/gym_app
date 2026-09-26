import { Router, Request, Response } from 'express';
import axios from 'axios';
import { exerciseCache } from '../lib/cache';

export const exerciseRouter = Router();

const WGER_BASE = 'https://wger.de/api/v2';

exerciseRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, category, muscle, equipment, page = 1 } = req.query;

    const params: any = {
      format: 'json',
      language: 2,
      limit: 50,
      offset: (parseInt(page as string) - 1) * 50,
    };

    if (category) params.category = category;
    if (muscle) params.muscles = muscle;
    if (equipment) params.equipment = equipment;

    let url = `${WGER_BASE}/exercise/`;
    if (q) {
      url = `${WGER_BASE}/exercise/search/?term=${encodeURIComponent(q as string)}&language=es&format=json&language=es`;
      const searchResponse = await axios.get(url, { timeout: 8000 });
      const suggestions = searchResponse.data?.suggestions || [];

      const exercises = suggestions.slice(0, 30).map((s: any) => ({
        id: s.data?.id ?? s.id,
        name: s.value || s.data?.name || `Ejercicio`,
        description: '',
        category: s.data?.category || '',
        muscles: [],
        musclesSecondary: [],
        equipment: [],
        images: [],
      }));
      return res.json({ exercises, count: exercises.length });
    }

    const response = await axios.get(url, { params, timeout: 8000 });

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
    images: (data.images || []).map((img: any) => img.image),
  };
}

function formatExerciseBasic(data: any) {
  return { id: data.id, name: `Ejercicio ${data.id}`, category: '', muscles: [], equipment: [] };
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
