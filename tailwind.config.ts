import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

function withOpacity(variableName: string) {
  return ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          20: withOpacity("--primary-20"),
          500: withOpacity("--primary-500"),
          600: withOpacity("--primary-600"),
          700: withOpacity("--primary-700"),
        },
        green: {
          20: withOpacity("--green-20"),
          300: withOpacity("--green-300"),
          400: withOpacity("--green-400"),
          500: withOpacity("--green-500"),
        },
        yellow: {
          20: withOpacity("--yellow-20"),
          300: withOpacity("--yellow-300"),
          400: withOpacity("--yellow-400"),
          500: withOpacity("--yellow-500"),
        },
        red: {
          20: withOpacity("--red-20"),
          300: withOpacity("--red-300"),
          400: withOpacity("--red-400"),
          500: withOpacity("--red-500"),
        },
        gray: {
          20: withOpacity("--gray-20"),
          50: withOpacity("--gray-50"),
          100: withOpacity("--gray-100"),
          200: withOpacity("--gray-200"),
          300: withOpacity("--gray-300"),
          400: withOpacity("--gray-400"),
          500: withOpacity("--gray-500"),
          600: withOpacity("--gray-600"),
          700: withOpacity("--gray-700"),
          800: withOpacity("--gray-800"),
          900: withOpacity("--gray-900"),
        },
        orange: {
          1: withOpacity("--orange-1"),
          2: withOpacity("--orange-2"),
          3: withOpacity("--orange-3"),
        },
      },
      fontFamily: {
        sans: ["IRANSansX", "arial", "sans-serif"],
      },
      boxShadow: {
        menu: "4px 6px 8px 0px rgba(0, 0, 0, 0.2)",
        "post-box": "0px 2px 5px 0px rgba(0, 0, 0, 0.05)",
      },
      backgroundImage: {
        footer: "linear-gradient(180deg, #0F172A 0%, #071A48 100%)",
        "show-more-cover":
          "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #FFFFFF 100%)",
        "show-more-cover-gray":
          "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgb(var(--gray-50)) 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "spin-slow": "spinSlow 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        spinSlow: {
          to: { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".flex-center": {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        ".display-lg": {
          fontSize: "2.5rem",
          lineHeight: "3.75rem",
          fontWeight: "700",
        },
        ".display-sm": {
          fontSize: "2rem",
          lineHeight: "3rem",
          fontWeight: "700",
        },
        ".h1": {
          fontSize: "1.5rem",
          lineHeight: "2.25rem",
          fontWeight: "700",
        },
        ".h2": {
          fontSize: "1.25rem",
          lineHeight: "1.875rem",
          fontWeight: "700",
        },
        ".h3": {
          fontSize: "1.125rem",
          lineHeight: "1.75rem",
          fontWeight: "700",
        },
        ".h4": {
          fontSize: "1rem",
          lineHeight: "1.5rem",
          fontWeight: "700",
        },
        ".h5": {
          fontSize: "0.875rem",
          lineHeight: "1.3125rem",
          fontWeight: "700",
        },
        ".h6": {
          fontSize: "0.75rem",
          lineHeight: "1.125rem",
          fontWeight: "700",
        },
        ".subtitle-lg": {
          fontSize: "1rem",
          lineHeight: "1.75rem",
          fontWeight: "700",
        },
        ".subtitle-sm": {
          fontSize: "0.875rem",
          lineHeight: "1.5rem",
          fontWeight: "700",
        },
        ".body-lg": {
          fontSize: "1rem",
          lineHeight: "1.75rem",
          fontWeight: "400",
        },
        ".body-sm": {
          fontSize: "0.875rem",
          lineHeight: "1.5rem",
          fontWeight: "400",
        },
        ".caption": {
          fontSize: "0.75rem",
          lineHeight: "1.125rem",
          fontWeight: "400",
        },
        ".overline-font": {
          fontSize: "0.75rem",
          lineHeight: "1.125rem",
          fontWeight: "700",
        },
      });
    }),
  ],
};

export default config;
