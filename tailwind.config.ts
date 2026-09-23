import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // data-theme="dark" attribute on <html> drives Tailwind dark: variants
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // ── Fixed brand colors ──────────────────────────────────────
        brand: {
          wine: {
            DEFAULT: '#58111A',
            light:   '#722F37',
            dark:    '#3D0B12',
            soft:    '#FBF4F5',
          },
          emerald: {
            DEFAULT: '#013328',
            light:   '#024D3D',
            dark:    '#012019',
            soft:    '#F0F7F5',
          },
          accent: {
            DEFAULT: '#F2B94F',
            light:   '#F5C772',
            dark:    '#D99E32',
            soft:    '#FEF8EE',
          },
          cloudy: {
            DEFAULT: '#94A3B8',
            light:   '#CBD5E1',
            dark:    '#64748B',
            soft:    '#F8FAFC',
          },
        },

        // ── Semantic tokens (CSS-variable-backed, theme-aware) ──────
        surface:         'var(--surface)',
        'surface-raised':'var(--surface-raised)',
        'surface-overlay':'var(--surface-overlay)',
        'border-base':   'var(--border)',
        'text-base':     'var(--text-primary)',
        'text-sub':      'var(--text-secondary)',
        'text-muted':    'var(--text-muted)',
        'sidebar-bg':    'var(--sidebar-bg)',
        'sidebar-border':'var(--sidebar-border)',
      },

      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif',
        ],
      },

      // ── Keyframes ─────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },

      // ── Animation utilities ────────────────────────────────────────
      animation: {
        'fade-in':       'fade-in 0.2s ease-out both',
        'slide-up':      'slide-up 0.25s ease-out both',
        'slide-in-left': 'slide-in-left 0.22s ease-out both',
        'slide-in-right':'slide-in-right 0.22s ease-out both',
        'scale-in':      'scale-in 0.2s ease-out both',
      },

      // ── Transition timing ──────────────────────────────────────────
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

export default config
