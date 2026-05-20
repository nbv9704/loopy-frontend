import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { withTranslation, WithTranslation } from 'react-i18next'
import { errorLogger } from '../../services/ErrorLogger'

interface Props extends WithTranslation {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to ErrorLogger with structured context
    errorLogger.error('React component error', {
      category: 'ui',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
      },
    })

    this.setState({ errorInfo })
  }

  handleReload = () => {
    // Clear error state and reload
    this.setState({ hasError: false, error: null, errorInfo: undefined })
    window.location.reload()
  }

  handleReset = () => {
    // Reset error state without reloading
    this.setState({ hasError: false, error: null, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      const isDevelopment = import.meta.env.DEV

      return (
        <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-6">
          {/* Ambient background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[80px]" />
          </div>

          {/* Error content */}
          <div className="relative z-10 max-w-2xl w-full">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-12">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative bg-gradient-to-br from-red-500/20 to-orange-500/20 p-4 rounded-2xl border border-red-500/30">
                    <AlertTriangle className="w-12 h-12 text-red-400" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
                {this.props.t('errorBoundary.title')}
              </h1>

              {/* Description */}
              <p className="text-slate-400 text-center text-lg mb-8">
                {this.props.t('common.unexpectedError')}
              </p>

              {/* Action buttons */}
              <div className="flex justify-center gap-4 mb-8">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all hover:scale-105 border border-white/20"
                >
                  {this.props.t('errorBoundary.retry')}
                </button>
                <button
                  onClick={this.handleReload}
                  className="group relative px-8 py-3 bg-gradient-to-r from-brand-teal to-brand-cyan text-white font-semibold rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-lg hover:shadow-brand-teal/25"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan to-brand-teal opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    {this.props.t('common.reloadPage')}
                  </span>
                </button>
              </div>

              {/* Development mode error details */}
              {isDevelopment && this.state.error && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <details className="group">
                    <summary className="cursor-pointer text-slate-400 hover:text-white transition-colors mb-4 font-medium">
                      {this.props.t('errorBoundary.details')}
                    </summary>
                    <div className="bg-black/30 rounded-xl p-4 border border-red-500/20">
                      <div className="mb-4">
                        <p className="text-red-400 font-semibold mb-2">Error Message:</p>
                        <p className="text-slate-300 font-mono text-sm break-all">
                          {this.state.error.message}
                        </p>
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <p className="text-red-400 font-semibold mb-2">Stack Trace:</p>
                          <pre className="text-slate-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap break-all">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo && this.state.errorInfo.componentStack && (
                        <div className="mt-4">
                          <p className="text-red-400 font-semibold mb-2">Component Stack:</p>
                          <pre className="text-slate-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const TranslatedErrorBoundary = withTranslation()(ErrorBoundary)
export default TranslatedErrorBoundary
