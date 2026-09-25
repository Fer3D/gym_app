import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Trash2, Package } from 'lucide-react';
import { nutritionApi, userApi } from '../lib/api';
import { todayString, dateToString, formatDateLabel, getMealLabel, calcMacrosFromPer100g } from '../lib/utils';
import { FoodSearch } from '../components/nutrition/FoodSearch';
import { MacroRing, Modal, Spinner } from '../components/common/UI';
import { format, addDays, parseISO } from 'date-fns';
import { useQuery as useUserQuery } from '@tanstack/react-query';

const MEALS = ['desayuno', 'almuerzo', 'cena', 'snack'];

export function NutritionPage() {
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [addingToMeal, setAddingToMeal] = useState<string | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<string | null>('desayuno');

  const { data: profile } = useUserQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.getProfile().then((r) => r.data),
    staleTime: 30_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['nutrition-day', selectedDate],
    queryFn: () => nutritionApi.getDay(selectedDate).then((r) => r.data),
  });

  const addMealMutation = useMutation({
    mutationFn: ({ date, food, quantity, mealType }: any) => {
      const macros = calcMacrosFromPer100g(food.per100g, quantity);
      return nutritionApi.addMeal(date, {
        mealType,
        foodId: food.id,
        foodName: food.name,
        brand: food.brand,
        quantity,
        ...macros,
        imageUrl: food.imageUrl,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nutrition-day', selectedDate] });
      setAddingToMeal(null);
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: (id: number) => nutritionApi.deleteMeal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nutrition-day', selectedDate] }),
  });

  const goToDay = (delta: number) => {
    const d = parseISO(selectedDate);
    setSelectedDate(dateToString(addDays(d, delta)));
  };

  const calorieGoal = Math.max(800, profile?.calorieGoal || 2000);
  const proteinGoal = Math.max(20, profile?.proteinGoal || 150);
  const carbsGoal = Math.max(20, profile?.carbsGoal || 250);
  const fatsGoal = Math.max(10, profile?.fatsGoal || 65);
  const totals = data?.totals || { calories: 0, proteins: 0, carbs: 0, fats: 0 };
  const meals = data?.meals || { desayuno: [], almuerzo: [], cena: [], snack: [] };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Nutrición</h1>
      </div>

      <div className="flex items-center gap-3 glass border border-indigo-500/10 rounded-2xl px-4 py-3">
        <button
          onClick={() => goToDay(-1)}
          aria-label="Día anterior"
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-white font-semibold text-sm capitalize">{formatDateLabel(selectedDate)}</p>
          <p className="text-slate-500 text-xs">{format(parseISO(selectedDate), 'dd/MM/yyyy')}</p>
        </div>
        <button
          onClick={() => goToDay(1)}
          disabled={selectedDate >= todayString()}
          aria-label="Día siguiente"
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="glass border border-indigo-500/10 rounded-2xl p-5">
        {isLoading ? (
          <div className="flex justify-center py-6"><Spinner size={32} /></div>
        ) : (
          <MacroRing
            calories={totals.calories}
            goal={calorieGoal}
            proteins={totals.proteins}
            carbs={totals.carbs}
            fats={totals.fats}
            size={140}
          />
        )}

        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Proteínas', value: `${Math.round(totals.proteins)}g`, goal: `${Math.round(proteinGoal)}g`, color: 'text-indigo-400' },
            { label: 'Carboh.', value: `${Math.round(totals.carbs)}g`, goal: `${Math.round(carbsGoal)}g`, color: 'text-cyan-400' },
            { label: 'Grasas', value: `${Math.round(totals.fats)}g`, goal: `${Math.round(fatsGoal)}g`, color: 'text-amber-400' },
          ].map((m) => (
            <div key={m.label} className="bg-white/3 rounded-xl p-3 text-center">
              <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
              <p className="text-slate-500 text-[10px]">{m.label}</p>
              <p className="text-slate-600 text-[10px]">/ {m.goal}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {MEALS.map((mealType) => {
          const mealItems = meals[mealType] || [];
          const mealCals = mealItems.reduce((sum: number, m: any) => sum + m.calories, 0);
          const isExpanded = expandedMeal === mealType;

          return (
            <motion.div
              key={mealType}
              className="glass border border-white/5 rounded-2xl overflow-hidden"
            >

              <div className="flex items-center gap-3 p-4">
                <button
                  type="button"
                  onClick={() => setExpandedMeal(isExpanded ? null : mealType)}
                  className="flex-1 flex items-center gap-3 text-left hover:opacity-90 transition-opacity"
                  aria-expanded={isExpanded}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{getMealLabel(mealType)}</p>
                    <p className="text-slate-500 text-xs">{mealItems.length} alimentos · {Math.round(mealCals)} kcal</p>
                  </div>
                </button>
                <button
                  type="button"
                  aria-label={`Añadir alimento a ${getMealLabel(mealType)}`}
                  onClick={() => setAddingToMeal(mealType)}
                  className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/5 px-4 py-3">
                      {mealItems.length === 0 ? (
                        <div className="py-3 text-center">
                          <p className="text-slate-500 text-sm">Sin alimentos registrados</p>
                          <button
                            type="button"
                            onClick={() => setAddingToMeal(mealType)}
                            className="mt-2 text-indigo-400 text-xs hover:text-indigo-300"
                          >
                            + Añadir alimento
                          </button>
                        </div>
                      ) : (
                        <ul className="space-y-1">
                          {mealItems.map((item: any) => (
                            <li key={item.id} className="flex items-center gap-3 rounded-xl px-1 py-2 hover:bg-white/[0.03]">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.foodName} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Package size={14} className="text-slate-500" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{item.foodName}</p>
                                <p className="text-slate-500 text-xs">{item.quantity}g</p>
                              </div>
                              <div className="text-right tabular-nums">
                                <p className="text-white text-sm font-bold">{Math.round(item.calories)}</p>
                                <p className="text-slate-500 text-[10px]">kcal</p>
                              </div>
                              <div className="hidden sm:flex gap-2.5 text-xs tabular-nums min-w-[7.5rem] justify-end">
                                <span className="text-indigo-400">P:{Math.round(item.proteins)}g</span>
                                <span className="text-cyan-400">C:{Math.round(item.carbs)}g</span>
                                <span className="text-amber-400">G:{Math.round(item.fats)}g</span>
                              </div>
                              <button
                                type="button"
                                aria-label={`Eliminar ${item.foodName}`}
                                onClick={() => deleteMealMutation.mutate(item.id)}
                                className="text-slate-600 hover:text-red-400 transition-colors p-1.5 -mr-0.5"
                              >
                                <Trash2 size={14} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {addingToMeal && (
          <Modal title={`Añadir a ${getMealLabel(addingToMeal)}`} onClose={() => setAddingToMeal(null)}>
            <FoodSearch
              mealType={addingToMeal}
              onClose={() => setAddingToMeal(null)}
              onSelect={(food, qty) => {
                addMealMutation.mutate({ date: selectedDate, food, quantity: qty, mealType: addingToMeal });
              }}
            />
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
