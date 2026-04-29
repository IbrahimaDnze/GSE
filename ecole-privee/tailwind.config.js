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
          50:  '#EFF4FC',
          100: '#DAE5F7',
          200: '#B6CBEE',
          300: '#91B1E6',
          400: '#6C98DE',
          500: '#477ED5',
          600: '#2D68C4',
          700: '#2555A3',
          800: '#1E4482',
          900: '#163362',
          DEFAULT: '#2D68C4',
        },
        navy: {
          900: '#0A1525',
          800: '#0F1E35',
          700: '#152843',
          600: '#1a3254',
          500: '#1E3A63',
          DEFAULT: '#0F1E35',
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(15, 30, 53, 0.06), 0 1px 2px rgba(15, 30, 53, 0.04)',
        'card-hover': '0 4px 12px rgba(15, 30, 53, 0.10), 0 2px 4px rgba(15, 30, 53, 0.06)',
        'sidebar': '4px 0 24px rgba(15, 30, 53, 0.12)',
      },
    },
  },
  plugins: [],
}
