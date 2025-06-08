import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrashAlt,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";

/**
 * @file Componente ReferenceCard.
 * @description Tarjeta de visualización para una referencia bibliográfica individual.
 * Muestra los metadatos clave de la referencia y proporciona botones para editar y eliminar.
 */

/**
 * Componente ReferenceCard.
 * Muestra los detalles de una referencia bibliográfica y ofrece acciones de edición y eliminación.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {object} props.reference - El objeto de referencia bibliográfica a mostrar.
 * @param {function(object): void} props.onEdit - Callback que se ejecuta al hacer clic en el botón de editar, pasando el objeto de referencia.
 * @param {function(string): void} props.onDelete - Callback que se ejecuta al hacer clic en el botón de eliminar, pasando el ID de la referencia.
 * @returns {JSX.Element} El componente de la tarjeta de referencia.
 */
function ReferenceCard({ reference, onEdit, onDelete }) {
  const { citationData, url, notes, _id } = reference;

  /**
   * Extrae y formatea el título de la referencia.
   * @type {string}
   */
  const displayTitle = citationData?.title || "Referencia sin título";

  /**
   * Extrae y formatea los autores de la referencia.
   * Convierte un array de objetos de autor CSL a una cadena legible.
   * @type {string}
   */
  const displayAuthors = citationData?.author
    ? citationData.author
        .map((a) => `${a.given ? a.given + " " : ""}${a.family || ""}`.trim())
        .filter(Boolean)
        .join(", ")
    : "Autor(es) desconocido(s)";

  /**
   * Extrae el año de publicación de la referencia.
   * @type {string | number}
   */
  const displayYear =
    citationData?.issued?.["date-parts"]?.[0]?.[0] || "Año desconocido";

  /**
   * Extrae y formatea el tipo de referencia (ej. "article-journal" a "Article Journal").
   * @type {string}
   */
  const displayType = citationData?.type
    ? citationData.type
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "Tipo desconocido";

  /**
   * Utiliza el campo 'notes' del backend como descripción para la tarjeta.
   * @type {string}
   */
  const displayDescription = notes || "Sin descripción disponible.";

  /**
   * URL de la imagen de la referencia. Actualmente un placeholder genérico.
   * @type {string}
   */
  const imageUrl = "https://placehold.co/150x150/ADD8E6/000000?text=Ref";

  /**
   * Categoría de la referencia. Actualmente no está en el esquema de BD, así que se usa "N/A".
   * @type {string}
   */
  const displayCategory = "N/A";

  /**
   * Etiquetas de la referencia. Actualmente no está en el esquema de BD, así que es un array vacío.
   * @type {Array<string>}
   */
  const displayTags = [];

  return (
    <div
      className={`bg-gray-100 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 ease-in-out
      flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6`}
    >
      <div className="flex-1 w-full">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {displayTitle}
          </h3>
        </div>

        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {displayDescription}
        </p>

        <div className="text-sm text-gray-700 mb-1">
          <p>
            <span className="font-semibold">Autor(es):</span> {displayAuthors}
          </p>
          <p>
            <span className="font-semibold">Tipo:</span> {displayType}
          </p>
        </div>

        <div className="flex justify-between items-center mt-2">
          <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {displayYear}
          </span>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm ml-auto"
            >
              <FontAwesomeIcon icon={faExternalLinkAlt} className="mr-1" />
              Ver Recurso
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 md:ml-4 flex-shrink-0">
        <button
          onClick={() => onEdit(reference)}
          className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors duration-200"
          title="Editar Referencia"
        >
          <FontAwesomeIcon icon={faEdit} />
        </button>
        <button
          onClick={() => onDelete(_id)}
          className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors duration-200"
          title="Eliminar Referencia"
        >
          <FontAwesomeIcon icon={faTrashAlt} />
        </button>
      </div>
    </div>
  );
}

export default ReferenceCard;
