import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisH } from "@fortawesome/free-solid-svg-icons";

function ReferenceCard({ reference, isListView }) {
  return (
    <div
      className={`bg-blue-50 rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-200 ease-in-out 
      ${
        isListView
          ? "flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6"
          : "flex flex-col"
      }`}
    >
      {/* Imagen o Icono de la referencia */}
      {!isListView && (
        <div className="w-full h-32 flex items-center justify-center bg-blue-100 rounded-xl mb-4 overflow-hidden">
          <img
            src={reference.imageUrl}
            alt={reference.title}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {/* Contenido de la tarjeta */}
      <div className={`flex-1 ${isListView ? "w-full" : ""}`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {reference.title}
          </h3>
          <button className="text-gray-500 hover:text-blue-500 transition-colors duration-200 p-1">
            <FontAwesomeIcon icon={faEllipsisH} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {reference.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {reference.tags.map((tag) => (
            <span
              key={tag}
              className="bg-blue-200 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Pie de la tarjeta */}
        <div
          className={`flex justify-between items-center pt-3 border-t border-gray-200 ${
            isListView ? "flex-col md:flex-row w-full" : ""
          }`}
        >
          <span className="text-sm font-semibold text-gray-700">
            Categoría: {reference.category}
          </span>
          <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full mt-2 md:mt-0">
            {reference.year}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ReferenceCard;
