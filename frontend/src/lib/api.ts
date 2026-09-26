import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export const foodApi = {
  popular: (category?: string) => api.get('/foods/popular', { params: category ? { category } : {} }),
};

export const exerciseApi = {
  search: (q: string, filters?: any) => api.get('/exercises/search', { params: { q, ...filters } }),
  list: (page = 1, filters?: any) => api.get('/exercises/list', { params: { page, ...filters } }),
  categories: () => api.get('/exercises/meta/categories'),
};

export const nutritionApi = {
  getDay: (date: string) => api.get(`/nutrition/day/${date}`),
  addMeal: (date: string, data: any) => api.post(`/nutrition/day/${date}/meal`, data),
  deleteMeal: (id: number) => api.delete(`/nutrition/meal/${id}`),
  weeklyStats: (startDate: string) => api.get(`/nutrition/stats/weekly/${startDate}`),
};

export const workoutApi = {
  getDay: (date: string) => api.get(`/workouts/day/${date}`),
  create: (date: string, data: any) => api.post(`/workouts/day/${date}`, data),
  delete: (id: number) => api.delete(`/workouts/${id}`),
  addExercise: (workoutId: number, data: any) => api.post(`/workouts/${workoutId}/exercise`, data),
  reorderExercises: (workoutId: number, data: { orderedIds: number[] }) =>
    api.put(`/workouts/${workoutId}/exercises/reorder`, data),
  updateExercise: (id: number, data: any) => api.put(`/workouts/exercise/${id}`, data),
  deleteExercise: (id: number) => api.delete(`/workouts/exercise/${id}`),
  addSet: (exerciseId: number, data: any) => api.post(`/workouts/exercise/${exerciseId}/set`, data),
  updateSet: (id: number, data: any) => api.put(`/workouts/set/${id}`, data),
  deleteSet: (id: number) => api.delete(`/workouts/set/${id}`),
  exerciseHistory: (exerciseId: string) => api.get(`/workouts/exercise-history/${exerciseId}`),
};

export const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: any) => api.put('/user/profile', data),
  getTDEE: () => api.get('/user/tdee'),
};

export const routineApi = {
  getAll: () => api.get('/routines'),
  save: (data: any) => api.post('/routines', data),
  delete: (id: number) => api.delete(`/routines/${id}`),
  explore: () => api.get('/routines/explore'),
  startFromSaved: (id: number, date: string, dayIndex = 0) => api.post(`/routines/${id}/start`, { date, dayIndex }),
  startFromExplore: (id: string, date: string, dayIndex = 0) => api.post(`/routines/explore/${id}/start`, { date, dayIndex }),
};

export const calendarApi = {
  summary: (year: number, month: number) => api.get(`/calendar/summary/${year}/${month}`),
};
