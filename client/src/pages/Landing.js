import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLinkedinIn,
  faInstagram,
  faGithub,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

const aboutUsImage =
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const logoSrc = `${process.env.PUBLIC_URL}/logo.png`;

const Landing = ({ handleLoginClick }) => {
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        }
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const handleInternalNavLinkClick = (e, targetId) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      window.history.pushState(null, "", `#${targetId}`);
    } else {
      window.location.href = `/#${targetId}`;
    }
  };

  return (
    <>
      {/* Sección Hero - Fondo completo en F3F4F6 */}
      {/* El div interno con max-w-7xl tendrá el contenido, pero el fondo se extiende con la sección */}
      <section className="bg-bg-default-section relative py-12 md:py-24 text-center">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-10 relative z-10 flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900 mb-6">
            <span className="block">La forma inteligente de organizar</span>
            <span className="block text-primary">
              tus referencias académicas
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mb-10">
            Simplifica tu investigación con RefMind: gestiona, cita y accede a
            tus fuentes de forma eficiente. ¡Concentra tu energía en lo que
            realmente importa!
          </p>

          <button
            onClick={handleLoginClick}
            className="transition-all duration-300 w-full md:w-auto border border-transparent rounded font-semibold tracking-wide text-md px-8 py-4 focus:outline-none focus:shadow-outline bg-primary text-primary-foreground hover:bg-indigo-800 hover:text-gray-200"
          >
            Empieza a Investigar Ahora
          </button>
        </div>
      </section>

      {/* SECCIÓN "SOBRE NOSOTROS" - Con efecto inclinado */}
      <section
        id="sobre-nosotros"
        className="bg-bg-default-section relative py-26 md:py-34 overflow-hidden"
      >
        {/* Este div será el fondo inclinado Menta */}
        <div className="absolute inset-1 transform -skew-y-[8deg] origin-top-left bg-bg-about-us-mint z-0">
          {/* El skew-y del -8deg es una aproximación visual. Ajusta el valor si lo necesitas.
              También asegúrate de que el z-index sea menor que el contenido */}
        </div>

        {/* Contenido de la sección "Sobre Nosotros" */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
          <div className="text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1F2937] mb-8">
              Sobre Nosotros
            </h2>
            <p className="text-lg text-[#1F2937] mb-6">
              RefMind nace de la necesidad de simplificar el proceso de
              investigación académica. Sabemos que la gestión de referencias
              puede ser tediosa y robarte tiempo valioso. Por eso, hemos creado
              una plataforma intuitiva y potente que te permite dedicarte a lo
              que realmente importa: la creación y el análisis de conocimiento.
            </p>
            <p className="text-lg text-[#1F2937]">
              Nuestro equipo está comprometido con la innovación y la mejora
              continua, escuchando siempre a nuestra comunidad de usuarios para
              ofrecer una herramienta que realmente haga la diferencia en tu
              trayectoria académica.
            </p>
          </div>

          <div className="mt-8 md:mt-0 flex justify-center w-full">
            <img
              src={aboutUsImage}
              alt="Mesa con libros y apuntes"
              className="rounded-lg shadow-xl w-full h-auto object-cover md:max-h-96"
            />
          </div>
        </div>
      </section>

      {/* Sección de Características/Ventajas - MISMO TONO QUE HERO Y FOOTER (F3F4F6) */}
      <section className="bg-bg-default-section py-16 md:py-24 px-6 md:px-10">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12">
            ¿Por qué elegir RefMind?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Los cards dentro de esta sección pueden seguir siendo bg-white */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="text-primary text-4xl mb-4">✨</div>
              <h3 className="text-xl font-semibold mb-3">Gestión Intuitiva</h3>
              <p className="text-gray-600">
                Organiza tus artículos, libros y citas de forma sencilla con
                nuestra interfaz amigable.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="text-primary text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-3">Citas Rápidas</h3>
              <p className="text-gray-600">
                Genera citas y bibliografías en segundos, adaptadas a los
                estilos más populares.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="text-primary text-4xl mb-4">💡</div>
              <h3 className="text-xl font-semibold mb-3">Acceso Inteligente</h3>
              <p className="text-gray-600">
                Encuentra la información que necesitas al instante con potentes
                herramientas de búsqueda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Ahora con el color bg-default-section (#F3F4F6) */}
      <div className="bg-bg-default-section text-gray-800 py-8">
        <footer className="w-full max-w-7xl mx-auto px-6 md:px-10 text-sm">
          <div className="relative flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright y Licencia (Izquierda) */}
            <div className="text-center md:text-left order-3 md:order-1 flex-shrink-0">
              <p className="whitespace-nowrap">
                © {new Date().getFullYear()} RefMind | MIT License
              </p>
            </div>

            {/* Logo (Centro) */}
            <div className="order-1 md:order-2 md:absolute md:left-1/2 md:-translate-x-1/2 flex justify-center items-center">
              <Link
                to="#"
                className="flex items-center justify-center"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <img src={logoSrc} alt="RefMind Logo" className="h-20 w-auto" />
              </Link>
            </div>

            {/* Enlaces y Redes Sociales (Derecha) */}
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 order-2 md:order-3 md:ml-auto">
              {/* Enlaces de Navegación */}
              <div className="flex space-x-6">
                <Link
                  to="#"
                  className="hover:text-primary transition-colors duration-200 whitespace-nowrap"
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Home
                </Link>
                <a
                  href="#sobre-nosotros"
                  onClick={(e) =>
                    handleInternalNavLinkClick(e, "sobre-nosotros")
                  }
                  className="hover:text-primary transition-colors duration-200 whitespace-nowrap"
                >
                  Sobre Nosotros
                </a>
                <a
                  href="https://github.com/CristianJoseMoreno/ProyectoIntegradoDAW"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors duration-200 whitespace-nowrap"
                >
                  Soporte
                </a>
              </div>
              {/* Iconos de Redes Sociales */}
              <div className="flex space-x-4">
                <a
                  href="https://linkedin.com/in/tuperfil"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-primary transition-colors duration-200 text-lg"
                  aria-label="LinkedIn"
                >
                  <FontAwesomeIcon icon={faLinkedinIn} />
                </a>
                <a
                  href="mailto:tucorreo@example.com"
                  className="text-gray-700 hover:text-primary transition-colors duration-200 text-lg"
                  aria-label="Gmail"
                >
                  <FontAwesomeIcon icon={faEnvelope} />
                </a>
                <a
                  href="https://github.com/CristianJoseMoreno/ProyectoIntegradoDAW"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-primary transition-colors duration-200 text-lg"
                  aria-label="GitHub"
                >
                  <FontAwesomeIcon icon={faGithub} />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Landing;
