/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E1F5EE',
          100: '#9FE1CB',
          200: '#6FC5A8',
          300: '#3FB28C',
          400: '#1D9E75',
          600: '#0F6E56',
          700: '#0B5D49',
          800: '#084C3C',
          900: '#085041',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
      },
    },
  },
  plugins: [],
};
