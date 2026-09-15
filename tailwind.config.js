/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Source Sans 3', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        title: ['Nunito Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Nunito Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        site: {
          bg: '#ffffff',
          surface: '#f5f5f5',
          border: '#e5e5e5',
          text: {
            primary: '#0a0a0a',
            secondary: '#4a4a4a',
            muted: '#8a8a8a',
          }
        }
      }
    },
  },
  plugins: [],
}
