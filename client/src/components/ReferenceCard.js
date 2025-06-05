// src/components/ReferenceCard.js
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrashAlt,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons"; // Añadidos iconos de editar, eliminar, link

function ReferenceCard({ reference, onEdit, onDelete }) {
  // Añadidos onEdit y onDelete props
  // Extraer datos directamente del objeto de referencia del backend
  const { citationData, formattedString, url, notes, _id } = reference;

  // Extraer campos relevantes de citationData (objeto CSL-JSON)
  // Ajusta esto según los campos CSL-JSON que tu backend almacene típicamente
  const displayTitle = citationData?.title || "Referencia sin título";
  const displayAuthors = citationData?.author
    ? citationData.author
        .map((a) => `${a.given ? a.given + " " : ""}${a.family || ""}`.trim())
        .filter(Boolean) // Elimina autores vacíos
        .join(", ")
    : "Autor(es) desconocido(s)";
  const displayYear =
    citationData?.issued?.["date-parts"]?.[0]?.[0] || "Año desconocido";
  const displayType = citationData?.type
    ? citationData.type
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "Tipo desconocido"; // Formatea tipo (e.g., "article-journal" a "Article Journal")

  // Usaremos 'notes' del backend como 'description' de la tarjeta
  const displayDescription = notes || "Sin descripción disponible.";

  // Para la imagen, si la URL del recurso es una imagen, o si tienes un campo imageUrl específico
  // Por ahora, si no tienes un campo imageUrl en el backend, puedes usar un placeholder.
  const imageUrl = "https://placehold.co/150x150/ADD8E6/000000?text=Ref"; // Placeholder genérico

  // Para tags y category, si no están en el backend directamente, podrías parsearlos de 'notes'
  // o decidir que no son necesarios para el display inmediato de la tarjeta.
  // Por ahora, los eliminamos o ponemos placeholders, ya que no vienen del backend.
  const displayCategory = "N/A"; // No está en tu esquema de BD
  const displayTags = []; // No está en tu esquema de BD

  return (
    <div
      className={`bg-gray-100 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 ease-in-out
      flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6`}
    >
      {/* Contenido de la tarjeta - Usamos flex-1 para que ocupe el espacio principal */}
      <div className="flex-1 w-full">
        {/* Título */}
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {displayTitle}
          </h3>
        </div>

        {/* Descripción */}
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {displayDescription}
        </p>

        {/* Info adicional (Autores, Tipo) */}
        <div className="text-sm text-gray-700 mb-1">
          <p>
            <span className="font-semibold">Autor(es):</span> {displayAuthors}
          </p>
          <p>
            <span className="font-semibold">Tipo:</span> {displayType}
          </p>
        </div>

        {/* Contenedor del Año y Enlace de Recurso (en la misma línea que los botones de acción) */}
        {/* Este div no tendrá los botones, solo el año y el enlace para mantener la separación lógica */}
        <div className="flex justify-between items-center mt-2">
          {" "}
          {/* mt-2 para separación con info superior */}
          {/* Año */}
          <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {displayYear}
          </span>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm ml-auto" // ml-auto para empujar a la derecha
            >
              <FontAwesomeIcon icon={faExternalLinkAlt} className="mr-1" />
              Ver Recurso
            </a>
          )}
        </div>
      </div>
      {/* Botones de Editar y Eliminar - Alineados a la derecha y al centro vertical en pantallas grandes */}
      {/* Este div está fuera del 'flex-1 w-full' para que se alinee horizontalmente con él en md:flex-row del padre */}
      <div className="flex items-center gap-3 md:ml-4 flex-shrink-0">
        {" "}
        {/* Añadido md:ml-4 para espacio en pantallas grandes */}
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
