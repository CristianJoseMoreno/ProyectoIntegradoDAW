import React from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";

export default function Login() {
  const handleLoginSuccess = async (response) => {
    const token = response.credential;
    if (!token) return alert("Token inválido");

    try {
      // Envía el token ID a tu backend
      const res = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Login exitoso");
        localStorage.setItem("token", data.token); // ← Guardar token
        window.location.href = "/dashboard";
      } else {
        alert("Login fallido");
      }
    } catch (err) {
      console.error("Error en login:", err);
      alert("Error en el servidor");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-semibold text-center text-primary mb-6">
          Iniciar sesión
        </h2>
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => console.log("Error al iniciar sesión")}
            useOneTap
            theme="outline"
            shape="rectangular"
            text="signin_with"
            width="full"
            className="w-full py-2 border border-primary text-primary rounded-md hover:bg-primary-foreground hover:text-white transition-colors"
          />
        </GoogleOAuthProvider>
      </div>
    </div>
  );
}
