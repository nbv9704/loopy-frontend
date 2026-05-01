/**
 * Logger Types — Shared type definitions for ErrorLogger service.
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

export interface LogContext {
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  browser?: BrowserInfo
  timestamp?: string
  category?: string
  error?: Record<string, any>
  metadata?: Record<string, any>
}

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  category: string
  message: string
  context: LogContext
  error?: Record<string, any>
  metadata?: Record<string, any>
}

export interface LoggerConfig {
  batchSize?: number
  batchTimeout?: number
  maxQueueSize?: number
  enableConsole?: boolean
}

export interface BrowserInfo {
  name: string
  version: string
  os: string
}

export interface ApiError extends Error {
  status?: number
  endpoint?: string
  method?: string
  code?: string
}

export interface AuthError extends Error {
  code?: string
}

export interface ExecutionError extends Error {
  language?: string
}

export interface RequestContext {
  url: string
  method: string
  requestId?: string
  duration?: number
}

export interface AuthContext {
  action: string
  token?: string
}
