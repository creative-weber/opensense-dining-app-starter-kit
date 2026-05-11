/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0d9488',
          dark: '#0f766e',
          light: '#ccfbf1',
        },
        surface: {
          DEFAULT: '#ffffff',
          2: '#f9fafb',
        },
        border: '#e5e7eb',
        muted: '#6b7280',
      },
    },
  },
  plugins: [],
};
