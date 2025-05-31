import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";

const logoSrc = `${process.env.PUBLIC_URL}/logo.png`;

const Navbar = ({ user, handleLogout, handleLoginClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const internalHandleLogout = () => {
    handleLogout();
    setMenuOpen(false);
  };

  return (
    <nav className="px-5 sm:px-10 md:px-10 md:py-5 lg:px-20 flex items-center justify-between bg-gray-100 text-gray-900 shadow-lg">
      {/* Logo */}
      <div>
        <Link to="/" className="flex items-center">
          <img src={logoSrc} alt="RefMind Logo" className="h-20 w-auto" />
        </Link>
      </div>

      {/* Botón hamburguesa para móvil (OCULTO EN DESKTOP, COMENTADO) */}
      {/*
      <button
        id="mobile-menu-button"
        className="cursor-pointer text-gray-700 hover:text-gray-900 w-6 md:hidden"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Abrir menú de navegación"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      */}

      {/* Enlaces de navegación en desktop */}
      <div className="flex flex-row items-center justify-center">
        {user ? (
          <>
            <Link
              to="/investigar"
              className="transition-all duration-100 ease-in-out pb-1 border-b-2 border-transparent hover:border-primary hover:text-primary text-lg font-bold tracking-wide mx-4 text-gray-700"
            >
              Investigar
            </Link>

            <Link
              to="/referencias"
              className="transition-all duration-100 ease-in-out pb-1 border-b-2 border-transparent hover:border-primary hover:text-primary text-lg font-bold tracking-wide mx-4 text-gray-700"
            >
              Gestionar Referencias
            </Link>

            {/* Perfil y menú */}
            <div className="relative ml-4" ref={menuRef}>
              <img
                src={user?.picture || "https://via.placeholder.com/40"}
                alt="Perfil"
                className="w-9 h-9 rounded-full cursor-pointer border hover:scale-105 transition-transform"
                onClick={() => setMenuOpen((prev) => !prev)}
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
              >
                <div className="px-4 py-2 text-sm text-gray-700 border-b">
                  {user?.name || "Usuario"}
                </div>
                <button
                  onClick={internalHandleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </>
        ) : (
          <button
            onClick={() => {
              handleLoginClick();
            }}
            className="border border-transparent rounded font-semibold tracking-wide text-lg px-5 py-3 focus:outline-none focus:shadow-outline bg-primary text-primary-foreground hover:bg-indigo-800 hover:text-gray-200 transition-all duration-300 ease-in-out mx-4"
          >
            Login con Google
          </button>
        )}
      </div>

      {/* MENÚ MÓVIL COMENTADO */}
      {/*
      <div
        ref={mobileNavRef}
        className={`
          ${mobileMenuOpen ? "block" : "hidden"}
          md:hidden
          fixed top-0 inset-x-0 bg-gray-100 p-8 m-4 z-30 rounded-lg shadow
        `}
      >
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-0 right-0 mr-5 mt-5"
          aria-label="Cerrar menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col items-center justify-center">
          <Link to="/investigar" className="my-4 text-lg font-bold text-gray-700">Investigar</Link>
          <Link to="/referencias" className="my-4 text-lg font-bold text-gray-700">Referencias</Link>
          <button onClick={handleLoginClick} className="my-4 text-lg font-bold text-primary">Login con Google</button>
        </div>
      </div>
      */}
    </nav>
  );
};

export default Navbar;
