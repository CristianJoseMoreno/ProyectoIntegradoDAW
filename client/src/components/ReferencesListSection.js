// src/sections/ReferencesListSection.js
import React, { useState, useEffect } from "react";
import ReferenceCard from "../components/ReferenceCard";
import ReferenceFormModal from "../components/ReferenceFormModal"; // Asegúrate de que esta ruta sea correcta
import { faThLarge, faList } from "@fortawesome/free-solid-svg-icons"; // Estos iconos parecen no usarse en el JSX, pero los mantengo

function ReferencesListSection() {
  const [references, setReferences] = useState([]); // Estado para las referencias reales del backend
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar la modal de añadir/editar
  const [referenceToEdit, setReferenceToEdit] = useState(null); // Estado para la referencia que se está editando

  // Función para obtener el token de autenticación (adapta esto a tu método)
  const getToken = () => localStorage.getItem("token");

  // Efecto para cargar las referencias al montar el componente
  useEffect(() => {
    fetchReferences();
  }, []); // Se ejecuta una vez al montar

  const fetchReferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        throw new Error("No autenticado. Por favor, inicia sesión.");
      }

      const response = await fetch("http://localhost:5000/api/references", {
        // Asegúrate de que la URL sea absoluta si estás usando un proxy en desarrollo o ajusta según tu configuración
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Error al cargar las referencias."
        );
      }

      const data = await response.json();
      setReferences(data); // Asume que el backend devuelve un array de referencias
    } catch (err) {
      console.error("Error al obtener referencias:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // handleSaveReference se elimina de aquí. La lógica de guardar/actualizar ahora está en ReferenceFormModal.
  // La función fetchReferences se llamará en onSaveSuccess del modal.

  const handleDeleteReference = async (id) => {
    if (
      !window.confirm(
        "¿Estás seguro de que quieres eliminar esta referencia? Esta acción es irreversible."
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        throw new Error("No autenticado. Por favor, inicia sesión.");
      }

      const response = await fetch(
        `http://localhost:5000/api/references/${id}`,
        {
          // Asegúrate de que la URL sea absoluta
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Error al eliminar la referencia."
        );
      }

      // Actualiza el estado localmente para una UI más rápida
      setReferences((prevRefs) => prevRefs.filter((ref) => ref._id !== id));
      alert("Referencia eliminada con éxito.");
    } catch (err) {
      console.error("Error al eliminar referencia:", err);
      setError(err.message);
      alert(`Error al eliminar la referencia: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para controlar la modal
  // openAddModal se elimina porque ya no se añade desde aquí.
  // const openAddModal = () => {
  //   setReferenceToEdit(null);
  //   setIsModalOpen(true);
  // };

  const openEditModal = (reference) => {
    setReferenceToEdit(reference); // Pasa la referencia a editar a la modal
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setReferenceToEdit(null); // Limpia la referencia al cerrar la modal
  };

  // Callback para el ReferenceFormModal cuando el guardado es exitoso
  const handleReferenceSaveSuccess = () => {
    fetchReferences(); // Refresca la lista de referencias
    // No es necesario un alert aquí, ReferenceFormModal ya maneja sus propios estados
    // de carga/error y onSaveSuccess es un callback de éxito silencioso.
  };

  return (
    <section className="flex flex-col h-full bg-white rounded-3xl p-6 md:p-8 shadow-lg overflow-hidden bg-gray-100">
      {/* Encabezado de la sección de referencias */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center w-full text-gray-100">
          Mis Referencias
        </h2>

        {/* Acciones de vista y botón Añadir */}
        {/* El botón "Añadir Referencia" se ha eliminado de aquí */}
        {/*
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 text-sm md:text-base"
          >
            Añadir Referencia
          </button>
        </div>
        */}
      </div>

      {loading && (
        <p className="text-center text-gray-600 dark:text-gray-300">
          Cargando referencias...
        </p>
      )}
      {error && (
        <p className="text-center text-red-600 dark:text-red-400">
          Error: {error}
        </p>
      )}

      {!loading && !error && references.length === 0 && (
        <p className="text-center text-gray-600 mt-4 dark:text-gray-300">
          No tienes referencias guardadas.
        </p>
      )}

      <div
        className="flex-1 overflow-y-auto pr-2 -mr-2 flex flex-col gap-4" // Siempre en vista de lista
      >
        {!loading &&
          !error &&
          references.map((ref) => (
            <ReferenceCard
              key={ref._id} // Usar _id de MongoDB
              reference={ref}
              isListView={true} // Siempre es vista de lista
              onEdit={openEditModal} // Pasa la función para editar
              onDelete={handleDeleteReference} // Pasa la función para eliminar
            />
          ))}
      </div>

      {/* Modal para añadir/editar referencia */}
      <ReferenceFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSaveSuccess={handleReferenceSaveSuccess} // Nuevo callback de éxito
        referenceToEdit={referenceToEdit}
        forTextEditor={false} // Muy importante: indica que NO es para el editor de texto
      />
    </section>
  );
}

export default ReferencesListSection;
