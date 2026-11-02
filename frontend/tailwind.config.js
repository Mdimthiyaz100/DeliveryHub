/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: '#FFFFFF',
          secondary: '#F7F7F7',
          card: '#FFFFFF',
          text: '#171717',
          muted: '#777777',
          border: '#EAEAEA',
          accent: '#F97316',
          dark: '#0F1012',
          cardDark: '#1A1C1E',
          borderDark: '#2C2E33',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'concept': '18px',
        'card': '16px',
        'button': '12px',
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'float': '0 10px 30px rgba(0, 0, 0, 0.08)',
        'modal': '0 20px 50px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}
