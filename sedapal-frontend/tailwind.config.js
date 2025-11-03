/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sedapal: {
          blue: '#1E3A8A',
          lightBlue: '#3B82F6',
          cyan: '#06B6D4',
          white: '#FFFFFF',
          gray: '#F3F4F6',
          darkGray: '#6B7280',
        }
      }
    },
  },
  plugins: [],
}
