/**
 * Centralized Toaster configuration
 * Extracted from App.tsx to follow Single Responsibility Principle
 */
export const toasterConfig = {
  duration: 4000,
  style: {
    background: '#1f2937',
    color: '#f9fafb',
    border: '1px solid #374151',
  },
  success: {
    iconTheme: {
      primary: '#10b981',
      secondary: '#f9fafb',
    },
  },
  error: {
    // Text-only error notices must not block the retry action underneath them.
    style: {
      pointerEvents: 'none' as const,
    },
    iconTheme: {
      primary: '#ef4444',
      secondary: '#f9fafb',
    },
  },
}
