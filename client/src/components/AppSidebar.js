import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faUser } from "@fortawesome/free-solid-svg-icons";

/**
 * @file Componente AppSidebar.
 * @description Barra lateral de navegación principal para la aplicación, permitiendo al usuario cambiar
 * entre diferentes secciones como "Referencias" y "Perfil".
 */

/**
 * Componente AppSidebar.
 * Una barra lateral de navegación que muestra iconos para acceder a diferentes secciones
 * de la aplicación, como la gestión de referencias y el perfil de usuario.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {string} props.activeSection - La sección actualmente activa, que determina el estilo del botón correspondiente. Puede ser "references" o "profile".
 * @param {function(string): void} props.setActiveSection - Callback para cambiar la sección activa al hacer clic en un botón.
 * @returns {JSX.Element} El componente de la barra lateral de la aplicación.
 */
function AppSidebar({ activeSection, setActiveSection }) {
  return (
    <aside className="w-20 md:w-24 flex-shrink-0 flex flex-col items-center py-8 bg-gray-100 text-white transition-colors duration-200 rounded-r-3xl">
      <nav className="flex flex-col items-center space-y-6 pt-6">
        <button
          onClick={() => setActiveSection("references")}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200
            ${
              activeSection === "references"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-blue-100 hover:text-blue-600"
            }`}
          aria-label="Ver referencias"
        >
          <FontAwesomeIcon icon={faBook} className="text-lg" />
        </button>

        <button
          onClick={() => setActiveSection("profile")}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200
            ${
              activeSection === "profile"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-blue-100 hover:text-blue-600"
            }`}
          aria-label="Ver perfil de usuario"
        >
          <FontAwesomeIcon icon={faUser} className="text-lg" />
        </button>
      </nav>
    </aside>
  );
}

export default AppSidebar;
