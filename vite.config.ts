import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { bootstrapLoading } from './scripts/bootstrap-loading'
import { PUBLIC_ENV_KEYS, validatePublicEnvironment } from './src/config/publicEnvironment'

export default defineConfig(({ command, mode }) => {
  validatePublicEnvironment(loadEnv(mode, process.cwd(), 'VITE_'), command === 'build')
  return {
    envPrefix: PUBLIC_ENV_KEYS,
    plugins: [react(), bootstrapLoading()],
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
  }
})
