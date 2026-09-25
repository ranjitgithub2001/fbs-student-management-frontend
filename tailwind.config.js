/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fbs: {
          yellow: '#C8D400',
          green: '#8DC63F',
          dark: '#3A3A3A',
          card: '#444444',
          darker: '#2E2E2E',
          border: '#565656',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        heading: ['Syne', 'sans-serif'],
      }
    },
  },
  plugins: [],
}