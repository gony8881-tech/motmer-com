import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Cairo", "Tajawal", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#f2f7f5",
          100: "#dfeee8",
          200: "#bcdccf",
          300: "#8fc3af",
          400: "#5fa48c",
          500: "#3e8570",
          600: "#2f6a5a",
          700: "#28564a",
          800: "#23453d",
          900: "#1f3a34",
        },
      },
      borderRadius: {
        md2: "10px",
      },
    },
  },
  plugins: [],
} satisfies Config;
