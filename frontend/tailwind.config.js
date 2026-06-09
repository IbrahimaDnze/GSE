/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#0d7a5e',
          700: '#065f46',
          800: '#064e3b',
          900: '#022c22',
          DEFAULT: '#0d7a5e',
        },
        navy: {
          900: '#0a1f1a',
          800: '#133626',
          700: '#1a4a3e',
          600: '#2A7D4F',
          500: '#3a8d5f',
          DEFAULT: '#133626',
        },
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b8860b',
          800: '#92400e',
          900: '#78350f',
          DEFAULT: '#d97706',
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(13, 122, 94, 0.06), 0 1px 2px rgba(13, 122, 94, 0.04)',
        'card-hover': '0 4px 12px rgba(13, 122, 94, 0.10), 0 2px 4px rgba(13, 122, 94, 0.06)',
        'sidebar': '4px 0 24px rgba(13, 122, 94, 0.12)',
      },
    },
  },
  plugins: [],
}
