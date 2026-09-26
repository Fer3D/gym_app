import { useEffect, useId, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface MacroRingProps {
  calories: number;
  goal: number;
  proteins: number;
  carbs: number;
  fats: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatsGoal?: number;
  size?: number;
}

export function MacroRing({
  calories,
  goal,
  proteins,
  carbs,
  fats,
  proteinGoal = 150,
  carbsGoal = 250,
  fatsGoal = 65,
  size = 160,
}: MacroRingProps) {
  const pct = Math.min((calories / Math.max(goal, 1)) * 100, 110);
  const r = (size / 2) - 16;
  const circumference = 2 * Math.PI * r;
  const arc = (pct / 100) * circumference;

  const pPct = Math.min((proteins / Math.max(proteinGoal, 1)) * 100, 100);
  const cPct = Math.min((carbs / Math.max(carbsGoal, 1)) * 100, 100);
  const fPct = Math.min((fats / Math.max(fatsGoal, 1)) * 100, 100);

  const color = pct > 105 ? '#ef4444' : pct > 95 ? '#22c55e' : pct > 70 ? '#f59e0b' : '#6366f1';

  return (
    <div className="flex flex-col items-center gap-4">
      <div style={{ width: size, height: size }} className="relative">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="10"
          />
          {arc > 0.5 && (
            <motion.circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={color} strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${arc} ${circumference}`}
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${arc} ${circumference}` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-bold text-white"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {Math.round(calories)}
          </motion.span>
          <span className="text-xs text-slate-400">kcal</span>
          <span className="text-[10px] text-slate-400">/ {goal}</span>
        </div>
      </div>

      <div className="w-full space-y-2">
        <MacroBar label="Proteínas" value={Math.round(proteins)} pct={pPct} color="#6366f1" unit="g" />
        <MacroBar label="Carbos." value={Math.round(carbs)} pct={cPct} color="#06b6d4" unit="g" />
        <MacroBar label="Grasas" value={Math.round(fats)} pct={fPct} color="#f59e0b" unit="g" />
      </div>
    </div>
  );
}

function MacroBar({ label, value, pct, color, unit }: {
  label: string; value: number; pct: number; color: string; unit: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium">{value}{unit}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color?: string;
  className?: string;
}

export function StatsCard({ title, value, subtitle, icon, color = 'indigo', className }: StatsCardProps) {
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-600/20 to-indigo-600/5 border-indigo-500/20',
    cyan: 'from-cyan-600/20 to-cyan-600/5 border-cyan-500/20',
    green: 'from-green-600/20 to-green-600/5 border-green-500/20',
    orange: 'from-orange-600/20 to-orange-600/5 border-orange-500/20',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/20',
    red: 'from-red-600/20 to-red-600/5 border-red-500/20',
  };
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      className={cn(
        'bg-gradient-to-br border rounded-2xl p-4 glass',
        colorMap[color] || colorMap.indigo,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-2xl ml-2" aria-hidden>{icon}</span>
      </div>
    </motion.div>
  );
}

export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      style={{ width: size, height: size }}
      className="border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"
    />
  );
}

export function EmptyState({ icon, title, description }: { icon: string; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-3" aria-hidden>{icon}</span>
      <h3 className="text-white font-semibold text-lg">{title}</h3>
      {description && <p className="text-slate-400 text-sm mt-1 max-w-sm">{description}</p>}
    </div>
  );
}

export function QueryError({
  message = 'No se pudo cargar los datos.',
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-4 py-10 text-center', className)} role="alert">
      <p className="text-sm text-red-400">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="h-9 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

export function MutationError({ message }: { message: string }) {
  return (
    <p role="alert" className="text-sm text-red-400">
      {message}
    </p>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ children, onClose, title }: {
  children: ReactNode; onClose: () => void; title: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const getFocusable = () =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.hasAttribute('disabled')) : [];

    const focusables = getFocusable();
    (focusables[0] || panel)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = getFocusable();
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-lg glass rounded-2xl border border-indigo-500/20 overflow-hidden max-h-[90vh] flex flex-col outline-none"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 id={titleId} className="text-white font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none px-2"
          >
            &times;
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </motion.div>
    </motion.div>
  );
}
