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

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-16 md:w-60 flex flex-col z-50 glass border-r border-indigo-500/10">

      <div className="flex items-center gap-3 px-4 py-5 border-b border-indigo-500/10">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Zap size={18} className="text-white" />
        </div>
        <div className="hidden md:block">
          <span className="font-bold text-white text-sm leading-none">FitTrack</span>
          <p className="text-indigo-400 text-[10px] leading-none mt-0.5">España</p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} end={to === '/'}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="hidden md:block text-sm font-medium">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-white"
                  />
                )}
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-indigo-500/10 hidden md:block">
        <p className="text-slate-600 text-[10px] text-center">FitTrack ES v1.0</p>
      </div>
    </aside>
  );
}
