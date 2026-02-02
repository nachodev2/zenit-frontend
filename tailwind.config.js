/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // --- PALETA PRINCIPAL ---
        zenitBlack: '#0A0A0A',   // Negro puro
        zenitRed: '#DC2626',     // Rojo intenso
        zenitOrange: '#F97316',  // Naranja vibrante
        zenitWhite: '#FFFFFF',   // Blanco puro
        zenitGray: '#E5E5E5',    // Gris claro para fondos

        // --- ADAPTACIÓN MODO OSCURO ---
        zenitDarkSurface: '#171717', // Gris muy oscuro (para tarjetas en dark mode)
        zenitTextMuted: '#A1A1AA',   // Gris medio para textos secundarios
      },
    },
  },
  plugins: [],
}