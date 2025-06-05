import React, { useState, useEffect } from "react";

function UserProfile({ user, loading, error, onUpdateUser }) {
  const [userName, setUserName] = useState("");
  const [userTitle] = useState("Team Manager");
  const [userLocation] = useState("Arizona, United States");
  const [preferredCitationStyles, setPreferredCitationStyles] = useState("");

  // Estados de edición separados para cada sección
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);

  const [showAddFormatModal, setShowAddFormatModal] = useState(false);

  useEffect(() => {
    if (user) {
      setUserName(user.name || "");
      setPreferredCitationStyles(
        user.preferredCitationStyles?.join(", ") || ""
      );
    }
  }, [user]);

  // Función de guardado que recibe qué sección se está guardando
  const handleSave = async (e, section) => {
    e.preventDefault();
    let updatedFields = {};

    if (section === "personalInfo") {
      updatedFields = { name: userName };
      await onUpdateUser(updatedFields);
      setIsEditingPersonalInfo(false);
    } else if (section === "preferences") {
      updatedFields = {
        preferredCitationStyles: preferredCitationStyles
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== ""),
      };
      await onUpdateUser(updatedFields);
      setIsEditingPreferences(false);
    }
  };

  const handleOpenAddFormatModal = () => {
    setShowAddFormatModal(true);
  };

  const handleCloseAddFormatModal = () => {
    setShowAddFormatModal(false);
  };

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
              onClick={() => setIsEditingPersonalInfo((prev) => !prev)} // Controla su propio estado
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
            {isEditingPersonalInfo ? ( // Condición basada en su propio estado
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

          {isEditingPersonalInfo && ( // Botón Guardar para Información Personal
            <button
              onClick={(e) => handleSave(e, "personalInfo")} // Pasa el identificador de la sección
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
            {/* Botón Editar para Preferencias */}
            <button
              onClick={() => setIsEditingPreferences((prev) => !prev)} // Controla su propio estado
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
                Estilos de Citación Preferidos (separados por coma)
              </label>
              {isEditingPreferences ? ( // Condición basada en su propio estado
                <>
                  <input
                    type="text"
                    id="preferredCitationStyles"
                    name="preferredCitationStyles"
                    value={preferredCitationStyles}
                    onChange={(e) => setPreferredCitationStyles(e.target.value)}
                    placeholder="ej. apa, mla, chicago"
                    className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                  />
                  {/* Botón Añadir Formato, visible solo si se edita preferencias */}
                  <button
                    onClick={handleOpenAddFormatModal}
                    className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-lg text-sm transition-colors duration-200 shadow-md"
                  >
                    Añadir Formato
                  </button>
                </>
              ) : (
                <p className="block w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-md sm:text-sm text-gray-900 break-words">
                  {preferredCitationStyles || "Ninguno"}
                </p>
              )}
            </div>
          </div>

          {isEditingPreferences && ( // Botón Guardar para Preferencias
            <button
              onClick={(e) => handleSave(e, "preferences")} // Pasa el identificador de la sección
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md mt-auto"
            >
              Guardar Cambios
            </button>
          )}
        </div>
      </div>

      {/* Modal para añadir formato (placeholder) */}
      {showAddFormatModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Añadir Formato CSL</h3>
            <p className="mb-4">
              [Contenido de la modal: desplegable de CSL, botón Añadir]
            </p>
            <button
              onClick={handleCloseAddFormatModal}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
