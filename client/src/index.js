import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

/**
 * @file Punto de entrada principal de la aplicación React.
 * @description Configura el renderizado de la aplicación, incluyendo el router y el proveedor de autenticación de Google.
 */

/**
 * Obtiene el elemento DOM raíz donde se montará la aplicación React.
 * @type {HTMLElement}
 */
const rootElement = document.getElementById("root");

/**
 * Crea una raíz de React para renderizar la aplicación.
 * @type {ReactDOM.Root}
 */
const root = ReactDOM.createRoot(rootElement);

/**
 * Renderiza la aplicación principal de React en el elemento raíz del DOM.
 * Envuelve la aplicación con `BrowserRouter` para el enrutamiento y `GoogleOAuthProvider` para la autenticación de Google.
 * @returns {void}
 */
root.render(
  <BrowserRouter>
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </BrowserRouter>
);
