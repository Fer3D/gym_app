import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Dumbbell,
  CalendarDays,
  User2,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/nutricion', label: 'Nutrición', icon: UtensilsCrossed },
  { to: '/entreno', label: 'Entreno', icon: Dumbbell },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
  { to: '/perfil', label: 'Perfil', icon: User2 },
];

function isItemActive(pathname: string, to: string) {
  return to === '/' ? pathname === '/' : pathname.startsWith(to);
}

export function Sidebar() {
  const location = useLocation();

  return (
    <>
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-60 flex-col border-r border-indigo-500/10 glass md:flex">
        <div className="flex items-center gap-3 border-b border-indigo-500/10 px-4 py-5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold leading-none text-white">FitTrack</span>
            <p className="mt-0.5 text-[10px] leading-none text-indigo-400">España</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4" aria-label="Principal">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = isItemActive(location.pathname, to);
            return (
              <NavLink key={to} to={to} end={to === '/'}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="text-sm font-medium">{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-white"
                    />
                  )}
                </motion.div>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-indigo-500/10 px-4 py-4">
          <p className="text-center text-[10px] text-slate-600">FitTrack ES v1.0</p>
        </div>
      </aside>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-indigo-500/10 bg-[#0f0f1a]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        aria-label="Principal"
      >
        <ul className="grid h-16 grid-cols-5">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = isItemActive(location.pathname, to);
            return (
              <li key={to} className="min-w-0">
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={cn(
                    'flex h-full flex-col items-center justify-center gap-0.5 px-1 transition-colors',
                    isActive ? 'text-indigo-400' : 'text-slate-500'
                  )}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
                  <span className="truncate text-[10px] font-medium leading-none">{label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
