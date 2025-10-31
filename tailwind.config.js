/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./apps/**/*.{html,js,jsx,ts,tsx}",
    "./packages/**/*.{html,js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1D4ED8",
          secondary: "#9333EA",
          accent: "#F59E0B"
        }
      }
    }
  },
  plugins: []
};

