import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { GoogleLogin } from "@react-oauth/google";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showGoogleLogin, setShowGoogleLogin] = useState(false);
  const menuRef = useRef(null);
  let user = null;

  if (token) {
    try {
      user = jwtDecode(token);
    } catch (err) {
      console.error("Error al decodificar el token", err);
      localStorage.removeItem("token");
      navigate("/login");
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleLoginSuccess = async (response) => {
    const idToken = response.credential;
    if (!idToken) return;

    try {
      const res = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        navigate("/investigar");
      }
    } catch (err) {
      console.error("Error en login:", err);
    }
  };

  // Cierre de menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-white shadow-lg p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-primary">
        RefMind
      </Link>

      <div className="flex items-center space-x-4 relative">
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

            <div className="relative" ref={menuRef}>
              <img
                src={user?.picture}
                alt="Perfil"
                className="w-9 h-9 rounded-full cursor-pointer border hover:scale-105 transition-transform"
                onClick={() => setMenuOpen((prev) => !prev)}
              />
              <div
                className={`absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-50 transform transition-all duration-200 origin-top ${
                  menuOpen
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                <div className="px-4 py-2 text-sm text-gray-700 border-b">
                  {user?.name}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowGoogleLogin(true)}
              className="text-gray-700 hover:text-primary-foreground"
            >
              Login
            </button>
            {showGoogleLogin && (
              <div className="absolute right-0 top-12 z-50 bg-white p-2 rounded shadow-lg">
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={() => console.log("Error al iniciar sesión")}
                  useOneTflow="redirect"
                />
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
