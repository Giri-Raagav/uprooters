import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          wine: {
            DEFAULT: '#58111A',
            light: '#722F37',
            dark: '#3D0B12',
            soft: '#FBF4F5',
          },
          emerald: {
            DEFAULT: '#013328',
            light: '#024D3D',
            dark: '#012019',
            soft: '#F0F7F5',
          },
          accent: {
            DEFAULT: '#F2B94F',
            light: '#F5C772',
            dark: '#D99E32',
            soft: '#FEF8EE',
          },
          cloudy: {
            DEFAULT: '#94A3B8',
            light: '#CBD5E1',
            dark: '#64748B',
            soft: '#F8FAFC',
          },
        },
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
    },
  },
  plugins: [],
}

export default config
