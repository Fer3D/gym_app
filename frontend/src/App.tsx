import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { NutritionPage } from './pages/NutritionPage';
import { WorkoutPage } from './pages/WorkoutPage';
import { CalendarPage } from './pages/CalendarPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/nutricion" element={<NutritionPage />} />
        <Route path="/entreno" element={<WorkoutPage />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
      </Routes>
    </Layout>
  );
}

export default App;
