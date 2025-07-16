/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        noto: ["Noto Sans KR", "sans-serif"],
      },
      colors: {
        game: {
          bg: "#1a1a2e",
          primary: "#16213e",
          accent: "#0f3460",
          text: "#e94560",
        },
      },
      animation: {
        "bounce-ball": "bounce 1s infinite",
      },
    },
  },
  plugins: [],
};
