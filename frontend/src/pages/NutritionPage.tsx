import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Trash2, Package } from 'lucide-react';
import { nutritionApi, userApi } from '../lib/api';
import { todayString, dateToString, formatDateLabel, getMealLabel, calcMacrosFromPer100g, isValidDateString } from '../lib/utils';
import { FoodSearch } from '../components/nutrition/FoodSearch';
import { MacroRing, Modal, Spinner, QueryError, MutationError } from '../components/common/UI';
import { format, addDays, parseISO } from 'date-fns';

const MEALS = ['desayuno', 'almuerzo', 'cena', 'snack'];

export function NutritionPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(() =>
    isValidDateString(searchParams.get('date')) ? searchParams.get('date')! : todayString()
  );
  const [addingToMeal, setAddingToMeal] = useState<string | null>(null);
  const [userMealOpen, setUserMealOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fromUrl = searchParams.get('date');
    if (isValidDateString(fromUrl)) setSelectedDate(fromUrl);
  }, [searchParams]);

  useEffect(() => {
    setUserMealOpen({});
  }, [selectedDate]);

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.getProfile().then((r) => r.data),
    staleTime: 30_000,
  });

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['nutrition-day', selectedDate],
    queryFn: () => nutritionApi.getDay(selectedDate).then((r) => r.data),
  });

  const invalidateDay = () => {
    void qc.invalidateQueries({ queryKey: ['nutrition-day', selectedDate] });
    void qc.invalidateQueries({ queryKey: ['nutrition-weekly'] });
    void qc.invalidateQueries({ queryKey: ['calendar-summary'] });
  };

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
      invalidateDay();
      setAddingToMeal(null);
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: (id: number) => nutritionApi.deleteMeal(id),
    onSuccess: () => invalidateDay(),
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
  const dayFailed = isError && !data;
  const dayLoading = isLoading && !data;
  const mutationError =
    (addMealMutation.isError && t('nutrition.addMealError')) ||
    (deleteMealMutation.isError && t('nutrition.deleteMealError')) ||
    null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('nutrition.title')}</h1>
      </div>

      <div className="flex items-center gap-3 glass border border-indigo-500/10 rounded-2xl px-4 py-3">
        <button
          onClick={() => goToDay(-1)}
          aria-label={t('nutrition.previousDay')}
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
          aria-label={t('nutrition.nextDay')}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {mutationError && <MutationError message={mutationError} />}

      {dayFailed ? (
        <div className="glass border border-red-500/20 rounded-2xl">
          <QueryError
            message={t('nutrition.loadError')}
            onRetry={() => void refetch()}
          />
        </div>
      ) : (
        <>
          <div className="glass border border-indigo-500/10 rounded-2xl p-5">
            {dayLoading ? (
              <div className="flex justify-center py-6"><Spinner size={32} /></div>
            ) : (
              <MacroRing
                calories={totals.calories}
                goal={calorieGoal}
                proteins={totals.proteins}
                carbs={totals.carbs}
                fats={totals.fats}
                proteinGoal={proteinGoal}
                carbsGoal={carbsGoal}
                fatsGoal={fatsGoal}
                size={140}
              />
            )}

            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: t('macros.proteins'), value: dayLoading ? '…' : `${Math.round(totals.proteins)}g`, goal: `${Math.round(proteinGoal)}g`, color: 'text-indigo-400' },
                { label: t('macros.carbsShort'), value: dayLoading ? '…' : `${Math.round(totals.carbs)}g`, goal: `${Math.round(carbsGoal)}g`, color: 'text-cyan-400' },
                { label: t('macros.fats'), value: dayLoading ? '…' : `${Math.round(totals.fats)}g`, goal: `${Math.round(fatsGoal)}g`, color: 'text-amber-400' },
              ].map((m) => (
                <div key={m.label} className="bg-white/3 rounded-xl p-3 text-center">
                  <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-slate-500 text-[10px]">{m.label}</p>
                  <p className="text-slate-600 text-[10px]">{t('nutrition.goalSep', { goal: m.goal })}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {MEALS.map((mealType) => {
              const mealItems = meals[mealType] || [];
              const mealCals = mealItems.reduce((sum: number, m: any) => sum + m.calories, 0);
              const hasItems = mealItems.length > 0;
              const isExpanded =
                mealType in userMealOpen ? userMealOpen[mealType] : hasItems;

              return (
                <motion.div
                  key={mealType}
                  className="glass border border-white/5 rounded-2xl overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-4">
                    <button
                      type="button"
                      onClick={() =>
                        setUserMealOpen((prev) => ({ ...prev, [mealType]: !isExpanded }))
                      }
                      className="flex-1 flex items-center gap-3 text-left hover:opacity-90 transition-opacity"
                      aria-expanded={isExpanded}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">{getMealLabel(mealType)}</p>
                        <p className="text-slate-500 text-xs">{t('nutrition.mealSummary', { count: mealItems.length, calories: Math.round(mealCals) })}</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label={t('nutrition.addFoodAria', { meal: getMealLabel(mealType) })}
                      onClick={() => setAddingToMeal(mealType)}
                      disabled={addMealMutation.isPending}
                      className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 transition-colors disabled:opacity-40"
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
                          {dayLoading ? (
                            <div className="flex justify-center py-4"><Spinner size={20} /></div>
                          ) : mealItems.length === 0 ? (
                            <div className="py-3 text-center">
                              <p className="text-slate-500 text-sm">{t('nutrition.emptyMeal')}</p>
                              <button
                                type="button"
                                onClick={() => setAddingToMeal(mealType)}
                                className="mt-2 text-indigo-400 text-xs hover:text-indigo-300"
                              >
                                {t('nutrition.addFood')}
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
                                    aria-label={t('nutrition.deleteFoodAria', { name: item.foodName })}
                                    onClick={() => deleteMealMutation.mutate(item.id)}
                                    disabled={deleteMealMutation.isPending}
                                    className="text-slate-600 hover:text-red-400 transition-colors p-1.5 -mr-0.5 disabled:opacity-40"
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
        </>
      )}

      <AnimatePresence>
        {addingToMeal && (
          <Modal title={t('nutrition.addToMeal', { meal: getMealLabel(addingToMeal) })} onClose={() => setAddingToMeal(null)}>
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
