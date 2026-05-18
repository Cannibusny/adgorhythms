/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          cyan: '#00D4FF',
          lime: '#B4FF00',
          dark: '#1A1D29',
          'dark-alt': '#1E1E36',
          purple: '#6C47FF',
        },
      },
    },
  },
  plugins: [],
};
