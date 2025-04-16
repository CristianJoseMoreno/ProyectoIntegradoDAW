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
      const { ourToken, user } = res.data;

      // Lo guardamos usando el contexto
      login(ourToken, user);
    } catch (err) {
      console.error("Error al autenticar con el backend:", err);
    }
  };

  return (
    <div className="text-center mt-6">
      <h2 className="text-lg font-medium mb-4">Inicia sesión con Google</h2>
      <GoogleLogin
        onSuccess={handleLoginSuccess}
        onError={() => alert("Error al iniciar sesión")}
      />
    </div>
  );
};

export default Login;
