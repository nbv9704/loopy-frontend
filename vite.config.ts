import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@codemirror/lang-')) {
              return 'codemirror-langs'
            }
            if (id.includes('@codemirror') || id.includes('codemirror') || id.includes('@uiw')) {
              return 'codemirror-core'
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion'
            }
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'icons'
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 2000,
  },
})
