import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './i18n'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

class ErrorBoundary extends Component<{ children: ReactNode; title: string; hint: string; reload: string }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            background: '#0c0e12',
            color: '#eef0f3',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
            gap: 12,
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{this.props.title}</h1>
          <p style={{ color: '#9aa3b2', maxWidth: 360, margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            {this.props.hint}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              height: 40,
              padding: '0 16px',
              borderRadius: 10,
              border: '1px solid #2a2f3a',
              background: '#14171c',
              color: '#eef0f3',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {this.props.reload}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function Root() {
  const { t } = useTranslation()
  return (
    <ErrorBoundary
      title={t('common.errorGeneric')}
      hint={t('common.errorReloadHint')}
      reload={t('common.reload')}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
