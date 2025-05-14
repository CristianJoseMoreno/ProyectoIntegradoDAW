// src/components/Navbar.js
import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-primary">
        RefMind
      </Link>
      <div className="space-x-4">
        <Link to="/" className="text-gray-700 hover:text-primary-foreground">
          Inicio
        </Link>
        <Link
          to="/login"
          className="text-gray-700 hover:text-primary-foreground"
        >
          Login
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
