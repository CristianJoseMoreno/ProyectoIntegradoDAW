import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" />; // Redirige a la landing si no hay token
  }

  try {
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000; // lo usaremos para controlar el tiempo del token

    if (decoded.exp < now) {
      localStorage.removeItem("token");
      return <Navigate to="/" />;
    }

    return children;
  } catch (error) {
    localStorage.removeItem("token");
    return <Navigate to="/" />;
  }
};

export default PrivateRoute;
