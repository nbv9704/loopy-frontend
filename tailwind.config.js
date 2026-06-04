/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Safelist all color variants used in FileExplorer
    'border-yellow-400/50',
    'bg-yellow-400/5',
    'text-yellow-400',
    'border-cyan-400/50',
    'bg-cyan-400/5',
    'text-cyan-400',
    'border-blue-400/50',
    'bg-blue-400/5',
    'text-blue-400',
    'border-fuchsia-400/50',
    'bg-fuchsia-400/5',
    'text-fuchsia-400',
    'border-purple-400/50',
    'bg-purple-400/5',
    'text-purple-400',
    'border-orange-400/50',
    'bg-orange-400/5',
    'text-orange-400',
    'border-green-400/50',
    'bg-green-400/5',
    'text-green-400',
    'border-slate-400/50',
    'bg-slate-400/5',
    'text-slate-400',
    'border-indigo-400/50',
    'bg-indigo-400/5',
    'text-indigo-400',
    'border-red-400/50',
    'bg-red-400/5',
    'text-red-400',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        // Background colors
        'bg-primary': '#0B0F19',
        'bg-elevated': '#141922',
        'bg-subtle': '#1a202c',

        // Legacy support (will be phased out)
        'cyber-dark': '#0B0F19',
        'cyber-darker': '#0d1117',

        // Loopy brand colors from logo
        brand: {
          teal: '#54d9c4', // Primary - main brand color
          cyan: '#04c5e8', // Accent - bright highlights
          ocean: '#0b889c', // Secondary - medium tone
          dark: '#085361', // Dark - shadows and depth
        },

        // Admin UI colors (used by admin components)
        primary: {
          DEFAULT: '#54d9c4',
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6e0',
          300: '#5fe9ce',
          400: '#54d9c4',
          500: '#0fb9a0',
          600: '#099583',
          700: '#0b7669',
          800: '#0d5d54',
          900: '#0f4d46',
        },
        accent: '#04c5e8',
        secondary: '#0b889c',
        dark: '#085361',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(to right, rgba(84, 217, 196, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(84, 217, 196, 0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '40px 40px',
      },
      borderRadius: {
        card: '8px',
        button: '6px',
      },
    },
  },
  plugins: [typography],
}
