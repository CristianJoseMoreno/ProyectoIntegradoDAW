import React from "react";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
      <h1 className="text-lg font-bold">Referencias App</h1>

      {user && (
        <div className="flex items-center gap-4">
          <img
            src={user.picture}
            alt={`Avatar de ${user.name}`}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <span className="text-sm font-medium">{user.name}</span>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Cerrar sesión"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
