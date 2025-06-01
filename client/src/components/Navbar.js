import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";

const logoSrc = `${process.env.PUBLIC_URL}/logo.png`;
const googleLogoSrc = `${process.env.PUBLIC_URL}/logo_google.png`;

const Navbar = ({ user, handleLogout, handleLoginClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [profileImageError, setProfileImageError] = useState(false);

  const internalHandleLogout = () => {
    handleLogout();
    setMenuOpen(false);
  };

  // Restablecer el estado de error de la imagen si el usuario cambia (o al iniciar sesión)
  React.useEffect(() => {
    setProfileImageError(false); // Resetea el error cuando el user cambia
  }, [user]);

  // URL para el fallback de la imagen de perfil
  const defaultProfileImageUrl = "https://via.placeholder.com/40?text=C"; // O alguna imagen de perfil por defecto tuya

  return (
    <nav className="fixed z-30 h-20 w-full px-5 sm:px-2 md:px-3 md:py-1 lg:px-20 flex items-center justify-between bg-white text-gray-600 navbar-expand-lg shadow-lg">
      {/* Logo */}
      <div>
        <Link to="/" className="flex items-center">
          <img src={logoSrc} alt="RefMind Logo" className="h-21 w-28" />
        </Link>
      </div>
      <div className="flex flex-row items-center justify-center">
        {user ? (
          <>
            <Link
              to="/research"
              className="transition-all duration-100 ease-in-out pb-1 border-b-2 border-transparent hover:border-primary hover:text-primary text-base font-bold tracking-wide mx-4 text-gray-500"
            >
              Investigar
            </Link>

            <Link
              to="/references"
              className="transition-all duration-100 ease-in-out pb-1 border-b-2 border-transparent hover:border-primary hover:text-primary text-base font-bold tracking-wide mx-4 text-gray-500"
            >
              Gestionar Referencias
            </Link>

            {/* Perfil y menú */}
            <div className="relative ml-4" ref={menuRef}>
              {/* Lógica mejorada para la imagen de perfil */}
              {user?.picture && !profileImageError ? (
                <img
                  src={user.picture}
                  alt="Perfil"
                  className="w-9 h-9 rounded-full cursor-pointer border hover:scale-105 transition-transform"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  onError={(e) => {
                    // Si la imagen de Google falla, establece el error a true
                    console.error(
                      "Error al cargar la imagen de perfil de Google:",
                      e
                    );
                    setProfileImageError(true);
                  }}
                />
              ) : (
                // Fallback: si no hay imagen de Google o si la carga falló
                <div
                  className="w-9 h-9 rounded-full cursor-pointer border hover:scale-105 transition-transform bg-gray-300 flex items-center justify-center text-white text-sm font-semibold"
                  onClick={() => setMenuOpen((prev) => !prev)}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : "C"}
                </div>
              )}

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
          <div className="flex items-center space-x-3 ml-4">
            <span className="font-semibold text-base text-gray-500">Login</span>

            <button
              onClick={handleLoginClick}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-gray-300 shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              aria-label="Iniciar sesión con Google"
            >
              <img
                src={googleLogoSrc}
                alt="Logotipo de Google"
                className="w-5 h-5"
              />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
