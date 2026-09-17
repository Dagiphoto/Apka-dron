/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './js/**/*.js'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff8ff', 100: '#dbeefe', 200: '#bfe3fe', 300: '#93d1fd',
          400: '#5fb6fa', 500: '#3897f2', 600: '#2578e6', 700: '#1e60c9',
          800: '#1f4fa3', 900: '#1e4380', 950: '#182a52'
        },
        ink: {
          50: '#f6f7f9', 100: '#eceef2', 200: '#d5d9e2', 300: '#b0b8c8',
          400: '#8590a8', 500: '#66718c', 600: '#525b73', 700: '#434a5e',
          800: '#3a4050', 900: '#1e2230', 950: '#12141d'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'Roboto', 'sans-serif']
      }
    }
  },
  plugins: []
};
