/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#8B5CF6',    // Violet
        secondary: '#F59E0B',  // Amber
        background: '#0F0F0F', // Dark
        surface: '#1A1A1A',    // Slightly lighter
        muted: '#6B7280',      // Gray
      },
    },
  },
  plugins: [],
}
