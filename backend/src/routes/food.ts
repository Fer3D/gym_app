import { Router, Request, Response } from 'express';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { foodCache } from '../lib/cache';

export const foodRouter = Router();

const OFF_BASE = 'https://world.openfoodfacts.org';
const BATCH_SIZE = 6; // cuántos productos enviar por lote SSE

/** Helper: envía un evento SSE */
function sendSSE(res: Response, data: unknown) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ─── Búsqueda progresiva vía Server-Sent Events ─────────────────────────────
// El cliente recibe lotes de BATCH_SIZE productos mientras se van procesando.
// Si el resultado está en caché, responde en <10ms.
foodRouter.get('/search/stream', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  const page = parseInt(String(req.query.page || '1'));
  const force = req.query.force === 'true'; // forzar refresco de caché

  if (!q) {
    res.status(400).json({ error: 'Término requerido' });
    return;
  }

  // Cabeceras SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // desactivar buffering en nginx
  res.flushHeaders();

  const cacheKey = `search:${q.toLowerCase()}:${page}`;

  // ── Caché HIT → respuesta instantánea ──────────────────────────────────────
  if (!force && foodCache.has(cacheKey)) {
    const cached = foodCache.get(cacheKey) as unknown[];
    const ttl = foodCache.ttlSeconds(cacheKey);
    for (let i = 0; i < cached.length; i += BATCH_SIZE) {
      sendSSE(res, {
        products: cached.slice(i, i + BATCH_SIZE),
        cached: true,
        ttlSeconds: ttl,
        done: i + BATCH_SIZE >= cached.length,
        total: cached.length,
      });
    }
    res.end();
    return;
  }

  // ── Caché MISS → petición a OpenFoodFacts ──────────────────────────────────
  try {
    if (force) foodCache.delete(cacheKey);

    const response = await axios.get(`${OFF_BASE}/cgi/search.pl`, {
      params: {
        search_terms: q,
        search_simple: 1,
        action: 'process',
        json: 1,
        page,
        page_size: 24,
        lc: 'es',
        fields: 'id,product_name,product_name_es,brands,image_small_url,nutriments,serving_size',
        sort_by: 'popularity_key',
      },
      headers: { 'User-Agent': 'FitTrackES/1.0 (fittrack.es)' },
      timeout: 15000,
    });

    const all: unknown[] = (response.data.products || [])
      .map(formatProduct)
      .filter(Boolean);

    // Guardar en caché antes de enviar
    foodCache.set(cacheKey, all);

    // Enviar por lotes para la sensación de "progresivo"
    if (all.length === 0) {
      sendSSE(res, { products: [], cached: false, done: true, total: 0 });
    } else {
      for (let i = 0; i < all.length; i += BATCH_SIZE) {
        sendSSE(res, {
          products: all.slice(i, i + BATCH_SIZE),
          cached: false,
          ttlSeconds: 30 * 60,
          done: i + BATCH_SIZE >= all.length,
          total: all.length,
        });
      }
    }
  } catch (err) {
    sendSSE(res, { error: 'Error al buscar alimentos', done: true });
  } finally {
    res.end();
  }
});

// ─── Búsqueda clásica (no SSE, compatibilidad) ──────────────────────────────
foodRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, page = 1, pageSize = 24 } = req.query;
    if (!q) return res.status(400).json({ error: 'Término de búsqueda requerido' });

    const cacheKey = `search:${String(q).toLowerCase()}:${page}`;
    if (foodCache.has(cacheKey)) {
      const cached = foodCache.get(cacheKey) as unknown[];
      res.setHeader('X-Cache', 'HIT');
      return res.json({ products: cached, total: cached.length, cached: true });
    }

    const response = await axios.get(`${OFF_BASE}/cgi/search.pl`, {
      params: {
        search_terms: q, search_simple: 1, action: 'process', json: 1,
        page, page_size: pageSize, lc: 'es',
        fields: 'id,product_name,product_name_es,brands,image_small_url,nutriments,serving_size',
        sort_by: 'popularity_key',
      },
      headers: { 'User-Agent': 'FitTrackES/1.0 (fittrack.es)' },
      timeout: 15000,
    });

    const products = (response.data.products || []).map(formatProduct).filter(Boolean);
    foodCache.set(cacheKey, products);
    res.setHeader('X-Cache', 'MISS');
    return res.json({ products, total: response.data.count || products.length });
  } catch (error) {
    console.error('Error buscando alimentos:', error);
    return res.status(500).json({ error: 'Error al buscar alimentos' });
  }
});

