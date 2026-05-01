import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - core dependencies
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Admin vendor chunks - admin-specific libraries
          'vendor-admin-ui': [
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
            'react-hook-form',
            '@hookform/resolvers',
            'zod',
            'zustand',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1000kb for admin chunks
  },
})
