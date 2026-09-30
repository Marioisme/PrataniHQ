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
        canvas: {
          DEFAULT: '#0a0e17',
          elevated: '#0e1422',
        },
        surface: {
          DEFAULT: '#121827',
          2: '#172033',
          3: '#1e2942',
          4: '#253352',
        },
        brand: {
          pratani: '#38bdf8',
          dikopi: '#f59e0b',
          kolektiva: '#a855f7',
          imagineer: '#f43f5e',
          evercraft: '#10b981',
          snm: '#06b6d4',
        },
        status: {
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
          sky: '#38bdf8',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        glow: '0 0 24px rgba(56, 189, 248, 0.16)',
        'glow-amber': '0 0 24px rgba(245, 158, 11, 0.2)',
      },
      borderColor: {
        subtle: 'rgba(255, 255, 255, 0.06)',
        accent: 'rgba(56, 189, 248, 0.25)',
      }
    },
  },
  plugins: [],
}
