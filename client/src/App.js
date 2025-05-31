import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Investigar from "./pages/Investigar";
import PrivateRoute from "./components/PrivateRoute";
import Referencias from "./pages/Referencias";

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;
        if (decoded.exp < now) {
          localStorage.removeItem("token");
          setUser(null); // Asegura que el usuario se limpia si el token expiró
          navigate("/");
        } else {
          setUser(decoded);
        }
      } catch (error) {
        console.error("Error al decodificar el token:", error);
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");
      }
    }
  }, [navigate]);

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

  // Función para cerrar sesión: Elimina el token, resetea el usuario y redirige.
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  // Función para iniciar sesión con Google OAuth.
  const handleLoginClick = () => {
    // Verifica si el cliente de Google OAuth está cargado.
    if (
      !window.google ||
      !window.google.accounts ||
      !window.google.accounts.oauth2
    ) {
      console.error("Google OAuth client no cargado");
      setLoginError("El servicio de Google no se pudo cargar.");
      setLoginModalOpen(true);
      return;
    }

    // Inicializa el cliente de código OAuth de Google.
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      ux_mode: "popup",
      callback: async (response) => {
        if (!response.code) {
          // Si el usuario cierra el popup o cancela, no hacemos nada.
          setLoginModalOpen(false); // Cierra el modal de error si estaba abierto
          return;
        }

        try {
          // Envía el código de autorización al backend para el intercambio por el token JWT.
          const res = await fetch("http://localhost:5000/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: response.code }),
          });

          const data = await res.json();
          if (data.success) {
            localStorage.setItem("token", data.token); // Guarda el token recibido
            setUser(jwtDecode(data.token)); // Decodifica y establece el usuario
            setLoginModalOpen(false); // Cierra el modal de login/error
            navigate("/investigar"); // Redirige al usuario
          } else {
            setLoginError(data.message || "Error al iniciar sesión"); // Establece el mensaje de error
            setLoginModalOpen(true); // Abre el modal con el error
          }
        } catch (error) {
          console.error("Error login:", error);
          setLoginError("No se pudo conectar con el servidor.");
          setLoginModalOpen(true);
        }
      },
    });

    client.requestCode(); // Solicita el código de autorización.
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar
        user={user}
        handleLogout={handleLogout}
        handleLoginClick={handleLoginClick}
      />
      <Routes>
        <Route
          path="/"
          element={<Landing handleLoginClick={handleLoginClick} />}
        />
        <Route
          path="/investigar"
          element={
            <PrivateRoute user={user}>
              <Investigar />
            </PrivateRoute>
          }
        />
        <Route
          path="/referencias"
          element={
            <PrivateRoute user={user}>
              <Referencias />
            </PrivateRoute>
          }
        />
      </Routes>

      {loginModalOpen && (
        <LoginModal
          isOpen={loginModalOpen}
          error={loginError}
          onClose={() => setLoginModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
