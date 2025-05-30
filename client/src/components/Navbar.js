import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom"; // Solo Link es necesario aquí

// El LoginModal ya no se importa ni se renderiza aquí, lo hace App.js
// import LoginModal from "./LoginModal";
const logoSrc = `${process.env.PUBLIC_URL}/logo.png`;

// Recibe las props del componente padre (App.js)
const Navbar = ({ user, handleLogout, handleLoginClick }) => {
  // Estos estados y refs son locales del Navbar, controlan la UI del navbar.
  const [menuOpen, setMenuOpen] = useState(false); // Para el menú desplegable del avatar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Para el menú de hamburguesa en móvil
  const menuRef = useRef(null); // Ref para el menú desplegable del usuario
  const mobileNavRef = useRef(null); // Ref para el menú de navegación móvil

  // Detecta clics fuera del menú (tanto el de usuario como el móvil) para cerrarlos automáticamente.
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Cierra el menú desplegable del usuario si el clic es fuera de él.
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      // Cierra el menú de navegación móvil si el clic es fuera de él y no en el botón de hamburguesa.
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target)) {
        if (e.target.closest("#mobile-menu-button")) return; // Evita cerrar si se hizo clic en el botón de hamburguesa
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Función interna para el logout que también cierra el menú desplegable.
  const internalHandleLogout = () => {
    handleLogout(); // Llama a la función handleLogout pasada como prop desde App.js
    setMenuOpen(false); // Cierra el menú desplegable del avatar
  };

  return (
    <nav className="px-5 sm:px-10 md:px-10 md:py-5 lg:px-20 flex items-center justify-between bg-white text-gray-900 shadow-lg">
      {/* Sección del Logo de RefMind */}
      <div>
        <Link to="/" className="flex items-center">
          {/* Puedes reemplazar esta URL con la ruta a tu propio logo de RefMind si lo tienes */}
          <img src={logoSrc} alt="RefMind Logo" className="h-20 w-auto" />
        </Link>
      </div>

      {/* Contenedor principal de la navegación y botón de hamburguesa */}
      <div className="flex items-center">
        {/* Botón de hamburguesa visible solo en pantallas pequeñas (móvil) */}
        <button
          id="mobile-menu-button"
          className="cursor-pointer text-gray-700 hover:text-gray-900 w-6 md:hidden"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Abrir menú de navegación"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Contenedor del menú de navegación (visible en md, oculto/modal en móvil) */}
        <div
          ref={mobileNavRef} // Ref para detectar clics fuera del menú móvil
          className={`
            ${mobileMenuOpen ? "block" : "hidden"}
            md:block
            fixed top-0 inset-x-0 bg-white p-8 m-4 z-30 rounded-lg shadow
            md:rounded-none md:shadow-none md:p-0 md:m-0 md:relative md:bg-transparent
          `}
        >
          {/* Botón de cierre para el menú móvil */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-0 right-0 mr-5 mt-5 md:hidden"
            aria-label="Cerrar menú de navegación"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Enlaces de navegación y sección de usuario/login */}
          <div className="flex flex-col items-center justify-center md:flex-row">
            {user ? ( // Si hay un usuario logueado
              <>
                {/* Enlace a "Investigar" */}
                <Link
                  to="/investigar"
                  className="
                    transition-all duration-100 ease-in-out pb-1 border-b-2 border-transparent
                    hover:border-primary hover:text-primary md:mr-8 text-lg md:text-sm
                    font-bold tracking-wide my-4 md:my-0 text-gray-700
                  "
                  onClick={() => setMobileMenuOpen(false)} // Cierra el menú móvil al navegar
                >
                  Investigar
                </Link>
                {/* Enlace a "Gestionar Referencias" */}
                <Link
                  to="/referencias"
                  className="
                    transition-all duration-100 ease-in-out pb-1 border-b-2 border-transparent
                    hover:border-primary hover:text-primary md:mr-8 text-lg md:text-sm
                    font-bold tracking-wide my-4 md:my-0 text-gray-700
                  "
                  onClick={() => setMobileMenuOpen(false)} // Cierra el menú móvil al navegar
                >
                  Gestionar Referencias
                </Link>

                {/* Perfil de usuario y menú desplegable */}
                <div className="relative my-4 md:my-0 md:ml-4" ref={menuRef}>
                  <img
                    src={user?.picture || "https://via.placeholder.com/40"} // Muestra la imagen del usuario o un placeholder
                    alt="Perfil"
                    className="w-9 h-9 rounded-full cursor-pointer border hover:scale-105 transition-transform"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-haspopup="true"
                    aria-expanded={menuOpen ? "true" : "false"}
                  />
                  <div
                    className={`
                      absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-50
                      transform transition-all duration-200 origin-top
                      ${
                        menuOpen
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-95 pointer-events-none"
                      }
                    `}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                  >
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      {user?.name || "Usuario"}
                    </div>
                    <button
                      onClick={internalHandleLogout} // Llama a la función interna de logout
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Botón de Login con Google para usuarios no autenticados
              <button
                onClick={() => {
                  handleLoginClick(); // Llama a la función de login pasada como prop
                  setMobileMenuOpen(false); // Cierra el menú móvil al hacer clic en login
                }}
                className="
                  border border-transparent rounded font-semibold tracking-wide text-lg md:text-sm px-5 py-3 md:py-2
                  focus:outline-none focus:shadow-outline bg-primary text-primary-foreground
                  hover:bg-indigo-800 hover:text-gray-200 transition-all duration-300 ease-in-out
                  my-4 md:my-0 w-full md:w-auto
                "
              >
                Login con Google
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
