/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#f5f9ec',
          100: '#eaf6d6',
          200: '#d8f0ab',
          300: '#c0e47f',
          400: '#a7d55b',
          500: '#9CCB3C',
          600: '#7CB342',
          700: '#5f9b3f',
          800: '#4f7e38',
          900: '#355c2d'
        },
        primary: {
          50: '#f5f9ec',
          100: '#eaf6d6',
          200: '#d8f0ab',
          300: '#c0e47f',
          400: '#a7d55b',
          500: '#9CCB3C',
          600: '#7CB342',
          700: '#5f9b3f',
          800: '#4f7e38',
          900: '#355c2d'
        },
        accent: {
          400: '#d9f99d',
          500: '#bef264',
          600: '#a3e635'
        }
      }
    },
  },
  plugins: [],
}
