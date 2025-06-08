import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";

/**
 * @file Componente ReferenceFormModal.
 * @description Modal reutilizable para añadir o editar referencias bibliográficas.
 * Permite al usuario introducir metadatos de la referencia, seleccionar un estilo de citación
 * de entre sus estilos favoritos, previsualizar la citación (opcionalmente) y guardar
 * la referencia en el backend. Si se usa en el contexto de un editor de texto,
 * también puede insertar la referencia formateada directamente.
 */

/**
 * Mapeo básico de IDs de estilo CSL a nombres legibles para la interfaz de usuario.
 * Esta lista debe coincidir con los estilos que el backend y el motor CSL pueden procesar.
 * @type {Object.<string, string>}
 */
const CSL_STYLE_MAP = {
  apa: "APA 7th edition",
  mla: "MLA 9th edition",
  "chicago-fullnote-bibliography":
    "Chicago Manual of Style 17th edition (note, with bibliography)",
  ieee: "IEEE (Institute of Electrical and Electronics Engineers)",
  // Ampliar con más estilos CSL según sea necesario
};

/**
 * Modal para gestionar el formulario de referencias.
 * @param {object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Si el modal está abierto.
 * @param {function(): void} props.onClose - Callback para cerrar el modal.
 * @param {function(): void} props.onSaveSuccess - Callback después de un guardado exitoso.
 * @param {object | null} [props.referenceToEdit=null] - Objeto de referencia para edición, si aplica.
 * @param {boolean} [props.forTextEditor=false] - Indica si el modal se usa desde el TextEditor.
 * @param {function(string): void} [props.onInsertFormattedText] - Callback para insertar texto en el editor, si `forTextEditor` es `true`.
 * @returns {JSX.Element} El componente del modal del formulario de referencia.
 */
