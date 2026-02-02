/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        zenitBlack: "#121212",
        zenitNeon: "#D4FF00",
        zenitDarkGray: "#1E1E1E",
        zenitGray: "#2C2C2C",
      },
    },
  },
  plugins: [],
};
