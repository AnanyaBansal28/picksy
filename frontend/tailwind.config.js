/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFAFC',
        surface: '#FFFFFF',
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5', // Deep Royal Indigo primary
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        decision: {
          buy: '#10B981',       // Soft Emerald
          buyTint: '#ECFDF5',
          buyText: '#065F46',
          buyBorder: '#A7F3D0',
          wait: '#F59E0B',      // Warm Amber
          waitTint: '#FFFBEB',
          waitText: '#92400E',
          waitBorder: '#FDE68A',
          fake: '#EF4444',      // Soft Coral
          fakeTint: '#FEF2F2',
          fakeText: '#991B1B',
          fakeBorder: '#FECACA',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.04), 0 10px 25px -5px rgba(0, 0, 0, 0.05)',
        'elevated': '0 20px 35px -8px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04)',
        'glow': '0 0 25px -5px rgba(79, 70, 229, 0.25)',
      }
    },
  },
  plugins: [],
}
