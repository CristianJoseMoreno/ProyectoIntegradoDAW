import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedinIn } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

/**
 * @constant {string} logoSrc - La ruta al logotipo principal de la aplicación, utilizado en el footer.
 */
const logoSrc = `${process.env.PUBLIC_URL}/logo.png`;

/**
 * Componente Footer.
 * Representa el pie de página de la aplicación. Incluye información de copyright, el logo,
 * enlaces de navegación y enlaces a redes sociales.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {function(React.MouseEvent<HTMLAnchorElement>, string): void} props.onNavLinkClick - Callback que se ejecuta cuando se hace clic en un enlace de navegación interno (ej. "Sobre Nosotros"). Permite el desplazamiento suave a secciones.
 * @returns {JSX.Element} El componente del pie de página.
 */
function Footer({ onNavLinkClick }) {
  return React.createElement(
    "div",
    { className: "bg-bg-default-section text-gray-800 py-16" },
    React.createElement(
      "footer",
      { className: "w-full max-w-7xl mx-auto px-6 md:px-10 text-sm" },
      React.createElement("div", {
        className: "mx-auto w-3/5 border-t border-gray-300 mb-8",
      }),
      React.createElement(
        "div",
        {
          className:
            "relative flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0",
        },
        // Sección de Copyright
        React.createElement(
          "div",
          {
            className:
              "text-center md:text-left order-3 md:order-1 flex-shrink-0",
          },
          React.createElement(
            "p",
            { className: "whitespace-nowrap" },
            `© ${new Date().getFullYear()} RefMind`
          )
        ),
        // Sección del Logo
        React.createElement(
          "div",
          {
            className:
              "order-1 md:order-2 md:absolute md:left-1/2 md:-translate-x-1/2 flex justify-center items-center",
          },
          React.createElement(
            Link,
            {
              to: "#",
              onClick: (e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              },
              className: "flex items-center justify-center",
            },
            React.createElement("img", {
              src: logoSrc,
              alt: "RefMind Logo",
              className: "h-36 w-auto",
            })
          )
        ),
        // Sección de Enlaces y Redes Sociales
        React.createElement(
          "div",
          {
            className:
              "flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 order-2 md:order-3 md:ml-auto",
          },
          // Enlaces de navegación
          React.createElement(
            "div",
            { className: "flex space-x-6" },
            React.createElement(
              Link,
              {
                to: "#",
                className:
                  "hover:text-primary transition-colors duration-200 whitespace-nowrap",
                onClick: (e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                },
              },
              "Home"
            ),
            React.createElement(
              "a",
              {
                href: "#sobre-nosotros",
                className:
                  "hover:text-primary transition-colors duration-200 whitespace-nowrap",
                onClick: (e) => {
                  e.preventDefault();
                  onNavLinkClick?.(e, "sobre-nosotros");
                },
              },
              "Sobre Nosotros"
            ),
            React.createElement(
              "a",
              {
                href: "https://github.com/CristianJoseMoreno/ProyectoIntegradoDAW",
                target: "_blank",
                rel: "noopener noreferrer",
                className:
                  "hover:text-primary transition-colors duration-200 whitespace-nowrap",
              },
              "Soporte"
            )
          ),
          // Enlaces a Redes Sociales
          React.createElement(
            "div",
            { className: "flex space-x-4" },
            React.createElement(
              "a",
              {
                href: "https://www.linkedin.com/in/cristian-jose-m-494a7a269/",
                target: "_blank",
                rel: "noopener noreferrer",
                className:
                  "text-gray-700 hover:text-primary transition-colors duration-200 text-lg",
                "aria-label": "LinkedIn",
              },
              React.createElement(FontAwesomeIcon, { icon: faLinkedinIn })
            ),
            React.createElement(
              "a",
              {
                href: "mailto:cjmorenoberlanga@gmail.com",
                className:
                  "text-gray-700 hover:text-primary transition-colors duration-200 text-lg",
                "aria-label": "Gmail",
              },
              React.createElement(FontAwesomeIcon, { icon: faEnvelope })
            )
          )
        )
      )
    )
  );
}

export default Footer;
