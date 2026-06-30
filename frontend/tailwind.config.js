/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        soc: {
          bg: '#0f1419',
          surface: '#1a2332',
          border: '#2d3748',
          accent: '#06b6d4',
          warning: '#f59e0b',
          critical: '#ef4444',
          success: '#10b981',
        },
      },
    },
  },
  plugins: [],
};
