/**
 * Caché in-memory con TTL (Time To Live).
 * Sin dependencias externas, suficiente para una app single-user.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class TTLCache<T = unknown> {
  private store = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;

  constructor(defaultTTLms: number) {
    this.defaultTTL = defaultTTLms;
    // Limpieza periódica cada 5 minutos
    setInterval(() => this.evict(), 5 * 60 * 1000);
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data;
  }

  set(key: string, data: T, ttlMs?: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTTL),
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  /** Elimina todas las entradas cuya clave empiece por prefijo */
  deleteByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /** Retorna el tiempo restante en segundos (0 si no existe o expiró) */
  ttlSeconds(key: string): number {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expiresAt) return 0;
    return Math.round((entry.expiresAt - Date.now()) / 1000);
  }

  stats() {
    const now = Date.now();
    const keys = [...this.store.entries()]
      .filter(([, e]) => e.expiresAt > now)
      .map(([k, e]) => ({ key: k, ttlSeconds: Math.round((e.expiresAt - now) / 1000) }));
    return { size: keys.length, entries: keys };
  }

  private evict() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}

// 30 min para alimentos, 24h para ejercicios
export const foodCache = new TTLCache<unknown[]>(30 * 60 * 1000);
export const exerciseCache = new TTLCache<unknown[]>(24 * 60 * 60 * 1000);
