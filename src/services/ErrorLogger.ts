/**
 * ErrorLogger Service
 * Structured error logging system with batching and global error handlers
 */

import { useAuthStore } from '../store/admin/authStore'
import type {
  LogLevel,
  LogContext,
  LogEntry,
  LoggerConfig,
  BrowserInfo,
  ApiError,
  AuthError,
  ExecutionError,
  RequestContext,
  AuthContext,
} from '../types/logger.types'

export class ErrorLogger {
  private logQueue: LogEntry[] = []
  private batchTimer: ReturnType<typeof setTimeout> | null = null
  private readonly BATCH_SIZE: number
  private readonly BATCH_TIMEOUT: number
  private readonly MAX_QUEUE_SIZE: number
  private readonly enableConsole: boolean
  private sessionId: string

  constructor(config: LoggerConfig = {}) {
    this.BATCH_SIZE = config.batchSize || 10
    this.BATCH_TIMEOUT = config.batchTimeout || 5000
    this.MAX_QUEUE_SIZE = config.maxQueueSize || 100
    this.enableConsole = config.enableConsole !== false
    this.sessionId = this.generateSessionId()
    this.setupGlobalErrorHandlers()
  }

  private setupGlobalErrorHandlers(): void {
    window.addEventListener('error', event => {
      this.error('Unhandled JavaScript error', {
        category: 'system',
        error: {
          name: event.error?.name || 'Error',
          message: event.message,
          stack: event.error?.stack,
        },
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      })
    })

    window.addEventListener('unhandledrejection', event => {
      this.error('Unhandled promise rejection', {
        category: 'system',
        error: {
          name: 'UnhandledPromiseRejection',
          message: event.reason?.message || String(event.reason),
          stack: event.reason?.stack,
        },
      })
    })
  }

  error(message: string, context?: Partial<LogContext>): void {
    this.log('error', message, context)
  }

  warn(message: string, context?: Partial<LogContext>): void {
    this.log('warn', message, context)
  }

  info(message: string, context?: Partial<LogContext>): void {
    this.log('info', message, context)
  }

  debug(message: string, context?: Partial<LogContext>): void {
    this.log('debug', message, context)
  }

  private log(level: LogLevel, message: string, context?: Partial<LogContext>): void {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      category: context?.category || 'system',
      message: this.sanitizeMessage(message),
      context: this.buildContext(context),
      error: context?.error,
      metadata: context?.metadata,
    }

    if (this.enableConsole) {
      this.logToConsole(entry)
    }

    this.queueLog(entry)
  }

  private buildContext(context?: Partial<LogContext>): LogContext {
    const authState = useAuthStore.getState()
    return {
      userId: authState.user?.id,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      browser: this.getBrowserInfo(),
      timestamp: new Date().toISOString(),
      ...context,
    }
  }

  private sanitizeMessage(message: string): string {
    return message
      .replace(/password[=:]\s*\S+/gi, 'password=***')
      .replace(/token[=:]\s*\S+/gi, 'token=***')
      .replace(/key[=:]\s*\S+/gi, 'key=***')
      .replace(/secret[=:]\s*\S+/gi, 'secret=***')
      .replace(/authorization[=:]\s*.+/gi, 'authorization=***')
  }

  private queueLog(entry: LogEntry): void {
    if (this.logQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flushLogs()
    }
    this.logQueue.push(entry)
    if (this.logQueue.length >= this.BATCH_SIZE) {
      this.flushLogs()
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushLogs()
      }, this.BATCH_TIMEOUT)
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return
    const logsToSend = [...this.logQueue]
    this.logQueue = []
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    try {
      await this.sendLogs(logsToSend)
    } catch {
      if (this.logQueue.length < this.MAX_QUEUE_SIZE) {
        this.logQueue.unshift(...logsToSend)
      }
    }
  }

  private async sendLogs(logsParam: LogEntry[]): Promise<void> {
    // Future: send to logging service (Sentry, etc.)
    // Avoid unused parameter warning
    void logsParam
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    const stored = sessionStorage.getItem('log-session-id')
    if (stored) return stored
    const newId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('log-session-id', newId)
    return newId
  }

  private getBrowserInfo(): BrowserInfo {
    const ua = navigator.userAgent
    let browserName = 'Unknown'
    let browserVersion = 'Unknown'
    let os = 'Unknown'

    if (ua.indexOf('Firefox') > -1) {
      browserName = 'Firefox'
      browserVersion = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown'
    } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
      browserName = 'Chrome'
      browserVersion = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown'
    } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
      browserName = 'Safari'
      browserVersion = ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown'
    } else if (ua.indexOf('Edg') > -1) {
      browserName = 'Edge'
      browserVersion = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown'
    }

    if (ua.indexOf('Win') > -1) os = 'Windows'
    else if (ua.indexOf('Mac') > -1) os = 'MacOS'
    else if (ua.indexOf('Linux') > -1) os = 'Linux'
    else if (ua.indexOf('Android') > -1) os = 'Android'
    else if (ua.indexOf('iOS') > -1) os = 'iOS'

    return { name: browserName, version: browserVersion, os }
  }

  private logToConsole(entry: LogEntry): void {
    const styles: Record<LogLevel, string> = {
      error: 'color: #ff4444; font-weight: bold',
      warn: 'color: #ffaa00; font-weight: bold',
      info: 'color: #4444ff; font-weight: bold',
      debug: 'color: #888888',
    }
    console.log(
      `%c[${entry.level.toUpperCase()}] ${entry.category}`,
      styles[entry.level],
      entry.message,
      entry.context
    )
  }

  public flush(): Promise<void> {
    return this.flushLogs()
  }

  public destroy(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    this.flushLogs()
  }

  logApiError(error: ApiError, request: RequestContext): void {
    this.error('API request failed', {
      category: 'api',
      error: {
        name: error.name,
        message: error.message,
        status: error.status,
        endpoint: request.url,
        method: request.method,
      },
      metadata: {
        requestId: request.requestId,
        duration: request.duration,
      },
    })
  }

  logAuthError(error: AuthError, context: AuthContext): void {
    this.error('Authentication error', {
      category: 'auth',
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
      },
      metadata: {
        action: context.action,
        tokenPresent: !!context.token,
      },
    })
  }

  logExecutionError(error: ExecutionError, code: string): void {
    this.error('Code execution error', {
      category: 'execution',
      error: {
        name: error.name,
        message: error.message,
        language: error.language,
      },
      metadata: {
        codeSnippet: code.substring(0, 200),
      },
    })
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger({
  batchSize: 10,
  batchTimeout: 5000,
  maxQueueSize: 100,
  enableConsole: false,
})
