/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        title: ['Geo', 'cursive'],
        heading: ['UnifrakturMaguntia', 'Georgia', 'serif'],
      },
      colors: {
        dark: {
          bg: '#0a0a0a',
          surface: '#131313',
          border: '#1a1a1a',
          text: {
            primary: '#ffffff',
            secondary: '#a0a0a0',
            muted: '#666666',
          }
        }
      }
    },
  },
  plugins: [],
}
