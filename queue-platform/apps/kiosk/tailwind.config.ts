import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        kioskBlue: "#082752",
        kioskOrange: "#FF8100",
        kioskOrangeHover: "#e36a0d"
      }
    }
  },
  plugins: []
};

export default config;
