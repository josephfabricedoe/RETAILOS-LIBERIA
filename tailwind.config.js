/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        retail: {
          primary: 'var(--brand-primary, #0ea5e9)',
          secondary: 'var(--brand-secondary, #0284c7)',
          accent: 'var(--brand-accent, #38bdf8)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
