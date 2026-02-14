/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        zenitRed: '#DC2626',
        zenitOrange: '#F97316',
        zenitBlack: '#0A0A0A',
        zenitGray: '#F3F4F6',
        zenitTextMuted: '#9CA3AF',
      },
      fontFamily: {
        
      }
    },
  },
  plugins: [],
}