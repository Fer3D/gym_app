import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Package, RefreshCw, Zap, Clock } from 'lucide-react';
import { foodApi } from '../../lib/api';
import type { FoodProduct } from '../../lib/utils';
import { calcMacrosFromPer100g } from '../../lib/utils';
import { Spinner } from '../common/UI';

interface FoodSearchProps {
  onSelect: (food: FoodProduct, quantity: number) => void;
  mealType: string;
  onClose: () => void;
}

type SearchState = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

export function FoodSearch({ onSelect, mealType, onClose }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [selected, setSelected] = useState<FoodProduct | null>(null);
  const [quantity, setQuantity] = useState(100);

  // Estado de búsqueda SSE
  const [products, setProducts] = useState<FoodProduct[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [wasCached, setWasCached] = useState(false);
  const [cacheTTL, setCacheTTL] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 450);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // ── Alimentos populares (fallback cuando no hay búsqueda) ─────────────────
  const { data: popular } = useQuery({
    queryKey: ['food-popular'],
    queryFn: () => foodApi.popular().then((r) => r.data),
    staleTime: 30 * 60 * 1000,
  });

  // ── Búsqueda SSE ──────────────────────────────────────────────────────────
  const startSearch = useCallback((q: string, force = false) => {
    if (esRef.current) esRef.current.close();
    setProducts([]);
    setSearchState('loading');
    setWasCached(false);

    const url = `/api/foods/search/stream?q=${encodeURIComponent(q)}${force ? '&force=true' : ''}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.error) { setSearchState('error'); es.close(); return; }

      setProducts((prev) => [...prev, ...(data.products || [])]);
      setWasCached(data.cached ?? false);
      setCacheTTL(data.ttlSeconds ?? 0);
      setTotalCount(data.total ?? 0);
      setSearchState(data.cached ? 'done' : 'streaming');

      if (data.done) { setSearchState('done'); es.close(); }
    };

    es.onerror = () => { setSearchState('error'); es.close(); };
  }, []);

  useEffect(() => {
    if (debouncedQ.length > 1) {
      startSearch(debouncedQ);
    } else {
      if (esRef.current) esRef.current.close();
      setProducts([]);
      setSearchState('idle');
    }
    return () => { if (esRef.current) esRef.current.close(); };
  }, [debouncedQ, startSearch]);

  const displayProducts: FoodProduct[] =
    debouncedQ.length > 1 ? products : (popular?.products || []);

  const mealLabels: Record<string, string> = {
    desayuno: 'Desayuno', almuerzo: 'Almuerzo', cena: 'Cena', snack: 'Snack',
  };

  const macros = selected ? calcMacrosFromPer100g(selected.per100g, quantity) : null;
  const isSearching = searchState === 'loading' || searchState === 'streaming';

  // ── Vista detalle de producto ─────────────────────────────────────────────
  if (selected) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex gap-3 p-3 bg-white/5 rounded-xl">
          {selected.imageUrl ? (
            <img src={selected.imageUrl} alt={selected.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 bg-indigo-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package size={24} className="text-indigo-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm leading-tight line-clamp-2">{selected.name}</p>
            {selected.brand && <p className="text-slate-400 text-xs mt-0.5">{selected.brand}</p>}
            <p className="text-indigo-400 text-xs mt-1 font-medium">{mealLabels[mealType]}</p>
          </div>
        </div>

        <div>
          <label className="text-slate-400 text-xs block mb-1">Cantidad (gramos)</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(10, quantity - 10))}
              className="w-8 h-8 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors flex items-center justify-center font-bold"
            >−</button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-center text-sm focus:outline-none focus:border-indigo-500"
              min={1}
            />
            <button
              onClick={() => setQuantity(quantity + 10)}
              className="w-8 h-8 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors flex items-center justify-center font-bold"
            >+</button>
          </div>
          {selected.servingSize && selected.servingSize !== 100 && (
            <button
              onClick={() => setQuantity(selected.servingSize!)}
              className="mt-1.5 text-indigo-400 text-xs hover:text-indigo-300 transition-colors"
            >
              Usar ración: {selected.servingSize}g
            </button>
          )}
        </div>

        {macros && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Kcal', value: macros.calories, color: 'text-white', bg: 'bg-indigo-600/20' },
              { label: 'P', value: `${macros.proteins}g`, color: 'text-indigo-400', bg: 'bg-indigo-600/10' },
              { label: 'C', value: `${macros.carbs}g`, color: 'text-cyan-400', bg: 'bg-cyan-600/10' },
              { label: 'G', value: `${macros.fats}g`, color: 'text-amber-400', bg: 'bg-amber-600/10' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-lg p-2 text-center`}>
                <p className={`text-sm font-bold ${color}`}>{value}</p>
                <p className="text-slate-500 text-[10px]">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setSelected(null)}
            className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/10 transition-colors"
          >
            ← Volver
          </button>
          <button
            onClick={() => { if (macros) onSelect(selected, quantity); }}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
          >
            Añadir al {mealLabels[mealType]}
          </button>
        </div>
      </div>
    );
  }

  // ── Vista listado ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Barra de búsqueda */}
      <div className="p-4 pb-2 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar alimentos... (p.ej. pollo, arroz)"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
          {/* Botón refresco de caché */}
          {debouncedQ.length > 1 && (
            <button
              onClick={() => startSearch(debouncedQ, true)}
              disabled={isSearching}
              title="Forzar actualización (ignorar caché)"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              <RefreshCw size={15} className={isSearching ? 'animate-spin' : ''} />
            </button>
          )}
        </div>

        {/* Indicador de estado */}
        {debouncedQ.length > 1 && (
          <div className="flex items-center justify-between text-[11px] px-0.5">
            <span className="flex items-center gap-1 text-slate-500">
              {isSearching && (
                <><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse inline-block" />
                Buscando{products.length > 0 ? ` (${products.length} encontrados…)` : '…'}</>
              )}
              {searchState === 'done' && wasCached && (
                <><Zap size={11} className="text-green-400" />
                <span className="text-green-400">Resultado instantáneo</span>
                {cacheTTL > 0 && <><Clock size={10} className="text-slate-600 ml-1" /><span className="text-slate-600">{Math.round(cacheTTL / 60)}min</span></>}</>
              )}
              {searchState === 'done' && !wasCached && products.length > 0 && (
                <span className="text-slate-500">{products.length} resultados</span>
              )}
              {searchState === 'error' && <span className="text-red-400">Error al buscar</span>}
            </span>
            {searchState === 'done' && wasCached && (
              <button
                onClick={() => startSearch(debouncedQ, true)}
                className="text-indigo-500 hover:text-indigo-400 transition-colors"
              >
                Actualizar
              </button>
            )}
          </div>
        )}
        {!debouncedQ && (
          <p className="text-slate-500 text-xs text-center">Mostrando alimentos populares en España</p>
        )}
      </div>

      {/* Lista de resultados */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {/* Skeleton mientras carga los primeros resultados */}
        {searchState === 'loading' && products.length === 0 && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 animate-pulse">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-white/5 rounded w-2/3" />
                  <div className="h-2.5 bg-white/5 rounded w-1/3" />
                </div>
                <div className="w-10 space-y-1">
                  <div className="h-3 bg-white/5 rounded" />
                  <div className="h-2 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {searchState === 'done' && products.length === 0 && debouncedQ.length > 1 && (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">No se encontraron resultados para "{debouncedQ}"</p>
            <p className="text-slate-500 text-xs mt-1">Prueba con otro término o recarga</p>
          </div>
        )}

        <AnimatePresence>
          {displayProducts.map((p, i) => (
            <motion.button
              key={`${p.id}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: Math.min(i * 0.025, 0.3) }}
              onClick={() => setSelected(p)}
              className="w-full flex items-center gap-3 p-3 bg-white/3 hover:bg-white/8 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all text-left"
            >
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package size={16} className="text-indigo-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium leading-tight truncate">{p.name}</p>
                {p.brand && <p className="text-slate-500 text-xs truncate">{p.brand}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-indigo-400 text-sm font-bold">{p.per100g.calories}</p>
                <p className="text-slate-500 text-[10px]">kcal/100g</p>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Spinner al final si aún viene más info */}
        {searchState === 'streaming' && products.length > 0 && (
          <div className="flex justify-center py-3">
            <Spinner size={18} />
          </div>
        )}
      </div>
    </div>
  );
}
