import { Router, Request, Response } from 'express';
import axios from 'axios';
import { foodCache } from '../lib/cache';

export const foodRouter = Router();

const OFF_HOSTS = [
  'https://world.openfoodfacts.org',
  'https://es.openfoodfacts.org',
];
const BATCH_SIZE = 6;
const OFF_UA = 'FitTrackES/1.0 (fittrack.es)';

const OFF_FIELDS =
  'code,product_name,product_name_es,brands,image_small_url,nutriments,serving_size,unique_scans_n,popularity_key,countries_tags,countries_tags_en,stores,stores_tags,lang,languages_tags';

const ES_BRAND_RE =
  /\b(hacendado|mercadona|dia|consum|eroski|alcampo|auchan|casa tarradellas|campofr[ií]o|gallina blanca|elpozo|maheso|anitin|carrefour|lidl|bovinos)\b/i;
const ES_STORE_RE =
  /\b(mercadona|dia|consum|eroski|alcampo|el corte|carrefour|lidl|bm\b|aldi|hipercor|supersol|caprabo)\b/i;
const FOREIGN_BRAND_RE =
  /\b(sodebo|picard|herta|croustipate|harrys|panzani|milbona|italpizza|deluxe|sch[aä]r)\b/i;

function sendSSE(res: Response, data: unknown) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function productMatchesQuery(p: Record<string, unknown>, q: string): boolean {
  const skip = new Set(['hacendado', 'mercadona', 'carrefour', 'dia', 'consum']);
  const tokens = q
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z0-9áéíóúñü]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !skip.has(t));
  if (tokens.length === 0) return true;
  const name = `${p.product_name_es || ''} ${p.product_name || ''} ${p.brands || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  return tokens.every((t) => name.includes(t));
}

function popularityScore(p: Record<string, unknown>): number {
  const scans = Number(p.unique_scans_n);
  if (Number.isFinite(scans) && scans > 0) return scans;
  const key = Number(p.popularity_key);
  if (Number.isFinite(key) && key > 0) return key % 1e6;
  return 0;
}

function countryList(p: Record<string, unknown>): string[] {
  const en = Array.isArray(p.countries_tags_en)
    ? p.countries_tags_en.map((c) => String(c).toLowerCase())
    : [];
  if (en.length) return en;
  const tags = Array.isArray(p.countries_tags)
    ? p.countries_tags.map((c) => String(c).toLowerCase())
    : [];
  return tags.map((t) => t.replace(/^en:/, '').replace(/^es:/, ''));
}

function isSpainProduct(p: Record<string, unknown>): boolean {
  const countries = countryList(p);
  return countries.some((c) => c === 'spain' || c === 'espana' || c === 'españa');
}

function spainRetailScore(p: Record<string, unknown>): number {
  if (!isSpainProduct(p)) return -1;

  const brands = String(p.brands || '');
  const stores = String(p.stores || '');
  const storeTags = Array.isArray(p.stores_tags) ? p.stores_tags.join(' ') : '';
  const storeBlob = `${stores} ${storeTags}`;
  const countries = countryList(p);
  const pop = Math.max(popularityScore(p), 1);

  let mult = 1;

  if (countries.length === 1) mult *= 12;
  else if (countries.length <= 3) mult *= 4;
  else if (countries.length <= 6) mult *= 1.5;
  else mult *= 0.6;

  if (ES_BRAND_RE.test(brands)) mult *= 8;
  if (/hacendado/i.test(brands)) mult *= 2;
  if (ES_STORE_RE.test(storeBlob)) mult *= 6;
  if (/mercadona/i.test(storeBlob)) mult *= 2;

  if (p.product_name_es) mult *= 1.8;
  const langs = Array.isArray(p.languages_tags) ? p.languages_tags.map(String) : [];
  if (langs.some((l) => l === 'es' || l === 'es:spanish' || l.endsWith(':es'))) mult *= 1.4;

  if (FOREIGN_BRAND_RE.test(brands)) {
    const onlyEsRetail = ES_BRAND_RE.test(brands) || /mercadona/i.test(storeBlob);
    if (!onlyEsRetail) mult *= 0.08;
  }

  return pop * mult;
}

async function offCgiSearch(
  params: Record<string, string | number>,
): Promise<Record<string, unknown>[]> {
  let lastError: unknown;
  for (const host of OFF_HOSTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await axios.get(`${host}/cgi/search.pl`, {
          params,
          headers: { 'User-Agent': OFF_UA },
          timeout: 15000,
          validateStatus: (s) => s >= 200 && s < 300,
        });
        return (response.data.products || []) as Record<string, unknown>[];
      } catch (err) {
        lastError = err;
        await sleep(400 * (attempt + 1));
      }
    }
  }
  throw lastError;
}

async function fetchOffSearch(q: string, page: number, pageSize = 24): Promise<unknown[]> {
  const baseParams = {
    search_simple: 1,
    action: 'process',
    json: 1,
    page: 1,
    page_size: 40,
    lc: 'es',
    fields: OFF_FIELDS,
  };

  const queries: Array<Record<string, string | number>> = [
    {
      ...baseParams,
      search_terms: q,
      tagtype_0: 'countries',
      tag_contains_0: 'contains',
      tag_0: 'en:spain',
      page,
      page_size: Math.min(Math.max(pageSize * 2, 40), 60),
    },
    { ...baseParams, search_terms: `${q} hacendado` },
    { ...baseParams, search_terms: `${q} mercadona` },
    { ...baseParams, search_terms: `${q} carrefour` },
  ];

  const byId = new Map<string, Record<string, unknown>>();
  let lastError: unknown;

  for (const params of queries) {
    try {
      const products = await offCgiSearch(params);
      for (const p of products) {
        if (!p) continue;
        const id = String(p.code || p._id || p.id || '');
        if (!id) continue;
        const prev = byId.get(id);
        if (!prev || spainRetailScore(p) > spainRetailScore(prev)) byId.set(id, p);
      }
      await sleep(200);
    } catch (err) {
      lastError = err;
    }
  }

  const merged = [...byId.values()]
    .filter((p) => spainRetailScore(p) > 0 && productMatchesQuery(p, q))
    .sort((a, b) => spainRetailScore(b) - spainRetailScore(a));

  if (merged.length === 0) {
    if (lastError) throw lastError;
    return [];
  }

  return merged.map(formatProduct).filter(Boolean).slice(0, pageSize);
}

foodRouter.get('/search/stream', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  const page = parseInt(String(req.query.page || '1'), 10) || 1;
  const force = req.query.force === 'true';

  if (!q) {
    res.status(400).json({ error: 'Término requerido' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const cacheKey = `search:es-retail-v4:${q.toLowerCase()}:${page}`;

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
    if (cached.length === 0) sendSSE(res, { products: [], cached: true, done: true, total: 0 });
    res.end();
    return;
  }

  try {
    if (force) foodCache.delete(cacheKey);

    const all = await fetchOffSearch(q, page);
    foodCache.set(cacheKey, all);

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
    console.error('OFF search failed:', err instanceof Error ? err.message : err);
    sendSSE(res, {
      error: 'Open Food Facts no disponible. Reintenta en unos segundos.',
      done: true,
    });
  } finally {
    res.end();
  }
});

foodRouter.get('/popular', async (req: Request, res: Response) => {
  try {
    const category = String(req.query.category || 'en:meals');
    const cacheKey = `popular:es-retail-v3:${category}`;
    if (foodCache.has(cacheKey)) {
      return res.json({ products: foodCache.get(cacheKey), cached: true });
    }

    let lastError: unknown;
    for (const host of OFF_HOSTS) {
      try {
        const response = await axios.get(`${host}/cgi/search.pl`, {
          params: {
            action: 'process',
            json: 1,
            page_size: 50,
            lc: 'es',
            fields: OFF_FIELDS,
            tagtype_0: 'categories',
            tag_contains_0: 'contains',
            tag_0: category,
            tagtype_1: 'countries',
            tag_contains_1: 'contains',
            tag_1: 'en:spain',
          },
          headers: { 'User-Agent': OFF_UA },
          timeout: 15000,
        });
        const raw: Record<string, unknown>[] = response.data.products || [];

        let retail: Record<string, unknown>[] = [];
        try {
          retail = await offCgiSearch({
            search_terms: 'hacendado',
            search_simple: 1,
            action: 'process',
            json: 1,
            page: 1,
            page_size: 30,
            lc: 'es',
            fields: OFF_FIELDS,
            tagtype_0: 'categories',
            tag_contains_0: 'contains',
            tag_0: category,
          });
        } catch { }

        const byId = new Map<string, Record<string, unknown>>();
        for (const p of [...raw, ...retail]) {
          if (!p) continue;
          const id = String(p.code || p._id || p.id || '');
          if (!id) continue;
          const prev = byId.get(id);
          if (!prev || spainRetailScore(p) > spainRetailScore(prev)) byId.set(id, p);
        }

        const products = [...byId.values()]
          .filter((p) => spainRetailScore(p) > 0)
          .sort((a, b) => spainRetailScore(b) - spainRetailScore(a))
          .map(formatProduct)
          .filter(Boolean);
        foodCache.set(cacheKey, products, 60 * 60 * 1000);
        return res.json({ products });
      } catch (err) {
        lastError = err;
        await sleep(300);
      }
    }
    console.error('popular fail:', lastError);
    return res.status(503).json({ error: 'Open Food Facts no disponible' });
  } catch {
    return res.status(503).json({ error: 'Error al obtener alimentos populares' });
  }
});

function formatProduct(p: Record<string, unknown>) {
  if (!p) return null;
  const n = (p.nutriments || {}) as Record<string, number>;
  const name = (p.product_name_es || p.product_name || '') as string;
  if (!name.trim()) return null;
  const kcal = n['energy-kcal_100g'] || n['energy-kcal'] || (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0);
  if (!kcal) return null;
  return {
    id: p.code || p._id || p.id,
    name: name.trim(),
    brand: (p.brands as string) || '',
    imageUrl: (p.image_small_url as string) || null,
    servingSize: parseFloat(String(p.serving_size || '').replace(/[^\d.]/g, '')) || 100,
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
