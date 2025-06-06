// src/sections/ReferencesListSection.js
import React, { useState, useEffect } from "react";
import ReferenceCard from "../components/ReferenceCard";
import ReferenceFormModal from "../components/ReferenceFormModal";
import toast from "react-hot-toast";
import PromptConfirmModal from "../components/PromptConfirmModal"; // ¡Importa la nueva modal unificada!

function ReferencesListSection() {
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [referenceToEdit, setReferenceToEdit] = useState(null);

  // NUEVOS ESTADOS para la modal de confirmación de eliminación
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [referenceToDeleteId, setReferenceToDeleteId] = useState(null); // Para guardar el ID de la referencia a eliminar

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    fetchReferences();
  }, []);

  const fetchReferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        // En lugar de throw new Error, mejor un toast y salir para una mejor UX
        toast.error("No autenticado. Por favor, inicia sesión.");
        setLoading(false); // Asegúrate de quitar el loading
        return;
      }

      const response = await fetch("http://localhost:5000/api/references", {
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
      setReferences(data);
    } catch (err) {
      console.error("Error al obtener referencias:", err);
      setError(err.message);
      toast.error(`Error al cargar las referencias: ${err.message}`); // Mensaje más descriptivo al usuario
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir la modal de confirmación antes de eliminar
  const requestDeleteConfirmation = (id) => {
    setReferenceToDeleteId(id);
    setIsConfirmModalOpen(true);
  };

  // Lógica real de eliminación, que se ejecuta si el usuario confirma
  const executeDeleteReference = async () => {
    if (!referenceToDeleteId) return; // Asegurarse de que hay un ID para eliminar

    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        toast.error("No autenticado. Por favor, inicia sesión.");
        setLoading(false);
        setIsConfirmModalOpen(false); // <-- Añadir aquí también para errores tempranos

        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/references/${referenceToDeleteId}`,
        {
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

      setReferences((prevRefs) =>
        prevRefs.filter((ref) => ref._id !== referenceToDeleteId)
      );
      toast.success("Referencia eliminada con éxito.");
      setIsConfirmModalOpen(false);
    } catch (err) {
      console.error("Error al eliminar referencia:", err); // Para la consola
      setError(err.message); // Para mostrar en pantalla si es necesario
      toast.error(`Error al eliminar la referencia: ${err.message}`); // Mensaje para el usuario
      setIsConfirmModalOpen(false);
    } finally {
      setLoading(false);
      setReferenceToDeleteId(null); // Limpiar el ID después de la operación
      // La modal se cierra automáticamente en PromptConfirmModal después de onConfirm
    }
  };

  const openEditModal = (reference) => {
    setReferenceToEdit(reference);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setReferenceToEdit(null);
  };

  // Función para cerrar la modal de confirmación (si el usuario pulsa Cancelar)
  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setReferenceToDeleteId(null); // Limpiar el ID también al cancelar
  };

  const handleReferenceSaveSuccess = () => {
    fetchReferences();
  };

  return (
    <section className="flex flex-col h-full bg-white rounded-3xl p-6 md:p-8 shadow-lg overflow-hidden bg-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center w-full text-gray-100">
          Mis Referencias
        </h2>
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

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 flex flex-col gap-4">
        {!loading &&
          !error &&
          references.map((ref) => (
            <ReferenceCard
              key={ref._id}
              reference={ref}
              isListView={true}
              onEdit={openEditModal}
              onDelete={requestDeleteConfirmation} // COMENTARIO ELIMINADO COMPLETAMENTE DE ESTA LÍNEA
            />
          ))}
      </div>

      <ReferenceFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSaveSuccess={handleReferenceSaveSuccess}
        referenceToEdit={referenceToEdit}
        forTextEditor={false}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN - ¡Ahora usa PromptConfirmModal! */}
      <PromptConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal}
        onConfirm={executeDeleteReference}
        title="¿Eliminar referencia?"
        message="¿Estás seguro de que quieres eliminar esta referencia? Esta acción es irreversible."
        showInputField={false} // Muy importante: ¡NO mostrar campo de texto para una confirmación!
        iconType="warning" // Para que muestre el icono de advertencia
        confirmButtonText="Eliminar" // Texto más específico para el botón de confirmación
        cancelButtonText="Cancelar"
      />
    </section>
  );
}

export default ReferencesListSection;