function ReferenceFormModal({
  isOpen,
  onClose,
  onSaveSuccess,
  referenceToEdit = null,
  forTextEditor = false,
  onInsertFormattedText,
}) {
  /**
   * Estado para almacenar los metadatos de la referencia del formulario.
   * Inicializa con valores predeterminados o con los datos de `referenceToEdit` si está en modo edición.
   * @type {object}
   */
  const [metadata, setMetadata] = useState({
    author: "",
    title: "",
    year: "",
    containerTitle: "",
    pages: "",
    publisher: "",
    URL: "",
    notes: "",
    type: "article-journal",
  });

  /**
   * Estado para el estilo CSL seleccionado actualmente en el formulario.
   * @type {string}
   */
  const [selectedStyle, setSelectedStyle] = useState("");

  /**
   * Estado para almacenar la lista de estilos CSL favoritos del usuario, cargados desde su perfil.
   * @type {Array<{value: string, label: string}>}
   */
  const [favoriteStyles, setFavoriteStyles] = useState([]);

  /**
   * Estado para indicar si los estilos favoritos están cargando.
   * @type {boolean}
   */
  const [loadingStyles, setLoadingStyles] = useState(true);

  /**
   * Estado para indicar si la operación de guardado está en curso.
   * @type {boolean}
   */
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Estado para almacenar cualquier mensaje de error relacionado con el formulario o las operaciones.
   * @type {string | null}
   */
  const [error, setError] = useState(null);

  /**
   * Estado para la previsualización de la cita formateada en HTML.
   * @type {string}
   */
  const [formattedCitationPreview, setFormattedCitationPreview] = useState("");

  /**
   * Función auxiliar para obtener el token de autenticación del localStorage.
   * @returns {string | null} El token JWT.
   */
  const getToken = () => localStorage.getItem("token");

  /**
   * Hook de efecto para inicializar el formulario y cargar los estilos favoritos
   * cuando el modal se abre o cuando `referenceToEdit` cambia.
   */
  useEffect(() => {
    if (isOpen) {
      fetchFavoriteStyles();
      setError(null);
      setFormattedCitationPreview("");

      if (referenceToEdit) {
        setMetadata({
          author: referenceToEdit.citationData?.author
            ? referenceToEdit.citationData.author
                .map((a) => `${a.family || ""},${a.given || ""}`.trim())
                .filter(Boolean)
                .join(";")
            : "",
          title: referenceToEdit.citationData?.title || "",
          year:
            referenceToEdit.citationData?.issued?.["date-parts"]?.[0]?.[0] ||
            "",
          containerTitle:
            referenceToEdit.citationData?.["container-title"] || "",
          pages: referenceToEdit.citationData?.page || "",
          publisher: referenceToEdit.citationData?.publisher || "",
          URL: referenceToEdit.url || "",
          notes: referenceToEdit.notes || "",
          type: referenceToEdit.citationData?.type || "article-journal",
        });
        // El selectedStyle se establecerá en el siguiente useEffect cuando los estilos favoritos estén cargados
        setSelectedStyle(referenceToEdit.formattingStyle || "");
      } else {
        setMetadata({
          author: "",
          title: "",
          year: "",
          containerTitle: "",
          pages: "",
          publisher: "",
          URL: "",
          notes: "",
          type: "article-journal",
        });
        setSelectedStyle(""); // Se establecerá el primer favorito después de la carga
      }
    }
  }, [isOpen, referenceToEdit]);

  /**
   * Hook de efecto para establecer el estilo de citación predeterminado
   * una vez que los estilos favoritos se han cargado.
   */
  useEffect(() => {
    if (isOpen && favoriteStyles.length > 0) {
      if (
        referenceToEdit &&
        referenceToEdit.formattingStyle &&
        favoriteStyles.some((s) => s.value === referenceToEdit.formattingStyle)
      ) {
        setSelectedStyle(referenceToEdit.formattingStyle);
      } else if (
        selectedStyle === "" ||
        !favoriteStyles.some((s) => s.value === selectedStyle)
      ) {
        setSelectedStyle(favoriteStyles[0].value);
      }
    }
  }, [favoriteStyles, isOpen, referenceToEdit, selectedStyle]);

  /**
   * Hook de efecto para formatear la cita para previsualización en tiempo real.
   * Se aplica un "debounce" para optimizar el rendimiento.
   */
  useEffect(() => {
    if (
      isOpen &&
      (metadata.title || metadata.author) &&
      selectedStyle &&
      !forTextEditor
    ) {
      const delayDebounceFn = setTimeout(() => {
        formatCitationForPreview();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    } else if (isOpen && forTextEditor) {
      setFormattedCitationPreview(
        "La previsualización no está disponible en este modo."
      );
    } else {
      setFormattedCitationPreview("");
    }
  }, [metadata, selectedStyle, isOpen, forTextEditor]);

  /**
   * Carga los estilos de citación preferidos del usuario desde su perfil.
   * @returns {Promise<void>}
   */
  const fetchFavoriteStyles = async () => {
    setLoadingStyles(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        throw new Error(
          "No autenticado. Por favor, inicia sesión para cargar estilos."
        );
      }

      const response = await fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMsg = "Error al cargar los formatos favoritos. ";
        try {
          const errorData = JSON.parse(responseText);
          errorMsg += errorData.message || "Detalles desconocidos.";
        } catch (e) {
          errorMsg += `Respuesta no JSON (status ${
            response.status
          }): ${responseText.substring(0, 200)}...`;
        }
        throw new Error(errorMsg);
      }

      const data = JSON.parse(responseText);

      const rawStylesArray =
        data.user?.preferredCitationStyles ||
        data.preferredCitationStyles ||
        [];

      if (!Array.isArray(rawStylesArray)) {
        console.warn(
          "preferredCitationStyles no es un array en la respuesta de /api/users/me. Esperado: array de strings.",
          rawStylesArray
        );
        throw new Error(
          "Formato inesperado para estilos favoritos. Contacta al administrador."
        );
      }

      const stylesData = rawStylesArray.map((id) => ({
        value: id,
        label: CSL_STYLE_MAP[id.toLowerCase()] || id.toUpperCase(),
      }));

      setFavoriteStyles(stylesData);
    } catch (err) {
      console.error("Error fetching favorite styles:", err);
      setError(err.message);
    } finally {
      setLoadingStyles(false);
    }
  };

  /**
   * Parsea una cadena de autores (ej. "Apellido,Nombre;Apellido2,Nombre2")
   * a un array de objetos con formato CSL-JSON.
   * @param {string} authorString - La cadena de autores.
   * @returns {Array<object>} Un array de objetos de autor en formato CSL.
   */
  const parseAuthors = (authorString) => {
    if (!authorString) return [];
    return authorString
      .split(";")
      .map((a) => {
        const parts = a.trim().split(",");
        return {
          family: parts[0] ? parts[0].trim() : "",
          given: parts[1] ? parts[1].trim() : "",
        };
      })
      .filter((a) => a.family || a.given);
  };

  /**
   * Construye un objeto CSL-JSON a partir de los metadatos actuales del formulario.
   * @returns {object} El objeto CSL-JSON de la referencia.
   */
  const buildCSL = () => {
    const item = {
      type: metadata.type,
      title: metadata.title,
      author: parseAuthors(metadata.author),
      issued: metadata.year
        ? { "date-parts": [[parseInt(metadata.year, 10)]] }
        : undefined,
      "container-title": metadata.containerTitle,
      page: metadata.pages,
      publisher: metadata.publisher,
      URL: metadata.URL,
    };
    return item;
  };

  /**
   * Solicita al backend el formato de la cita para previsualización.
   * Actualiza el estado `formattedCitationPreview` con el HTML resultante.
   * @returns {Promise<void>}
   */
  const formatCitationForPreview = async () => {
    const cslJson = buildCSL();

    if (
      !selectedStyle ||
      (!cslJson.title && (!cslJson.author || cslJson.author.length === 0))
    ) {
      setFormattedCitationPreview(
        "Completa los campos necesarios y selecciona un estilo para previsualizar."
      );
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        throw new Error("No autenticado. Por favor, inicia sesión.");
      }

      const res = await fetch("/api/citation/format", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          metadata: cslJson,
          style: selectedStyle,
          output: "html",
        }),
      });

      const responseText = await res.text();

      if (!res.ok) {
        let errorMsg = "Error al formatear la cita para previsualización. ";
        try {
          const errorData = JSON.parse(responseText);
          errorMsg += errorData.message || "Detalles desconocidos.";
        } catch {
          errorMsg += `Respuesta no JSON (status ${
            res.status
          }): ${responseText.substring(0, 100)}.`;
        }
        throw new Error(errorMsg);
      }

      const data = JSON.parse(responseText);
      if (!data.citationHtml) {
        throw new Error("El backend no devolvió citationHtml.");
      }
      setFormattedCitationPreview(data.citationHtml);
    } catch (err) {
      console.error("Error formateando cita para previsualización:", err);
      setFormattedCitationPreview(`Error al previsualizar: ${err.message}`);
    }
  };

  /**
   * Maneja el proceso de guardar/actualizar la referencia y, opcionalmente, formatearla e insertarla en un editor.
   * @returns {Promise<void>}
   */
  const handleSaveAndFormat = async () => {
    setIsSaving(true);
    setError(null);

    const cslJson = buildCSL();

    if (!selectedStyle) {
      setError("Debes seleccionar un estilo de cita.");
      setIsSaving(false);
      return;
    }

    if (!cslJson.title && (!cslJson.author || cslJson.author.length === 0)) {
      setError("Debes completar al menos el título o el autor para guardar.");
      setIsSaving(false);
      return;
    }

    const referencePayload = {
      citationData: cslJson,
      url: metadata.URL,
      notes: metadata.notes,
      formattingStyle: selectedStyle,
    };

    try {
      const token = getToken();
      if (!token) {
        throw new Error("No autenticado. Por favor, inicia sesión.");
      }

      // --- 1. Guardar/Actualizar Referencia en la Base de Datos ---
      let saveResponse;
      const saveUrl = referenceToEdit
        ? `/api/references/${referenceToEdit._id}`
        : "/api/references";
      const saveMethod = referenceToEdit ? "PUT" : "POST";

      saveResponse = await fetch(saveUrl, {
        method: saveMethod,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(referencePayload),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(
          errorData.message ||
            "Error al guardar la referencia en la base de datos."
        );
      }

      // --- 2. Si está en el contexto del Text Editor, formatear e insertar texto ---
      if (forTextEditor && onInsertFormattedText) {
        const formatRes = await fetch("/api/citation/format", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            metadata: cslJson,
            style: selectedStyle,
            output: "html",
          }),
        });

        const formatTextResponse = await formatRes.text();
        if (!formatRes.ok) {
          let errorMsg = "Error al formatear la referencia para inserción. ";
          try {
            const formatErrorData = JSON.parse(formatTextResponse);
            errorMsg += formatErrorData.message || "Detalles desconocidos.";
          } catch {
            errorMsg += `Respuesta no JSON (status ${
              formatRes.status
            }): ${formatTextResponse.substring(0, 100)}.`;
          }
          throw new Error(errorMsg);
        }

        const formatData = JSON.parse(formatTextResponse);
        if (!formatData.citationHtml)
          throw new Error(
            "El backend no devolvió citationHtml para inserción."
          );

        onInsertFormattedText(formatData.citationHtml);
        toast.success(
          `Referencia ${
            referenceToEdit ? "actualizada" : "creada"
          } e insertada en el editor.`
        );
      } else {
        toast.success(
          `Referencia ${referenceToEdit ? "actualizada" : "creada"} con éxito.`
        );
      }

      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error("Error en handleSaveAndFormat:", err);
      setError(err.message);
      toast.error(`Error al guardar referencia: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Maneja los cambios en los campos de entrada del formulario,
   * aplicando validaciones específicas para 'year' y 'pages'.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} e - El evento de cambio.
   * @returns {void}
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "year") {
      const filteredValue = value.replace(/[^0-9]/g, ""); // Solo dígitos
      setMetadata((prev) => ({ ...prev, [name]: filteredValue }));
    } else if (name === "pages") {
      const filteredValue = value.replace(/[^0-9pP\-,.\s]/g, ""); // Dígitos, p/P, -, ,, ., espacios
      setMetadata((prev) => ({ ...prev, [name]: filteredValue }));
    } else {
      setMetadata((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <Dialog.Panel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <Dialog.Title className="text-xl font-semibold mb-4 text-gray-900">
          {referenceToEdit ? "Editar Referencia" : "Nueva Referencia"}
        </Dialog.Title>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="space-y-3">
          {/* Campos de entrada de metadatos */}
          <input
            type="text"
            name="author"
            placeholder="Autor(es): Apellido,Nombre;Apellido2,Nombre2"
            value={metadata.author}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            name="title"
            placeholder="Título"
            value={metadata.title}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            name="year"
            placeholder="Año (solo números)"
            value={metadata.year}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            name="containerTitle"
            placeholder="Libro o revista (Título del contenedor)"
            value={metadata.containerTitle}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            name="pages"
            placeholder="Páginas (ej. 123-145 o p. x–y)"
            value={metadata.pages}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            name="publisher"
            placeholder="Editorial"
            value={metadata.publisher}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="url"
            name="URL"
            placeholder="URL"
            value={metadata.URL}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <textarea
            placeholder="Notas o descripción adicional"
            name="notes"
            value={metadata.notes}
            onChange={handleChange}
            rows="3"
            className="w-full border p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-y"
          />

          {/* Selector de Tipo de Referencia (CSL Type) */}
          <div>
            <label
              htmlFor="type-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tipo de referencia:
            </label>
            <select
              id="type-select"
              name="type"
              value={metadata.type}
              onChange={handleChange}
              className="w-full border p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="article-journal">Artículo de Revista</option>
              <option value="book">Libro</option>
              <option value="chapter">Capítulo de Libro</option>
              <option value="report">Informe</option>
              <option value="thesis">Tesis</option>
              <option value="webpage">Página Web</option>
              <option value="paper-conference">Ponencia de Conferencia</option>
              <option value="patent">Patente</option>
              <option value="personal-communication">
                Comunicación Personal
              </option>
            </select>
          </div>

          {/* Selector de Estilo de Citación */}
          {loadingStyles ? (
            <div className="text-center text-gray-500 py-2">
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              Cargando estilos de citación...
            </div>
          ) : favoriteStyles.length > 0 ? (
            <div>
              <label
                htmlFor="style-select"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Formato de citación favorito:
              </label>
              <select
                id="style-select"
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full border p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {favoriteStyles.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No hay estilos de citación favoritos configurados. Por favor,
              configúralos en tu perfil de usuario.
            </p>
          )}

          {/* Sección de Previsualización de la Citación (Solo para modo NO TextEditor) */}
          {!forTextEditor && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-md font-medium text-gray-800 mb-2">
                Previsualización del formato:
              </h4>
              {formattedCitationPreview ? (
                <div
                  dangerouslySetInnerHTML={{ __html: formattedCitationPreview }}
                  className="text-sm text-gray-700 break-words"
                />
              ) : (
                <p className="text-sm text-gray-500">
                  Introduce los metadatos y selecciona un estilo para ver la
                  previsualización.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors duration-200"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveAndFormat}
            disabled={isSaving || loadingStyles || favoriteStyles.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                {forTextEditor ? "Insertando..." : "Guardando..."}
              </>
            ) : referenceToEdit ? (
              "Guardar cambios"
            ) : (
              "Guardar"
            )}
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

export default ReferenceFormModal;