// ─── Invalidar caché manualmente ────────────────────────────────────────────
foodRouter.delete('/cache', (_req: Request, res: Response) => {
  const deleted = foodCache.deleteByPrefix('search:');
  return res.json({ ok: true, deleted, message: `${deleted} entradas eliminadas de la caché` });
});

// ─── Estado de la caché ──────────────────────────────────────────────────────
foodRouter.get('/cache/stats', (_req: Request, res: Response) => {
  return res.json(foodCache.stats());
});

// Obtener alimento por barcode o ID
foodRouter.get('/barcode/:code', async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    const cacheKey = `barcode:${code}`;
    if (foodCache.has(cacheKey)) return res.json(foodCache.get(cacheKey));

    const response = await axios.get(`${OFF_BASE}/api/v2/product/${code}.json`, {
      headers: { 'User-Agent': 'FitTrackES/1.0 (fittrack.es)' },
      timeout: 8000,
    });
    if (response.data.status === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    const product = formatProduct(response.data.product);
    if (product) foodCache.set(cacheKey, [product] as unknown[], 60 * 60 * 1000); // 1h
    return res.json(product);
  } catch {
    return res.status(500).json({ error: 'Error al obtener el producto' });
  }
});

// Alimentos populares en España
foodRouter.get('/popular', async (req: Request, res: Response) => {
  try {
    const category = String(req.query.category || 'en:meals');
    const cacheKey = `popular:${category}`;
    if (foodCache.has(cacheKey)) {
      return res.json({ products: foodCache.get(cacheKey), cached: true });
    }

    const response = await axios.get(`${OFF_BASE}/cgi/search.pl`, {
      params: {
        action: 'process', json: 1, page_size: 50, lc: 'es',
        fields: 'id,product_name,product_name_es,brands,image_small_url,nutriments,serving_size',
        sort_by: 'popularity_key',
        tagtype_0: 'categories', tag_contains_0: 'contains', tag_0: category,
        countries_tags: 'es:espana',
      },
      headers: { 'User-Agent': 'FitTrackES/1.0 (fittrack.es)' },
      timeout: 10000,
    });
    const products = (response.data.products || []).map(formatProduct).filter(Boolean);
    foodCache.set(cacheKey, products, 60 * 60 * 1000); // 1h
    return res.json({ products });
  } catch {
    return res.status(500).json({ error: 'Error al obtener alimentos populares' });
  }
});

// Comidas personalizadas
foodRouter.get('/custom', async (_req: Request, res: Response) => {
  const foods = await prisma.customFood.findMany({ where: { userId: 1 }, orderBy: { createdAt: 'desc' } });
  return res.json(foods);
});

foodRouter.post('/custom', async (req: Request, res: Response) => {
  try {
    const food = await prisma.customFood.create({ data: { ...req.body, userId: 1 } });
    return res.json(food);
  } catch {
    return res.status(500).json({ error: 'Error al crear alimento personalizado' });
  }
});

foodRouter.delete('/custom/:id', async (req: Request, res: Response) => {
  await prisma.customFood.delete({ where: { id: parseInt(String(req.params.id)) } });
  return res.json({ success: true });
});

function formatProduct(p: Record<string, unknown>) {
  if (!p) return null;
  const n = (p.nutriments || {}) as Record<string, number>;
  const name = (p.product_name_es || p.product_name || '') as string;
  if (!name.trim()) return null;
  const kcal = n['energy-kcal_100g'] || n['energy-kcal'] || (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0);
  if (!kcal) return null;
  return {
    id: p._id || p.id,
    name: name.trim(),
    brand: (p.brands as string) || '',
    imageUrl: (p.image_small_url as string) || null,
    servingSize: parseFloat(p.serving_size as string) || 100,
    per100g: {
      calories: Math.round(kcal),
      proteins: Math.round((n.proteins_100g || 0) * 10) / 10,
      carbs: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
      fats: Math.round((n.fat_100g || 0) * 10) / 10,
      fiber: Math.round((n.fiber_100g || 0) * 10) / 10,
      sugar: Math.round((n.sugars_100g || 0) * 10) / 10,
      sodium: Math.round((n.sodium_100g || 0) * 1000) / 10,
    },
  };
}
