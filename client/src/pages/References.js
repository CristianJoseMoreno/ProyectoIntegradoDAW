import React, { useState, useEffect } from "react";
import AppSidebar from "../components/AppSidebar";
import ReferencesListSection from "../components/ReferencesListSection";
import UserProfile from "../components/UserProfile";
import toast from "react-hot-toast";

// Recibe el 'user' como prop de App.js (tal como lo corregimos en App.js)
export default function References({ user }) {
  // Usamos 'activeSection' para controlar qué se muestra, como en las versiones anteriores
  const [activeSection, setActiveSection] = useState("references"); // 'references' o 'profile'

  // El estado y la lógica de carga de userData ahora se harán condicionalmente
  // dentro de este componente, usando el 'user' prop recibido de App.js
  const [userData, setUserData] = useState(null); // Estado para los datos del usuario del backend
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState(null);

  // Función para obtener los datos del usuario del backend
  // Este useEffect solo se ejecuta si la sección activa es 'profile'
  // Y si user (prop de App.js) es válido y aún no tenemos userData.
  useEffect(() => {
    // Si la sección NO es 'profile', no necesitamos cargar datos adicionales del usuario.
    // O si ya tenemos userData y no hay cambios en el user prop, no volvemos a cargar.
    if (
      activeSection !== "profile" ||
      (userData && user && userData.id === user.id)
    ) {
      setLoadingUser(false); // No necesitamos cargar si no estamos en perfil o ya cargamos
      return;
    }

    const fetchUserData = async () => {
      setLoadingUser(true);
      setErrorUser(null); // Limpiar errores previos
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No hay token de autenticación.");
        }

        const res = await fetch("http://localhost:5000/api/users/me", {
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
        setUserData(data); // Almacena los datos del usuario
      } catch (err) {
        console.error("Error fetching user data:", err);
        setErrorUser(err.message);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [activeSection, user, userData]); // Depende de 'activeSection' para disparar la carga cuando se cambia a perfil,
  // de 'user' (el prop de App.js) para re-fetch si cambia la sesión,
  // y de 'userData' para evitar bucles de carga si ya tenemos los datos.

  // Función para actualizar los datos del usuario en el backend
  const handleUpdateUser = async (updatedFields) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No hay token de autenticación para actualizar.");
      }

      const res = await fetch("http://localhost:5000/api/users/me", {
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
      {/* Sidebar - Visible solo en el componente References */}
      <AppSidebar
        activeSection={activeSection} // <-- Pasa 'activeSection'
        setActiveSection={setActiveSection} // <-- Pasa 'setActiveSection'
      />

      {/* Contenido principal: Referencias o Perfil de Usuario */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-100 gray:bg-gray-100">
        {activeSection === "references" ? ( // Usa 'activeSection' para la renderización condicional
          <ReferencesListSection />
        ) : (
          <UserProfile
            user={userData} // Pasa los datos del usuario obtenidos del backend
            loading={loadingUser}
            error={errorUser}
            onUpdateUser={handleUpdateUser}
          />
        )}
      </div>
    </div>
  );
}
