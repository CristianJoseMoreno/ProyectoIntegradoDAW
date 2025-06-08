import React, { useState, useEffect } from "react";
import AppSidebar from "../components/AppSidebar";
import ReferencesListSection from "../components/ReferencesListSection";
import UserProfile from "../components/UserProfile";
import toast from "react-hot-toast";

/**
 * @file Componente principal de la página de Referencias.
 * @description Permite al usuario gestionar sus referencias bibliográficas y su perfil de usuario,
 * alternando entre ambas secciones.
 */

/**
 * Componente References.
 * @param {object} props - Propiedades del componente.
 * @param {object} props.user - Objeto de usuario autenticado, pasado desde `App.js`. Contiene información básica del usuario (decodificada del JWT).
 * @returns {JSX.Element} El componente de la página de referencias y perfil.
 */
export default function References({ user }) {
  /**
   * Estado para controlar la sección activa mostrada en la página.
   * Puede ser 'references' para la lista de referencias o 'profile' para el perfil de usuario.
   * @type {'references' | 'profile'}
   */
  const [activeSection, setActiveSection] = useState("references");

  /**
   * Estado para almacenar los datos detallados del usuario obtenidos del backend.
   * Solo se carga cuando la sección activa es 'profile'.
   * @type {object | null}
   */
  const [userData, setUserData] = useState(null);

  /**
   * Estado para indicar si los datos detallados del usuario están siendo cargados.
   * @type {boolean}
   */
  const [loadingUser, setLoadingUser] = useState(true);

  /**
   * Estado para almacenar cualquier error ocurrido durante la carga de los datos del usuario.
   * @type {string | null}
   */
  const [errorUser, setErrorUser] = useState(null);

  /**
   * Hook de efecto para cargar los datos detallados del usuario desde el backend.
   * Se ejecuta solo si la `activeSection` es 'profile' y los `userData` no han sido cargados
   * o si el `user` prop (desde `App.js`) ha cambiado.
   */
  useEffect(() => {
    if (
      activeSection !== "profile" ||
      (userData && user && userData.id === user.id)
    ) {
      setLoadingUser(false);
      return;
    }

    /**
     * Función asincrónica para obtener los datos del usuario del backend.
     * @returns {Promise<void>}
     */
    const fetchUserData = async () => {
      setLoadingUser(true);
      setErrorUser(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No hay token de autenticación.");
        }

        const res = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.message || "Error al obtener datos del usuario."
          );
        }

        const data = await res.json();
        setUserData(data);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setErrorUser(err.message);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [activeSection, user, userData]);

  /**
   * Maneja la actualización de los datos del perfil del usuario en el backend.
   * Envía los campos actualizados al servidor y actualiza el estado `userData` localmente.
   * Muestra un toast de éxito o error.
   * @param {object} updatedFields - Un objeto con los campos del usuario a actualizar.
   * @returns {Promise<void>}
   */
  const handleUpdateUser = async (updatedFields) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No hay token de autenticación para actualizar.");
      }

      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedFields),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al actualizar perfil.");
      }

      const data = await res.json();
      setUserData(data.user);
      toast.success("Perfil actualizado con éxito!");
    } catch (error) {
      console.error("Error updating user profile:", error);
      toast.error("Error al actualizar el perfil: " + error.message);
    }
  };

  return (
    <div className="flex h-screen p-6 pt-24 bg-gray-50 gap-6">
      <AppSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-100 gray:bg-gray-100">
        {activeSection === "references" ? (
          <ReferencesListSection />
        ) : (
          <UserProfile
            user={userData}
            loading={loadingUser}
            error={errorUser}
            onUpdateUser={handleUpdateUser}
          />
        )}
      </div>
    </div>
  );
}
