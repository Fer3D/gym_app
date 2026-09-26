import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, User, Target, Scale, Ruler, Calendar, Activity } from 'lucide-react';
import { userApi } from '../lib/api';
import { Spinner, QueryError, MutationError } from '../components/common/UI';

const OBJECTIVES = [
  { value: 'perder_peso', label: 'Perder peso', icon: '📉', desc: 'Déficit calórico de ~500 kcal' },
  { value: 'mantener', label: 'Mantener peso', icon: '⚖️', desc: 'Mantener calorías de mantenimiento' },
  { value: 'ganar_musculo', label: 'Ganar músculo', icon: '💪', desc: 'Superávit calórico de ~300 kcal' },
];

const GENDERS = [
  { value: 'masculino', label: 'Masculino', icon: '♂️' },
  { value: 'femenino', label: 'Femenino', icon: '♀️' },
  { value: 'no_especificado', label: 'No especificar', icon: '⚪' },
];

export function ProfilePage() {
  const qc = useQueryClient();

  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.getProfile().then((r) => r.data),
  });

  const { data: tdee } = useQuery({
    queryKey: ['tdee'],
    queryFn: () => userApi.getTDEE().then((r) => r.data),
    enabled: !!profile,
  });

  const [form, setForm] = useState({
    name: '',
    weight: '',
    height: '',
    birthDate: '',
    gender: 'no_especificado',
    objective: 'mantener',
    calorieGoal: '',
    proteinGoal: '',
    carbsGoal: '',
    fatsGoal: '',
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        weight: profile.weight != null ? String(profile.weight) : '',
        height: profile.height != null ? String(profile.height) : '',
        birthDate: profile.birthDate ? profile.birthDate.split('T')[0] : '',
        gender: profile.gender || 'no_especificado',
        objective: profile.objective || 'mantener',
        calorieGoal: String(profile.calorieGoal ?? 2000),
        proteinGoal: String(profile.proteinGoal ?? 150),
        carbsGoal: String(profile.carbsGoal ?? 250),
        fatsGoal: String(profile.fatsGoal ?? 65),
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => userApi.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-profile'] });
      qc.invalidateQueries({ queryKey: ['tdee'] });
      qc.invalidateQueries({ queryKey: ['calendar-summary'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSave = () => {
    const calorieGoal = parseInt(form.calorieGoal, 10);
    const proteinGoal = parseFloat(form.proteinGoal);
    const carbsGoal = parseFloat(form.carbsGoal);
    const fatsGoal = parseFloat(form.fatsGoal);
    if (
      !Number.isFinite(calorieGoal) ||
      !Number.isFinite(proteinGoal) ||
      !Number.isFinite(carbsGoal) ||
      !Number.isFinite(fatsGoal)
    ) {
      return;
    }
    updateMutation.mutate({
      ...form,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
      birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : null,
      calorieGoal,
      proteinGoal,
      carbsGoal,
      fatsGoal,
    });
  };

  const handleAutoGoals = () => {
    if (!tdee || tdee.goal <= 0 || !form.weight) return;
    const protein = Math.round(parseFloat(form.weight) * 2);
    const cals = tdee.goal;
    const proteinCals = protein * 4;
    const fatCals = cals * 0.25;
    const carbCals = cals - proteinCals - fatCals;
    setForm((f) => ({
      ...f,
      calorieGoal: String(cals),
      proteinGoal: String(protein),
      carbsGoal: String(Math.round(carbCals / 4)),
      fatsGoal: String(Math.round(fatCals / 9)),
    }));
  };

  if (isLoading && !profile) {
    return <div className="flex justify-center py-20"><Spinner size={36} /></div>;
  }

  if (isError && !profile) {
    return (
      <div className="glass max-w-2xl rounded-2xl border border-red-500/20">
        <QueryError
          message="No se pudo cargar el perfil."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Perfil</h1>
        <motion.button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            saved ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {updateMutation.isPending ? <Spinner size={16} /> : <Save size={16} />}
          {saved ? '¡Guardado!' : 'Guardar'}
        </motion.button>
      </div>

      {updateMutation.isError && (
        <MutationError message="No se pudo guardar el perfil. Revisa los datos e inténtalo de nuevo." />
      )}

      <div className="glass border border-indigo-500/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User size={16} className="text-indigo-400" />
          <h2 className="text-white font-semibold text-sm">Información Personal</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
            {(form.name || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <label className="text-slate-400 text-xs mb-1 block">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Tu nombre"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-400 text-xs mb-2 block">Sexo biológico (para calcular TDEE)</label>
          <div className="flex gap-2">
            {GENDERS.map((g) => (
              <button
                key={g.value}
                onClick={() => setForm((f) => ({ ...f, gender: g.value }))}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                  form.gender === g.value ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <span>{g.icon}</span> {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-slate-400 text-xs mb-1 flex items-center gap-1">
              <Scale size={12} /> Peso (kg)
            </label>
            <input
              type="number"
              value={form.weight}
              onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="70"
              step="0.5"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 flex items-center gap-1">
              <Ruler size={12} /> Altura (cm)
            </label>
            <input
              type="number"
              value={form.height}
              onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="175"
            />
          </div>
          <div>
            <label htmlFor="profile-birthDate" className="text-slate-400 text-xs mb-1 flex items-center gap-1">
              <Calendar size={12} /> Nacimiento
            </label>
            <input
              id="profile-birthDate"
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="glass border border-indigo-500/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Target size={16} className="text-indigo-400" />
          <h2 className="text-white font-semibold text-sm">Objetivo</h2>
        </div>
        <div className="space-y-2">
          {OBJECTIVES.map((obj) => (
            <button
              key={obj.value}
              onClick={() => setForm((f) => ({ ...f, objective: obj.value }))}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                form.objective === obj.value
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
                  : 'bg-white/3 border-white/5 text-slate-400 hover:bg-white/8'
              }`}
            >
              <span className="text-xl">{obj.icon}</span>
              <div>
                <p className={`text-sm font-medium ${form.objective === obj.value ? 'text-white' : 'text-slate-300'}`}>{obj.label}</p>
                <p className="text-xs text-slate-500">{obj.desc}</p>
              </div>
              {form.objective === obj.value && (
                <span className="ml-auto text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">Activo</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tdee && tdee.tdee > 0 ? (
        <div className="glass border border-green-500/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-green-400" />
              <h2 className="text-white font-semibold text-sm">Tu metabolismo (Mifflin-St Jeor)</h2>
            </div>
            <button
              onClick={handleAutoGoals}
              disabled={!form.weight}
              className="text-indigo-400 text-xs hover:text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-lg transition-colors disabled:opacity-40"
            >
              Autocompletar
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/3 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-xl">{tdee.bmr}</p>
              <p className="text-slate-500 text-xs">BMR (reposo)</p>
            </div>
            <div className="bg-white/3 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-xl">{tdee.tdee}</p>
              <p className="text-slate-500 text-xs">TDEE (activo)</p>
            </div>
            <div className="bg-green-600/10 rounded-xl p-3 text-center border border-green-500/20">
              <p className="text-green-400 font-bold text-xl">{tdee.goal}</p>
              <p className="text-slate-500 text-xs">Tu objetivo</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass border border-white/5 rounded-2xl px-4 py-3">
          <p className="text-slate-500 text-xs">
            TDEE necesita peso, altura, fecha de nacimiento y sexo (masculino/femenino).
          </p>
        </div>
      )}

      <div className="glass border border-indigo-500/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Target size={16} className="text-indigo-400" />
          <h2 className="text-white font-semibold text-sm">Objetivos Nutricionales</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'calorieGoal', label: 'Calorías diarias', placeholder: '2000', suffix: 'kcal' },
            { key: 'proteinGoal', label: 'Proteínas', placeholder: '150', suffix: 'g' },
            { key: 'carbsGoal', label: 'Carbohidratos', placeholder: '250', suffix: 'g' },
            { key: 'fatsGoal', label: 'Grasas', placeholder: '65', suffix: 'g' },
          ].map(({ key, label, placeholder, suffix }) => (
            <div key={key}>
              <label className="text-slate-400 text-xs mb-1 block">{label}</label>
              <div className="relative">
                <input
                  type="number"
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 pr-10"
                  placeholder={placeholder}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{suffix}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
