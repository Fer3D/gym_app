import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export const foodApi = {
  search: (q: string, page = 1) => api.get('/foods/search', { params: { q, page } }),
  barcode: (code: string) => api.get(`/foods/barcode/${code}`),
  popular: (category?: string) => api.get('/foods/popular', { params: { category } }),
  getCustom: () => api.get('/foods/custom'),
  createCustom: (data: any) => api.post('/foods/custom', data),
  deleteCustom: (id: number) => api.delete(`/foods/custom/${id}`),
};

export const exerciseApi = {
  search: (q: string, filters?: any) => api.get('/exercises/search', { params: { q, ...filters } }),
  list: (page = 1, filters?: any) => api.get('/exercises/list', { params: { page, ...filters } }),
  getById: (id: number) => api.get(`/exercises/${id}`),
  categories: () => api.get('/exercises/meta/categories'),
  muscles: () => api.get('/exercises/meta/muscles'),
  equipment: () => api.get('/exercises/meta/equipment'),
};

export const nutritionApi = {
  getDay: (date: string) => api.get(`/nutrition/day/${date}`),
  addMeal: (date: string, data: any) => api.post(`/nutrition/day/${date}/meal`, data),
  updateMeal: (id: number, data: any) => api.put(`/nutrition/meal/${id}`, data),
  deleteMeal: (id: number) => api.delete(`/nutrition/meal/${id}`),
  updateDay: (date: string, data: any) => api.patch(`/nutrition/day/${date}`, data),
  weeklyStats: (startDate: string) => api.get(`/nutrition/stats/weekly/${startDate}`),
  monthlyStats: (year: number, month: number) => api.get(`/nutrition/stats/monthly/${year}/${month}`),
};

export const workoutApi = {
  getDay: (date: string) => api.get(`/workouts/day/${date}`),
  create: (date: string, data: any) => api.post(`/workouts/day/${date}`, data),
  update: (id: number, data: any) => api.put(`/workouts/${id}`, data),
  delete: (id: number) => api.delete(`/workouts/${id}`),
  addExercise: (workoutId: number, data: any) => api.post(`/workouts/${workoutId}/exercise`, data),
  deleteExercise: (id: number) => api.delete(`/workouts/exercise/${id}`),
  addSet: (exerciseId: number, data: any) => api.post(`/workouts/exercise/${exerciseId}/set`, data),
  updateSet: (id: number, data: any) => api.put(`/workouts/set/${id}`, data),
  deleteSet: (id: number) => api.delete(`/workouts/set/${id}`),
  progress: (exerciseName: string) => api.get(`/workouts/progress/${encodeURIComponent(exerciseName)}`),
  weeklyStats: (startDate: string) => api.get(`/workouts/stats/weekly/${startDate}`),
};

export const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: any) => api.put('/user/profile', data),
  getTDEE: () => api.get('/user/tdee'),
};

export const routineApi = {
  getAll: () => api.get('/routines'),
  save: (data: any) => api.post('/routines', data),
  update: (id: number, data: any) => api.put(`/routines/${id}`, data),
  delete: (id: number) => api.delete(`/routines/${id}`),
  explore: () => api.get('/routines/explore'),
  startFromSaved: (id: number, date: string, dayIndex = 0) => api.post(`/routines/${id}/start`, { date, dayIndex }),
  startFromExplore: (id: string, date: string, dayIndex = 0) => api.post(`/routines/explore/${id}/start`, { date, dayIndex }),
};

export const calendarApi = {
  summary: (year: number, month: number) => api.get(`/calendar/summary/${year}/${month}`),
  day: (date: string) => api.get(`/calendar/day/${date}`),
};
