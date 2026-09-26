import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

function usePageTitle() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const map: Record<string, string> = {
      '/': t('titles.dashboard'),
      '/nutricion': t('titles.nutrition'),
      '/entreno': t('titles.workout'),
      '/calendario': t('titles.calendar'),
      '/perfil': t('titles.profile'),
    };
    const base = map[pathname] || 'FitTrack';
    document.title = `${base} · FitTrack`;
  }, [pathname, t, i18n.language]);
}

export function Layout({ children }: LayoutProps) {
  usePageTitle();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0f0f1a] md:flex">
      <a href="#contenido-principal" className="skip-link">
        {t('nav.skipToContent')}
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
