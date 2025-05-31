module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(207 90% 54%)", // Tu azul/índigo actual
          foreground: "hsl(211 100% 99%)",
        },
        "bg-default-section": "#F3F4F6", // Color para la mayoría de las secciones (Hero, ¿Por qué elegir?, Footer)
        "bg-about-us-mint": "#E0F8F0", // Color para "Sobre Nosotros"
      },
      boxShadow: {
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
      transitionProperty: {
        shadow: "box-shadow",
        "colors-shadow":
          "background-color, border-color, color, fill, stroke, opacity, box-shadow",
      },
      transitionDuration: {
        400: "400ms",
      },
      transitionTimingFunction: {
        "ease-out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
      },
    },
  },
  plugins: [],
};
