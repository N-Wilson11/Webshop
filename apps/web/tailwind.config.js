/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        surface: "var(--color-background)",
        ink: "var(--color-text)"
      },
      fontFamily: {
        display: ["Georgia", "serif"]
      }
    }
  },
  plugins: []
};
