/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#38a5f8',
          500: '#0e87eb',
          600: '#026bc9',
          700: '#0355a3',
          800: '#074886',
          900: '#0c3d6f',
          950: '#08274a',
        },
        holo: {
          cyan: '#00f2fe',
          blue: '#4facfe',
          magenta: '#ff007f',
          glow: '#00d2ff',
          dark: '#050b1a',
          card: '#0a1530',
        },
        clinical: {
          improved: '#10b981',
          stable: '#3b82f6',
          monitoring: '#f59e0b',
          worsened: '#ef4444',
          neutral: '#64748b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        tamil: ['Noto Sans Tamil', 'Mukta Malar', 'Latha', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'heart-pulse': 'heartPulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'vascular-wave': 'vascularWave 3s ease-in-out infinite',
        'lung-breathe': 'lungBreathe 5s ease-in-out infinite',
        'ecg-draw': 'ecgDraw 2s linear infinite',
        'scan-line': 'scanLine 4s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        heartPulse: {
          '0%, 100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 12px rgba(255, 0, 128, 0.6))' },
          '15%': { transform: 'scale(1.18)', filter: 'drop-shadow(0 0 35px rgba(255, 20, 147, 0.95))' },
          '30%': { transform: 'scale(1.04)', filter: 'drop-shadow(0 0 18px rgba(255, 0, 128, 0.7))' },
          '45%': { transform: 'scale(1.14)', filter: 'drop-shadow(0 0 28px rgba(255, 60, 160, 0.9))' },
          '60%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 12px rgba(255, 0, 128, 0.5))' },
        },
        vascularWave: {
          '0%': { opacity: '0.4', strokeDashoffset: '100' },
          '50%': { opacity: '1', strokeDashoffset: '0' },
          '100%': { opacity: '0.4', strokeDashoffset: '-100' },
        },
        lungBreathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.06)', opacity: '1' },
        },
        ecgDraw: {
          '0%': { strokeDashoffset: '400' },
          '100%': { strokeDashoffset: '0' },
        },
        scanLine: {
          '0%': { top: '0%', opacity: '0' },
          '10%': { opacity: '0.8' },
          '90%': { opacity: '0.8' },
          '100%': { top: '100%', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
