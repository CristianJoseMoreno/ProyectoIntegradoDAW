import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-lg p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-primary">
        RefMind
      </Link>
      <div className="space-x-4">
        {token ? (
          <>
            <Link
              to="/investigar"
              className="text-gray-700 hover:text-primary-foreground"
            >
              Investigar
            </Link>
            <Link
              to="/referencias"
              className="text-gray-700 hover:text-primary-foreground"
            >
              Gestionar Referencias
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-700 hover:text-red-500"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="text-gray-700 hover:text-primary-foreground"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
