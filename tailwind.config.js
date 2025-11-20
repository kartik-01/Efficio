/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
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
  plugins: [require("tailwindcss-animate")]
};

