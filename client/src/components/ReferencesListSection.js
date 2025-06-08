import React, { useState, useEffect } from "react";
import ReferenceCard from "../components/ReferenceCard";
import ReferenceFormModal from "../components/ReferenceFormModal";
import toast from "react-hot-toast";
import PromptConfirmModal from "../components/PromptConfirmModal";

/**
 * @file Componente ReferencesListSection.
 * @description Muestra una lista de referencias bibliográficas del usuario,
 * permitiendo ver, editar y eliminar cada referencia. También incluye
 * una modal de confirmación para las eliminaciones.
 */

/**
 * Componente ReferencesListSection.
 * @returns {JSX.Element} El componente de la sección de lista de referencias.
 */
function ReferencesListSection() {
  /**
   * Estado para almacenar la lista de referencias obtenidas del backend.
   * @type {Array<object>}
   */
  const [references, setReferences] = useState([]);

  /**
   * Estado para indicar si los datos están cargando.
   * @type {boolean}
   */
  const [loading, setLoading] = useState(true);

  /**
   * Estado para almacenar cualquier mensaje de error durante la carga o eliminación.
   * @type {string | null}
   */
  const [error, setError] = useState(null);

  /**
   * Estado para controlar la visibilidad del modal de formulario de referencia (añadir/editar).
   * @type {boolean}
   */
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Estado para almacenar el objeto de referencia que se está editando.
   * Es `null` si se está añadiendo una nueva referencia.
   * @type {object | null}
   */
  const [referenceToEdit, setReferenceToEdit] = useState(null);

  /**
   * Estado para controlar la visibilidad del modal de confirmación de eliminación.
   * @type {boolean}
   */
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  /**
   * Estado para almacenar el ID de la referencia que se va a eliminar.
   * @type {string | null}
   */
  const [referenceToDeleteId, setReferenceToDeleteId] = useState(null);

  /**
   * Función auxiliar para obtener el token de autenticación del localStorage.
   * @returns {string | null} El token JWT.
   */
  const getToken = () => localStorage.getItem("token");

  /**
   * Hook de efecto para cargar las referencias cuando el componente se monta.
   */
  useEffect(() => {
    fetchReferences();
  }, []);

  /**
   * Función asincrónica para obtener todas las referencias del usuario desde el backend.
   * Actualiza los estados `references`, `loading` y `error`.
   * @returns {Promise<void>}
   */
  const fetchReferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        toast.error("No autenticado. Por favor, inicia sesión.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/references", {
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
      toast.error(`Error al cargar las referencias: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Abre la modal de confirmación de eliminación, guardando el ID de la referencia.
   * @param {string} id - El ID de la referencia a eliminar.
   * @returns {void}
   */
  const requestDeleteConfirmation = (id) => {
    setReferenceToDeleteId(id);
    setIsConfirmModalOpen(true);
  };

  /**
   * Ejecuta la eliminación de la referencia después de la confirmación del usuario.
   * Envía una solicitud DELETE al backend.
   * @returns {Promise<void>}
   */
  const executeDeleteReference = async () => {
    if (!referenceToDeleteId) return;

    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        toast.error("No autenticado. Por favor, inicia sesión.");
        setLoading(false);
        setIsConfirmModalOpen(false);
        return;
      }

      const response = await fetch(`/api/references/${referenceToDeleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
      setIsConfirmModalOpen(false); // Cierra la modal después de una eliminación exitosa
    } catch (err) {
      console.error("Error al eliminar referencia:", err);
      setError(err.message);
      toast.error(`Error al eliminar la referencia: ${err.message}`);
      setIsConfirmModalOpen(false); // Asegúrate de cerrar la modal también en caso de error
    } finally {
      setLoading(false);
      setReferenceToDeleteId(null);
    }
  };

  /**
   * Abre la modal del formulario de referencia en modo edición con los datos de la referencia proporcionada.
   * @param {object} reference - La referencia a editar.
   * @returns {void}
   */
  const openEditModal = (reference) => {
    setReferenceToEdit(reference);
    setIsModalOpen(true);
  };

  /**
   * Cierra la modal del formulario de referencia y resetea `referenceToEdit`.
   * @returns {void}
   */
  const closeModal = () => {
    setIsModalOpen(false);
    setReferenceToEdit(null);
  };

  /**
   * Cierra la modal de confirmación de eliminación y resetea `referenceToDeleteId`.
   * @returns {void}
   */
  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setReferenceToDeleteId(null);
  };

  /**
   * Callback que se ejecuta cuando una referencia se guarda o actualiza exitosamente.
   * Vuelve a cargar la lista de referencias para reflejar los cambios.
   * @returns {void}
   */
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
              onDelete={requestDeleteConfirmation}
            />
          ))}
      </div>

      {/* Modal para añadir/editar referencias */}
      <ReferenceFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSaveSuccess={handleReferenceSaveSuccess}
        referenceToEdit={referenceToEdit}
        forTextEditor={false}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <PromptConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal}
        onConfirm={executeDeleteReference}
        title="¿Eliminar referencia?"
        message="¿Estás seguro de que quieres eliminar esta referencia? Esta acción es irreversible."
        showInputField={false}
        iconType="warning"
        confirmButtonText="Eliminar"
        cancelButtonText="Cancelar"
      />
    </section>
  );
}

export default ReferencesListSection;
