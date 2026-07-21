/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Enterprise Brand Primary Scale (Sapphire / Royal Blue - Linear & Vercel style)
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Enterprise Dark Scale (Linear & Stripe #0B0F14 tone)
        slate: {
          950: '#0b0f14',
          900: '#101418',
          850: '#14181f',
          800: '#1a202c',
          750: '#222733',
          700: '#2d3748',
          600: '#4a5568',
          500: '#718096',
          400: '#a0aec0',
          300: '#cbd5e0',
          200: '#e2e8f0',
          100: '#edf2f7',
          50: '#f7fafc',
        },
        // Success Scale
        emerald: {
          500: '#10b981',
          600: '#059669',
          950: '#022c22',
        },
        // Warning Scale
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          950: '#451a03',
        },
        // Danger Scale
        rose: {
          500: '#f43f5e',
          600: '#e11d48',
          950: '#4c0519',
        },
      },
      boxShadow: {
        'subtle-xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'subtle-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'subtle-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'subtle-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'card-dark': '0 0 0 1px rgba(255, 255, 255, 0.06), 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
      },
      transitionTimingFunction: {
        'enterprise-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        '120': '120ms',
        '180': '180ms',
      },
    },
  },
  plugins: [],
};
