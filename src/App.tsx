import { QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import { queryClient } from './lib/react-query'
import { toasterConfig } from './lib/toaster-config'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import AdminAuthManager from './components/admin/auth/AdminAuthManager'
import AppRouter from './routes/AppRouter'
import { ThemeProvider } from './contexts/ThemeContext'
import InterfacePreparation from './features/interface-preparation/InterfacePreparation'
import { useEffect } from 'react'
import i18n from './i18n/config'
import { interfaceLanguage } from './i18n/language'
import { prepareInterface } from './features/interface-preparation/prepare'

/**
 * Root application component
 * REVIEW: Extracted QueryClient and Toaster config to dedicated lib/config files
 * REVIEW: Moved routing definitions to dedicated AppRouter component
 */
function App() {
  useEffect(() => {
    // Run alongside session bootstrap; the boundary owns errors and the explicit retry UI.
    void prepareInterface(interfaceLanguage(i18n.language)).catch(() => undefined)
  }, [])
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <AdminAuthManager />
              <InterfacePreparation>
                <AppRouter />
              </InterfacePreparation>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
      <Toaster position="top-right" toastOptions={toasterConfig} />
    </ErrorBoundary>
  )
}

export default App
