import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Research from "./pages/Research";
import PrivateRoute from "./components/PrivateRoute";
import References from "./pages/References";
import { Toaster } from "react-hot-toast";

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState(null);
  // Nuevo estado para indicar si las APIs de Google Picker/Drive están listas
  const [areGoogleApisReady, setAreGoogleApisReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;
        if (decoded.exp < now) {
          localStorage.removeItem("token");
          setGoogleAccessToken(null);
          setUser(null); // Asegura que el usuario se limpia si el token expiró
          navigate("/");
        } else {
          setUser(decoded);
          // Opcional: Si tienes el access_token en localStorage y no quieres refrescarlo inmediatamente,
          // podrías cargarlo aquí, pero la estrategia de refresco es mejor.
        }
      } catch (error) {
        localStorage.removeItem("token");
        setGoogleAccessToken(null);
        setUser(null);
        navigate("/");
      }
    }
  }, [navigate]);

  // Este useEffect cargará ambos scripts de Google
  useEffect(() => {
    // Cargar el script de Google Identity Services (para OAuth)
    if (!document.getElementById("google-oauth-gsi")) {
      const scriptGsi = document.createElement("script");
      scriptGsi.src = "https://accounts.google.com/gsi/client";
      scriptGsi.async = true;
      scriptGsi.defer = true;
      scriptGsi.id = "google-oauth-gsi"; // Renombrar ID para claridad
      document.body.appendChild(scriptGsi);
    }

    // Cargar el script de la Google API Client Library (para gapi.load, gapi.client, gapi.picker)
    if (!document.getElementById("google-api-client")) {
      const scriptApiClient = document.createElement("script");
      scriptApiClient.src = "https://apis.google.com/js/api.js";
      scriptApiClient.async = true;
      scriptApiClient.defer = true;
      scriptApiClient.id = "google-api-client";
      document.body.appendChild(scriptApiClient);
    }
  }, []); // Se ejecuta una sola vez al montar el componente

  // NUEVO useEffect para manejar la persistencia del googleAccessToken
  useEffect(() => {
    // Solo intentar refrescar si el usuario está logueado en tu app (user no es null)
    // y si no tenemos un googleAccessToken válido aún.
    // Esto se ejecutará cuando `user` se establezca al recargar la página si hay un token de sesión.
    if (user && !googleAccessToken) {
      const refreshGoogleToken = async () => {
        try {
          const res = await fetch(
            "http://localhost:5000/api/google/refresh-token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`, // Envía tu JWT de sesión
              },
            }
          );

          const data = await res.json();
          if (data.success && data.googleAccessToken) {
            setGoogleAccessToken(data.googleAccessToken);
          } else {
            console.warn(
              "No se pudo refrescar el Google Access Token o no se obtuvo.",
              data.message
            );
            // Podrías considerar aquí: si falla el refresh, forzar un re-login de Google
            // o deshabilitar la funcionalidad de Drive hasta que el usuario se autentique de nuevo con Google.
            setGoogleAccessToken(null); // Asegura que sea null si el refresh falla
          }
        } catch (error) {
          console.error(
            "Error al intentar refrescar el token de Google:",
            error
          );
          setGoogleAccessToken(null); // Limpiar si hay un error grave de conexión
        }
      };

      refreshGoogleToken();
    }
  }, [user, googleAccessToken]); // Depende de `user` (para saber si hay sesión) y `googleAccessToken` (para evitar bucles si ya lo tenemos)

  // useEffect para cargar las APIs de Google Drive y Picker
  useEffect(() => {
    // Solo si tenemos un token de acceso de Google Y las APIs no están listas aún
    if (googleAccessToken && !areGoogleApisReady) {
      const checkGapiAndLoadApis = () => {
        // Espera activa hasta que window.gapi esté definido
        if (window.gapi) {
          window.gapi.load("client:picker", {
            callback: () => {
              window.gapi.client.setApiKey(
                process.env.REACT_APP_GOOGLE_API_KEY
              ); // Establece la API Key globalmente
              window.gapi.client.load("drive", "v3", () => {
                setAreGoogleApisReady(true); // <--- ¡MARCAR COMO LISTO!
              });
            },
            onerror: (err) => {
              console.error("Error al cargar Google Picker API:", err);
              toast.error("No se pudo cargar la API de Google Picker.");
              setAreGoogleApisReady(false); // Marcar como no listas en caso de error
            },
          });
        } else {
          // Si gapi aún no está definido, reintenta después de un breve período
          setTimeout(checkGapiAndLoadApis, 100);
        }
      };

      checkGapiAndLoadApis(); // Inicia la verificación
    }
    // Añadir `areGoogleApisReady` al array de dependencias para evitar recargas si ya están listas
  }, [googleAccessToken, areGoogleApisReady]);

  // Función para cerrar sesión: Elimina el token, resetea el usuario y redirige.
  const handleLogout = () => {
    localStorage.removeItem("token");
    // Opcional: También podrías querer limpiar cualquier refresh_token asociado en tu backend aquí,
    // pero eso es más complejo y no es estrictamente necesario para el funcionamiento básico.
    setUser(null);
    setGoogleAccessToken(null); // Asegura que el token de Google también se limpie
    setAreGoogleApisReady(false); // Resetear estado de APIs de Google
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
      scope:
        "openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly",
      ux_mode: "popup",
      access_type: "offline", // Esto asegura que Google te dé un refresh_token
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
            localStorage.setItem("token", data.token); // Guarda el token de sesión de tu app
            setUser(jwtDecode(data.token)); // Decodifica y establece el usuario
            setLoginModalOpen(false); // Cierra el modal de login/error
            navigate("/research"); // Redirige al usuario
            if (data.googleAccessToken) {
              setGoogleAccessToken(data.googleAccessToken);
              // Aquí, el backend ya habrá guardado el refresh_token si se obtuvo
              // No es necesario que el frontend lo sepa
            } else {
              console.warn(
                "Backend no proporcionó googleAccessToken. La funcionalidad de Drive podría fallar."
              );
            }
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
      <Toaster
        position="top-center" // Centrado en la parte superior
        toastOptions={{
          className: "bg-gray-100 text-gray-900 rounded-lg shadow-lg", // Fondo gris 100 y estilos generales
          style: {
            padding: "16px",
            color: "#333", // Color del texto general del toast
            minWidth: "300px",
          },
          success: {
            iconTheme: {
              primary: "#4F46E5", // Color primario índigo para el icono de éxito
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444", // Color rojo para el icono de error
              secondary: "#fff",
            },
          },
          // Puedes añadir estilos para `loading` o `custom` si los usas
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
                areGoogleApisReady={areGoogleApisReady} // Puedes pasar esto si quieres usarlo para deshabilitar botones en Research
              />
            </PrivateRoute>
          }
        />
        <Route
          path="/references"
          element={
            <PrivateRoute user={user}>
              <References user={user} /> {/* <--- ¡ESTE ES EL CAMBIO! */}
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
