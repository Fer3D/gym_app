import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/nutricion': 'Nutrición',
  '/entreno': 'Entrenamiento',
  '/calendario': 'Calendario',
  '/perfil': 'Perfil',
};

function usePageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const base = TITLES[pathname] || 'FitTrack';
    document.title = `${base} · FitTrack`;
  }, [pathname]);
}

export function Layout({ children }: LayoutProps) {
  usePageTitle();

  return (
    <div className="min-h-screen bg-[#0f0f1a] md:flex">
      <a href="#contenido-principal" className="skip-link">
        Saltar al contenido
      </a>
      <Sidebar />
      <main
        id="contenido-principal"
        tabIndex={-1}
        className="flex-1 overflow-auto pb-[calc(4rem+env(safe-area-inset-bottom))] outline-none md:ml-60 md:pb-0"
      >
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
