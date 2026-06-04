import { QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import { queryClient } from './lib/react-query'
import { toasterConfig } from './lib/toaster-config'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import AdminAuthManager from './components/admin/auth/AdminAuthManager'
import AppRouter from './routes/AppRouter'

/**
 * Root application component
 * REVIEW: Extracted QueryClient and Toaster config to dedicated lib/config files
 * REVIEW: Moved routing definitions to dedicated AppRouter component
 */
function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AdminAuthManager />
            <AppRouter />
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
      <Toaster position="top-right" toastOptions={toasterConfig} />
    </ErrorBoundary>
  )
}

export default App
