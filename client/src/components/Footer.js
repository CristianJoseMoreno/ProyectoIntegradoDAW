import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedinIn } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

const logoSrc = `${process.env.PUBLIC_URL}/logo.png`;

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
        // Copyright
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
        // Logo
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
        // Links + Redes Sociales
        React.createElement(
          "div",
          {
            className:
              "flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 order-2 md:order-3 md:ml-auto",
          },
          // Enlaces
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
          // Redes
          React.createElement(
            "div",
            { className: "flex space-x-4" },
            React.createElement(
              "a",
              {
                href: "https://linkedin.com/in/tuperfil",
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
                href: "mailto:tucorreo@example.com",
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
