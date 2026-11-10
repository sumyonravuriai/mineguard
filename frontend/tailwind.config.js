/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mine: {
          bg: "#0B1120",
          sidebar: "#111827",
          card: "#172033",
          cardSec: "#1E293B",
          border: "#263449",
          textPrimary: "#F8FAFC",
          textSecondary: "#94A3B8",
          success: "#22C55E",
          warning: "#F59E0B",
          critical: "#EF4444",
          info: "#3B82F6",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
