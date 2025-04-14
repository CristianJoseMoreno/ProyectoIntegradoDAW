import React from "react";
import Login from "../components/Login";
import Logout from "../components/Logout";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <h1>Bienvenido a la App de Referencias</h1>
      {isAuthenticated ? (
        <>
          <Logout />
          <p>
            Ir a <Link to="/referencias">Referencias</Link>
          </p>
        </>
      ) : (
        <Login />
      )}
    </div>
  );
};

export default Home;
