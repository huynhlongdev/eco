/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.liquid"],
  theme: {
    extend: {
      colors: {
        clifford: "#da373d",
        red: "#000",
      },
      backgroundColor: {
        overlay: "#00000045",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
        },
      },
    },
  },
  plugins: [],
};
