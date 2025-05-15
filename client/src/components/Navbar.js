import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import LoginModal from "./LoginModal";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);

  let user = null;

  if (token) {
    try {
      user = jwtDecode(token);
    } catch {
      localStorage.removeItem("token");
      navigate("/");
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Cargar el script de Google OAuth solo una vez
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

  const handleLoginClick = () => {
    if (
      !window.google ||
      !window.google.accounts ||
      !window.google.accounts.oauth2
    ) {
      setLoginError("El cliente de Google OAuth no está cargado.");
      setLoginModalOpen(true);
      return;
    }

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      ux_mode: "popup",
      callback: async (response) => {
        setLoading(false);
        if (!response.code) {
          setLoginModalOpen(true);
          setLoading(false);
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
            setLoginModalOpen(false);
            navigate("/investigar");
          } else {
            setLoginError("Error en el inicio de sesión: " + data.message);
          }
        } catch (error) {
          setLoginError("Error de conexión. Intenta más tarde.");
        }
      },
    });

    client.requestCode();
  };

  // Cerrar menú al hacer click fuera
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
    <>
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
            <button
              onClick={handleLoginClick}
              className="text-gray-700 hover:text-primary-foreground"
            >
              Login con Google
            </button>
          )}
        </div>
      </nav>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => {
          setLoginModalOpen(false);
          setLoginError(null);
          setLoading(false);
        }}
        error={loginError}
        loading={loading}
      />
    </>
  );
};

export default Navbar;
