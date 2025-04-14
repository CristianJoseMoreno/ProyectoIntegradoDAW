import React from "react";
import { useAuth } from "../context/AuthContext";

const Logout = () => {
  const { logout } = useAuth();

  return <button onClick={logout}>Cerrar sesión</button>;
};

export default Logout;
