import React, { useState } from "react";
import ReferenceCard from "./ReferenceCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThLarge, faList } from "@fortawesome/free-solid-svg-icons";

function ReferencesListSection() {
  const [isGridView, setIsGridView] = useState(true); // Controla la vista de tarjetas

  // Datos de ejemplo para las referencias (en un escenario real vendrían de una API)
  const references = [
    {
      id: 1,
      title: "Desarrollo Web con React",
      description:
        "Proyecto de creación de una aplicación web interactiva utilizando React y sus hooks.",
      category: "Software",
      year: 2023,
      tags: ["React", "JavaScript", "Frontend"],
      imageUrl: "https://via.placeholder.com/150/0000FF/FFFFFF?text=React",
    },
    {
      id: 2,
      title: "Diseño de Base de Datos SQL",
      description:
        "Normalización y optimización de esquemas de bases de datos relacionales para un ERP.",
      category: "Bases de Datos",
      year: 2022,
      tags: ["SQL", "MySQL", "Backend"],
      imageUrl: "https://via.placeholder.com/150/FF0000/FFFFFF?text=SQL",
    },
    {
      id: 3,
      title: "Análisis de Datos con Python",
      description:
        "Uso de Pandas y Matplotlib para el análisis exploratorio de datos de ventas.",
      category: "Ciencia de Datos",
      year: 2024,
      tags: ["Python", "Pandas", "DataViz"],
      imageUrl: "https://via.placeholder.com/150/00FF00/FFFFFF?text=Python",
    },
    {
      id: 4,
      title: "Construcción de API RESTful",
      description:
        "Implementación de una API REST utilizando Node.js y Express para una aplicación móvil.",
      category: "Backend",
      year: 2023,
      tags: ["Node.js", "Express", "API"],
      imageUrl: "https://via.placeholder.com/150/FFFF00/000000?text=Node",
    },
    {
      id: 5,
      title: "Despliegue en la Nube con AWS",
      description:
        "Configuración y despliegue de una aplicación web escalable en servicios de AWS (EC2, S3, RDS).",
      category: "DevOps",
      year: 2024,
      tags: ["AWS", "Cloud", "DevOps"],
      imageUrl: "https://via.placeholder.com/150/FF00FF/FFFFFF?text=AWS",
    },
    {
      id: 6,
      title: "Desarrollo de Apps Móviles con Flutter",
      description:
        "Creación de una aplicación móvil multiplataforma para gestión de tareas.",
      category: "Desarrollo Móvil",
      year: 2024,
      tags: ["Flutter", "Dart", "Mobile"],
      imageUrl: "https://via.placeholder.com/150/00FFFF/000000?text=Flutter",
    },
  ];

  return (
    <section className="flex flex-col h-full bg-white rounded-3xl p-6 md:p-8 shadow-lg overflow-hidden">
      {/* Encabezado de la sección de referencias */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center w-full">
          Mis Referencias
        </h2>

        {/* Acciones de vista */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsGridView(true)}
            className={`p-2 rounded-lg transition-colors duration-200 
              ${
                isGridView
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            aria-label="Ver en cuadrícula"
          >
            <FontAwesomeIcon icon={faThLarge} />
          </button>
          <button
            onClick={() => setIsGridView(false)}
            className={`p-2 rounded-lg transition-colors duration-200 
              ${
                !isGridView
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            aria-label="Ver en lista"
          >
            <FontAwesomeIcon icon={faList} />
          </button>
        </div>
      </div>

      {/* Contenedor de las tarjetas de referencias */}
      <div
        className={`flex-1 overflow-y-auto pr-2 -mr-2 ${
          isGridView
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "flex flex-col gap-4"
        }`}
      >
        {references.map((ref) => (
          <ReferenceCard
            key={ref.id}
            reference={ref}
            isListView={!isGridView}
          />
        ))}
      </div>
    </section>
  );
}

export default ReferencesListSection;
