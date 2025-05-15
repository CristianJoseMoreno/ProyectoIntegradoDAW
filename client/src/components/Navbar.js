import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import LoginModal from "./LoginModal";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const menuRef = useRef(null);

  // Verifica token expirado al montar
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;
        if (decoded.exp < now) {
          localStorage.removeItem("token");
          navigate("/");
        } else {
          setUser(decoded);
        }
      } catch {
        localStorage.removeItem("token");
        navigate("/");
      }
    }
  }, []);

  // Carga script de Google OAuth al montar
  useEffect(() => {
    if (!document.getElementById("google-oauth")) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.id = "google-oauth";
      document.body.appendChild(script);
    }
  }, []);

  // Detecta clics fuera del menú para cerrarlo
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  // Manejo del login OAuth con error modal
  const handleLoginClick = () => {
    if (
      !window.google ||
      !window.google.accounts ||
      !window.google.accounts.oauth2
    ) {
      console.error("Google OAuth client no cargado");
      return;
    }

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      ux_mode: "popup",
      callback: async (response) => {
        if (!response.code) {
          // No mostramos mensaje, solo cerramos silenciosamente
          return;
        }

        try {
          const res = await fetch("http://localhost:5000/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: response.code }),
          });

          const data = await res.json();
          if (data.success) {
            localStorage.setItem("token", data.token);
            setUser(jwtDecode(data.token));
            navigate("/investigar");
          } else {
            setLoginError(data.message || "Error al iniciar sesión");
            setLoginModalOpen(true);
          }
        } catch (error) {
          console.error("Error login:", error);
          setLoginError("No se pudo conectar con el servidor.");
          setLoginModalOpen(true);
        }
      },
    });

    client.requestCode();
  };

  return (
    <nav className="bg-white shadow-lg p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-primary">
        RefMind
      </Link>

      <div className="flex items-center space-x-4 relative">
        {user ? (
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
          <button
            onClick={handleLoginClick}
            className="text-gray-700 hover:text-primary-foreground"
          >
            Login con Google
          </button>
        )}
      </div>

      {/* Modal para errores de login */}
      {loginModalOpen && (
        <LoginModal
          error={loginError}
          onClose={() => setLoginModalOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
