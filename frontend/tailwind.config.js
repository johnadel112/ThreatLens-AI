/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        soc: {
          bg: '#030712',
          'bg-elevated': '#0a0f1e',
          surface: 'rgba(12, 20, 38, 0.72)',
          'surface-solid': '#0f172a',
          border: 'rgba(56, 189, 248, 0.14)',
          'border-bright': 'rgba(34, 211, 238, 0.35)',
          accent: '#22d3ee',
          'accent-dim': '#0891b2',
          purple: '#a855f7',
          warning: '#f59e0b',
          critical: '#ef4444',
          success: '#10b981',
          info: '#60a5fa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
        'glow-cyan': '0 0 24px rgba(34, 211, 238, 0.18)',
        'glow-critical': '0 0 24px rgba(239, 68, 68, 0.2)',
      },
      backgroundImage: {
        'cyber-grid':
          'linear-gradient(rgba(34,211,238,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.04) 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      backgroundSize: {
        grid: '48px 48px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        scan: 'scan 2.5s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        ticker: 'ticker 30s linear infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { opacity: 0.4, transform: 'translateY(0)' },
          '50%': { opacity: 1, transform: 'translateY(4px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
