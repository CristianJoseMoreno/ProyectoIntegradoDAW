import React, { useState, useEffect } from "react";

/**
 * @file Componente UserProfile.
 * @description Muestra y permite la edición del perfil de usuario, incluyendo información personal
 * y preferencias de estilos de citación. Permite añadir y eliminar estilos CSL preferidos
 * mediante una modal que carga estilos disponibles desde el backend.
 */

/**
 * Componente UserProfile.
 * @param {object} props - Propiedades del componente.
 * @param {object | null} props.user - Objeto de usuario con sus datos.
 * @param {boolean} props.loading - Indica si los datos del usuario están cargando.
 * @param {string | null} props.error - Mensaje de error si la carga del usuario falla.
 * @param {function(object): Promise<void>} props.onUpdateUser - Función para enviar las actualizaciones del usuario al backend.
 * @returns {JSX.Element} El componente del perfil de usuario.
 */
function UserProfile({ user, loading, error, onUpdateUser }) {
  /**
   * Estado para el nombre del usuario, editable.
   * @type {string}
   */
  const [userName, setUserName] = useState("");

  /**
   * Estado para el título del usuario.
   * @type {string}
   */
  const [userTitle] = useState("Estudiante");

  /**
   * Estado para la ubicación del usuario, fijo para este ejemplo.
   * @type {string}
   */
  const [userLocation] = useState("Sevilla,España");

  /**
   * Estado para los estilos de citación preferidos por el usuario, un array de strings.
   * @type {Array<string>}
   */
  const [preferredCitationStyles, setPreferredCitationStyles] = useState([]);

  /**
   * Estado para controlar si la sección de información personal está en modo de edición.
   * @type {boolean}
   */
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);

  /**
   * Estado para controlar si la sección de preferencias está en modo de edición.
   * @type {boolean}
   */
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);

  /**
   * Estado para controlar la visibilidad de la modal para añadir formatos CSL.
   * @type {boolean}
   */
  const [showAddFormatModal, setShowAddFormatModal] = useState(false);

  /**
   * Estado para almacenar la lista de estilos CSL disponibles para selección, cargados desde el backend.
   * Cada estilo es un objeto { label: string, value: string }.
   * @type {Array<{label: string, value: string}>}
   */
  const [availableCslStyles, setAvailableCslStyles] = useState([]);

  /**
   * Estado para almacenar el estilo CSL seleccionado en la modal de añadir formato.
   * @type {string}
   */
  const [selectedCslStyle, setSelectedCslStyle] = useState("");

  /**
   * Hook de efecto para inicializar los estados `userName` y `preferredCitationStyles`
   * cuando el prop `user` cambia.
   */
  useEffect(() => {
    if (user) {
      setUserName(user.name || "");
      setPreferredCitationStyles(user.preferredCitationStyles || []);
    }
  }, [user]);

  /**
   * Hook de efecto para cargar los estilos CSL disponibles desde el backend
   * cuando la modal `showAddFormatModal` se abre.
   */
  useEffect(() => {
    if (showAddFormatModal) {
      /**
       * Función asincrónica para obtener los estilos CSL disponibles.
       * @returns {Promise<void>}
       */
      const fetchCslStyles = async () => {
        try {
          const response = await fetch("/api/citation/styles");

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Error al cargar los estilos CSL disponibles: ${response.status} - ${errorText}`
            );
          }

          const data = await response.json();
          setAvailableCslStyles(data.styles);
          if (data.styles.length > 0) {
            setSelectedCslStyle(data.styles[0].value);
          }
        } catch (err) {
          console.error("Error fetching CSL styles:", err);
        }
      };
      fetchCslStyles();
    }
  }, [showAddFormatModal]);

  /**
   * Maneja el guardado de los cambios en una sección específica (información personal o preferencias).
   * @param {React.MouseEvent} e - El evento de clic del ratón.
   * @param {'personalInfo' | 'preferences'} section - La sección que se va a guardar.
   * @returns {Promise<void>}
   */
  const handleSave = async (e, section) => {
    e.preventDefault();
    let updatedFields = {};

    if (section === "personalInfo") {
      updatedFields = { name: userName };
      await onUpdateUser(updatedFields);
      setIsEditingPersonalInfo(false);
    } else if (section === "preferences") {
      updatedFields = {
        preferredCitationStyles: preferredCitationStyles,
      };
      await onUpdateUser(updatedFields);
      setIsEditingPreferences(false);
    }
  };

  /**
   * Abre la modal para añadir un nuevo estilo de citación CSL.
   * @returns {void}
   */
  const handleOpenAddFormatModal = () => {
    setShowAddFormatModal(true);
  };

  /**
   * Cierra la modal para añadir un nuevo estilo de citación CSL y resetea la selección.
   * @returns {void}
   */
  const handleCloseAddFormatModal = () => {
    setShowAddFormatModal(false);
    setSelectedCslStyle("");
  };

  /**
   * Añade el estilo CSL seleccionado a la lista de estilos preferidos.
   * Solo añade si hay una selección y el estilo no está ya en la lista.
   * @returns {void}
   */
  const handleAddCslStyle = () => {
    if (
      selectedCslStyle &&
      !preferredCitationStyles.includes(selectedCslStyle)
    ) {
      setPreferredCitationStyles((prevStyles) => [
        ...prevStyles,
        selectedCslStyle,
      ]);
      setShowAddFormatModal(false);
      setSelectedCslStyle("");
    }
  };

  /**
   * Elimina un estilo CSL de la lista de estilos preferidos.
   * @param {string} styleToRemove - El nombre del estilo a eliminar.
   * @returns {void}
   */
  const handleRemoveCslStyle = (styleToRemove) => {
    setPreferredCitationStyles((prevStyles) =>
      prevStyles.filter((style) => style !== styleToRemove)
    );
  };

  // --- Renderizado Condicional de Estados ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600">
        Cargando perfil...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-600">
        Error al cargar el perfil: {error}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600">
        No se pudo cargar la información del usuario.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl p-6 md:p-8 shadow-lg overflow-y-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center w-full mb-6">
        Perfil de Usuario
      </h2>

      <div className="flex flex-col lg:flex-row gap-6 flex-grow items-stretch">
        {/* Información Personal */}
        <div className="flex-1 bg-gray-50 rounded-xl p-6 shadow-md relative flex flex-col overflow-y-auto">
          <div className="flex justify-between items-center mb-4 w-full">
            <h3 className="text-xl font-semibold text-gray-900">
              Información Personal
            </h3>
            <button
              onClick={() => setIsEditingPersonalInfo((prev) => !prev)}
              className="text-blue-500 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              {isEditingPersonalInfo ? "Cancelar" : "Editar"}
            </button>
          </div>

          <div className="flex flex-col items-center flex-grow justify-center">
            <img
              src={user.picture || "https://via.placeholder.com/96?text=U"}
              alt="User Avatar"
              className="w-24 h-24 rounded-full object-cover mb-4 ring-4 ring-blue-300"
            />
            {isEditingPersonalInfo ? (
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="text-center text-xl font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none mb-1 text-gray-900"
              />
            ) : (
              <p className="text-xl font-bold text-gray-900 mb-1">{userName}</p>
            )}
            <p className="text-gray-600 text-sm">{userTitle}</p>
            <p className="text-gray-600 text-sm">{userLocation}</p>
          </div>

          {isEditingPersonalInfo && (
            <button
              onClick={(e) => handleSave(e, "personalInfo")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md mt-auto"
            >
              Guardar Cambios
            </button>
          )}
        </div>

        {/* Preferencias */}
        <div className="flex-1 bg-gray-50 rounded-xl p-6 shadow-md relative flex flex-col overflow-y-auto">
          <div className="flex justify-between items-center mb-4 w-full">
            <h3 className="text-xl font-semibold text-gray-900">
              Preferencias
            </h3>
            <button
              onClick={() => setIsEditingPreferences((prev) => !prev)}
              className="text-blue-500 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              {isEditingPreferences ? "Cancelar" : "Editar"}
            </button>
          </div>

          <div className="flex-grow flex flex-col justify-start items-start w-full">
            <div className="mb-4 w-full">
              <label
                htmlFor="preferredCitationStyles"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Estilos de Citación Preferidos
              </label>
              {isEditingPreferences ? (
                <>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {preferredCitationStyles.length > 0 ? (
                      preferredCitationStyles.map((style) => (
                        <span
                          key={style}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {style}
                          <button
                            type="button"
                            onClick={() => handleRemoveCslStyle(style)}
                            className="ml-2 -mr-0.5 h-4 w-4 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-200 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <span className="sr-only">
                              Quitar estilo {style}
                            </span>
                            <svg
                              className="h-2 w-2"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 8 8"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M1 1l6 6m0-6L1 7"
                              />
                            </svg>
                          </button>
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">
                        Ningún estilo añadido.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleOpenAddFormatModal}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-lg text-sm transition-colors duration-200 shadow-md"
                  >
                    Añadir Formato
                  </button>
                </>
              ) : (
                <p className="block w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-md sm:text-sm text-gray-900 break-words">
                  {preferredCitationStyles.length > 0
                    ? preferredCitationStyles.join(", ")
                    : "Ninguno"}
                </p>
              )}
            </div>
          </div>

          {isEditingPreferences && (
            <button
              onClick={(e) => handleSave(e, "preferences")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md mt-auto"
            >
              Guardar Cambios
            </button>
          )}
        </div>
      </div>

      {/* Modal para añadir formato CSL */}
      {showAddFormatModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Añadir Formato CSL</h3>
            <div className="mb-4">
              <label
                htmlFor="csl-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Selecciona un estilo CSL:
              </label>
              {availableCslStyles.length > 0 ? (
                <select
                  id="csl-select"
                  value={selectedCslStyle}
                  onChange={(e) => setSelectedCslStyle(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  {availableCslStyles.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-600">
                  Cargando estilos o no hay estilos disponibles...
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCloseAddFormatModal}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCslStyle}
                disabled={
                  !selectedCslStyle ||
                  preferredCitationStyles.includes(selectedCslStyle)
                }
                className={`font-bold py-2 px-4 rounded-lg transition-colors duration-200 ${
                  !selectedCslStyle ||
                  preferredCitationStyles.includes(selectedCslStyle)
                    ? "bg-blue-300 text-white cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Añadir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
