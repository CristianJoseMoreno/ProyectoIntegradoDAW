import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Research from "./pages/Research";
import PrivateRoute from "./components/PrivateRoute";
import References from "./pages/References";
import { Toaster, toast } from "react-hot-toast";

/**
 * @file Componente principal de la aplicación.
 * @description Configura el enrutamiento, la autenticación de usuario (JWT y Google OAuth),
 * la gestión de tokens de acceso de Google y la carga de las APIs de Google Drive/Picker.
 */

function App() {
  const navigate = useNavigate();

  /**
   * Estado para almacenar la información del usuario autenticado de la aplicación (decodificado del JWT).
   * @type {object | null}
   */
  const [user, setUser] = useState(null);

  /**
   * Estado para manejar errores de inicio de sesión.
   * @type {string | null}
   */
  const [loginError, setLoginError] = useState(null);

  /**
   * Estado para controlar la visibilidad del modal de inicio de sesión/error.
   * @type {boolean}
   */
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  /**
   * Estado para almacenar el token de acceso de Google.
   * @type {string | null}
   */
  const [googleAccessToken, setGoogleAccessToken] = useState(null);

  /**
   * Estado para indicar si las APIs de Google (Drive y Picker) están listas para usar.
   * @type {boolean}
   */
  const [areGoogleApisReady, setAreGoogleApisReady] = useState(false);

  /**
   * Hook de efecto para verificar el token JWT de la aplicación al cargar o recargar la página.
   * Decodifica el token, verifica su expiración y establece el estado del usuario.
   */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;
        if (decoded.exp < now) {
          handleLogout();
        } else {
          setUser(decoded);
        }
      } catch (error) {
        handleLogout();
      }
    }
  }, [navigate]);

  /**
   * Hook de efecto para cargar los scripts de Google Identity Services y Google API Client Library.
   * Se ejecuta una sola vez al montar el componente para asegurar que los scripts estén disponibles.
   */
  useEffect(() => {
    if (!document.getElementById("google-oauth-gsi")) {
      const scriptGsi = document.createElement("script");
      scriptGsi.src = "https://accounts.google.com/gsi/client";
      scriptGsi.async = true;
      scriptGsi.defer = true;
      scriptGsi.id = "google-oauth-gsi";
      document.body.appendChild(scriptGsi);
    }

    if (!document.getElementById("google-api-client")) {
      const scriptApiClient = document.createElement("script");
      scriptApiClient.src = "https://apis.google.com/js/api.js";
      scriptApiClient.async = true;
      scriptApiClient.defer = true;
      scriptApiClient.id = "google-api-client";
      document.body.appendChild(scriptApiClient);
    }
  }, []);

  /**
   * Hook de efecto para refrescar el token de acceso de Google.
   * Se ejecuta cuando el usuario está logueado en la aplicación y no hay un `googleAccessToken` válido.
   */
  useEffect(() => {
    if (user && !googleAccessToken) {
      const refreshGoogleToken = async () => {
        try {
          const res = await fetch("/api/google/refresh-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          const data = await res.json();
          if (data.success && data.googleAccessToken) {
            setGoogleAccessToken(data.googleAccessToken);
          } else {
            console.warn(data.message);
            setGoogleAccessToken(null);
          }
        } catch (error) {
          console.error(error);
          setGoogleAccessToken(null);
        }
      };

      refreshGoogleToken();
    }
  }, [user, googleAccessToken]);

  /**
   * Hook de efecto para cargar las APIs específicas de Google (Drive y Picker).
   * Se ejecuta solo si se tiene un `googleAccessToken` y las APIs aún no están listas.
   */
  useEffect(() => {
    if (googleAccessToken && !areGoogleApisReady) {
      const checkGapiAndLoadApis = () => {
        if (window.gapi) {
          window.gapi.load("client:picker", {
            callback: () => {
              window.gapi.client.setApiKey(
                process.env.REACT_APP_GOOGLE_API_KEY
              );
              window.gapi.client.load("drive", "v3", () => {
                setAreGoogleApisReady(true);
              });
            },
            onerror: (err) => {
              console.error(err);
              toast.error("No se pudo cargar la API de Google Picker.");
              setAreGoogleApisReady(false);
            },
          });
        } else {
          setTimeout(checkGapiAndLoadApis, 100);
        }
      };
      checkGapiAndLoadApis();
    }
  }, [googleAccessToken, areGoogleApisReady]);

  /**
   * Maneja el proceso de cierre de sesión del usuario.
   * Limpia el token JWT, los estados de usuario y tokens de Google, y redirige a la página de inicio.
   * @returns {void}
   */
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setGoogleAccessToken(null);
    setAreGoogleApisReady(false);
    navigate("/");
  };

  /**
   * Inicia el flujo de autenticación de Google OAuth.
   * Solicita un código de autorización y lo envía al backend para el intercambio de tokens.
   * @returns {void}
   */
  const handleLoginClick = () => {
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

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      scope:
        "openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly",
      ux_mode: "popup",
      access_type: "offline",
      callback: async (response) => {
        if (!response.code) {
          setLoginModalOpen(false);
          return;
        }

        try {
          const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: response.code }),
          });

          const data = await res.json();
          if (data.success) {
            localStorage.setItem("token", data.token);
            setUser(jwtDecode(data.token));
            setLoginModalOpen(false);
            navigate("/research");
            if (data.googleAccessToken) {
              setGoogleAccessToken(data.googleAccessToken);
            } else {
              console.warn("Backend no proporcionó googleAccessToken.");
            }
          } else {
            setLoginError(data.message || "Error al iniciar sesión");
            setLoginModalOpen(true);
          }
        } catch (error) {
          console.error(error);
          setLoginError("No se pudo conectar con el servidor.");
          setLoginModalOpen(true);
        }
      },
    });
    client.requestCode();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Toaster
        position="top-center"
        toastOptions={{
          className: "bg-gray-100 text-gray-900 rounded-lg shadow-lg",
          style: {
            padding: "16px",
            color: "#333",
            minWidth: "300px",
          },
          success: {
            iconTheme: {
              primary: "#4F46E5",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444",
              secondary: "#fff",
            },
          },
        }}
      />
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
          path="/research"
          element={
            <PrivateRoute user={user}>
              <Research
                googleAccessToken={googleAccessToken}
                areGoogleApisReady={areGoogleApisReady}
              />
            </PrivateRoute>
          }
        />
        <Route
          path="/references"
          element={
            <PrivateRoute user={user}>
              <References user={user} />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
