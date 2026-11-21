/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        deplo: {
          black: "#0A0A0A",
          cyan: "#00D2FF",
          violet: "#7928CA",
          slate: "#64748B",
          border: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["System"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
