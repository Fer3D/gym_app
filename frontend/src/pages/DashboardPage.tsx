import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CalendarDays, Flame, Dumbbell, TrendingUp, ArrowRight, Target } from 'lucide-react';
import { nutritionApi, workoutApi, userApi } from '../lib/api';
import { todayString, formatDateLabel, getWeekStart, greetingForHour, remaining } from '../lib/utils';
import { MacroRing, StatsCard, Spinner, QueryError } from '../components/common/UI';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function DashboardPage() {
  const today = todayString();
  const weekStart = getWeekStart();

  const profileQuery = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.getProfile().then((r) => r.data),
    staleTime: 30_000,
  });

  const nutritionQuery = useQuery({
    queryKey: ['nutrition-day', today],
    queryFn: () => nutritionApi.getDay(today).then((r) => r.data),
  });

  const workoutsQuery = useQuery({
    queryKey: ['workout-day', today],
    queryFn: () => workoutApi.getDay(today).then((r) => r.data),
  });

  const weeklyQuery = useQuery({
    queryKey: ['nutrition-weekly', weekStart],
    queryFn: () => nutritionApi.weeklyStats(weekStart).then((r) => r.data),
  });

  const tdeeQuery = useQuery({
    queryKey: ['tdee'],
    queryFn: () => userApi.getTDEE().then((r) => r.data),
  });

  const profile = profileQuery.data;
  const todayNutrition = nutritionQuery.data;
  const todayWorkouts = workoutsQuery.data;
  const weeklyNutrition = weeklyQuery.data;
  const tdee = tdeeQuery.data;

  const calorieGoal = Math.max(800, profile?.calorieGoal || 2000);
  const totals = todayNutrition?.totals || { calories: 0, proteins: 0, carbs: 0, fats: 0 };
  const kcalLeft = remaining(totals.calories, calorieGoal);

  const chartData = (weeklyNutrition || []).map((d: { date: string; calories: number }) => ({
    date: format(parseISO(d.date), 'EEE', { locale: es }),
    kcal: Math.round(d.calories),
    objetivo: calorieGoal,
  }));

  const nutritionFailed = nutritionQuery.isError && !todayNutrition;
  const nutritionLoading = nutritionQuery.isLoading && !todayNutrition;

  const retryNutrition = () => {
    void nutritionQuery.refetch();
    void workoutsQuery.refetch();
    void weeklyQuery.refetch();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greetingForHour()}, {profile?.name || 'Atleta'}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5 capitalize">
            {formatDateLabel(today)}
          </p>
        </div>
        <Link
          to="/calendario"
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 transition-colors"
        >
          <CalendarDays size={16} className="text-indigo-400" />
          <span className="text-slate-300 text-sm hidden md:block">Calendario</span>
        </Link>
      </div>

      {nutritionFailed ? (
        <div className="glass border border-red-500/20 rounded-2xl">
          <QueryError
            message="No se pudo cargar la nutrición de hoy."
            onRetry={retryNutrition}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass border border-indigo-500/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm">Nutrición de Hoy</h2>
              <Link to="/nutricion" className="text-indigo-400 text-xs hover:text-indigo-300 flex items-center gap-1">
                Ver <ArrowRight size={12} />
              </Link>
            </div>
            {nutritionLoading ? (
              <div className="flex justify-center py-8"><Spinner size={32} /></div>
            ) : (
              <MacroRing
                calories={totals.calories}
                goal={calorieGoal}
                proteins={totals.proteins}
                carbs={totals.carbs}
                fats={totals.fats}
                proteinGoal={Math.max(20, profile?.proteinGoal || 150)}
                carbsGoal={Math.max(20, profile?.carbsGoal || 250)}
                fatsGoal={Math.max(10, profile?.fatsGoal || 65)}
              />
            )}
          </motion.div>

          <div className="lg:col-span-2 grid grid-cols-2 gap-3">
            <StatsCard
              title="Calorías hoy"
              value={nutritionLoading ? '…' : `${Math.round(totals.calories)} kcal`}
              subtitle={`Objetivo: ${calorieGoal} kcal`}
              icon="🔥"
              color="indigo"
            />
            <StatsCard
              title="Restantes"
              value={nutritionLoading ? '…' : `${Math.round(kcalLeft)} kcal`}
              subtitle="Por consumir"
              icon="🎯"
              color={kcalLeft < 200 ? 'green' : 'cyan'}
            />
            <StatsCard
              title="Proteínas"
              value={nutritionLoading ? '…' : `${Math.round(totals.proteins)}g`}
              subtitle={`Obj: ${Math.max(20, profile?.proteinGoal || 150)}g`}
              icon="💪"
              color="purple"
            />
            <StatsCard
              title="Entrenamientos"
              value={
                workoutsQuery.isError && !todayWorkouts
                  ? '—'
                  : workoutsQuery.isLoading && !todayWorkouts
                    ? '…'
                    : (todayWorkouts?.length || 0)
              }
              subtitle={workoutsQuery.isError && !todayWorkouts ? 'Error al cargar' : 'Hoy'}
              icon="🏋️"
              color="orange"
            />
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass border border-indigo-500/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Calorías esta semana</h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />Real</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />Objetivo</span>
          </div>
        </div>
        {weeklyQuery.isLoading && !weeklyNutrition ? (
          <div className="flex justify-center py-12"><Spinner size={28} /></div>
        ) : weeklyQuery.isError && !weeklyNutrition ? (
          <QueryError
            message="No se pudo cargar la gráfica semanal."
            onRetry={() => void weeklyQuery.refetch()}
            className="py-8"
          />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, color: '#e2e8f0' }}
                formatter={(v) => [`${Math.round(Number(v))} kcal`]}
              />
              <Area type="monotone" dataKey="objetivo" stroke="#334155" strokeDasharray="4 2" fill="none" strokeWidth={1} dot={false} />
              <Area type="monotone" dataKey="kcal" stroke="#6366f1" fill="url(#calGrad)" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/nutricion">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="glass border border-indigo-500/10 rounded-2xl p-4 cursor-pointer hover:border-indigo-500/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                <Flame size={20} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Registrar comida</p>
                <p className="text-slate-500 text-xs">Añadir alimentos</p>
              </div>
              <ArrowRight size={16} className="text-slate-500 ml-auto" />
            </div>
          </motion.div>
        </Link>
        <Link to="/entreno">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="glass border border-purple-500/10 rounded-2xl p-4 cursor-pointer hover:border-purple-500/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                <Dumbbell size={20} className="text-purple-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Nuevo entreno</p>
                <p className="text-slate-500 text-xs">Registrar ejercicios</p>
              </div>
              <ArrowRight size={16} className="text-slate-500 ml-auto" />
            </div>
          </motion.div>
        </Link>
      </div>

      {tdeeQuery.isError && !tdee ? (
        <div className="glass border border-white/5 rounded-2xl px-4 py-3">
          <p className="text-slate-500 text-xs">TDEE no disponible ahora.</p>
        </div>
      ) : tdee && tdee.tdee > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass border border-green-500/10 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target size={20} className="text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">Tu metabolismo estimado (TDEE)</p>
              <div className="flex gap-4 mt-1">
                <span className="text-xs text-slate-400">BMR: <strong className="text-white">{tdee.bmr} kcal</strong></span>
                <span className="text-xs text-slate-400">TDEE: <strong className="text-white">{tdee.tdee} kcal</strong></span>
                <span className="text-xs text-slate-400">Objetivo: <strong className="text-green-400">{tdee.goal} kcal</strong></span>
              </div>
            </div>
            <Link to="/perfil" className="text-indigo-400 text-xs hover:text-indigo-300">
              <TrendingUp size={16} />
            </Link>
          </div>
        </motion.div>
      ) : tdee && !tdeeQuery.isLoading ? (
        <div className="glass border border-white/5 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-slate-500 text-xs">
            Completa peso, altura, fecha de nacimiento y sexo en perfil para ver TDEE.
          </p>
          <Link to="/perfil" className="text-indigo-400 text-xs hover:text-indigo-300 shrink-0">
            Perfil
          </Link>
        </div>
      ) : null}
    </motion.div>
  );
}
