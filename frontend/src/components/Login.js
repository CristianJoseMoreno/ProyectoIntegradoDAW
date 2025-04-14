// src/components/Login.js
import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/google", {
        token: credentialResponse.credential,
      });

      // Recibimos el JWT de nuestro backend
      const ourToken = res.data.ourToken;

      // Lo guardamos usando el contexto
      login(ourToken);
    } catch (err) {
      console.error("Error al autenticar con el backend:", err);
    }
  };

  return (
    <div>
      <h2>Inicia sesión con Google</h2>
      <GoogleLogin
        onSuccess={handleLoginSuccess}
        onError={() => alert("Error al iniciar sesión")}
      />
    </div>
  );
};

export default Login;
