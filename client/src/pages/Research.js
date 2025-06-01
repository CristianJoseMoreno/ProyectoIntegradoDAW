import React, { useState, useEffect } from "react";
import TextEditor from "../components/TextEditor";
import PdfViewer from "../components/PdfViewer";

export default function Research() {
  const [doc, setDoc] = useState("");
  const [styles, setStyles] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [metadata, setMetadata] = useState({
    author: "",
    title: "",
    year: "",
    containerTitle: "",
    pages: "",
    publisher: "",
    URL: "",
  });

  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/citation/styles");
        const data = await res.json();
        if (Array.isArray(data.styles)) {
          setStyles(data.styles);
          setSelectedStyle(data.styles[0]?.value || "");
        } else {
          throw new Error("Respuesta inesperada");
        }
      } catch (err) {
        console.error("Error cargando estilos:", err);
        alert("No se pudieron cargar los estilos de cita.");
      }
    };
    fetchStyles();
  }, []);

  const buildCSL = () => {
    const item = {
      type: "article-journal",
      title: metadata.title,
      author: metadata.author
        ? metadata.author.split(";").map((a) => {
            const [last, first] = a.split(",").map((s) => s.trim());
            return { family: last, given: first };
          })
        : undefined,
      issued: metadata.year
        ? { "date-parts": [[parseInt(metadata.year)]] }
        : undefined,
      containerTitle: metadata.containerTitle,
      page: metadata.pages,
      publisher: metadata.publisher,
      URL: metadata.URL,
    };

    // Fallback para evitar errores si está vacío
    if (!item.title && !item.author) {
      item.title = "Referencia sin título";
    }

    return item;
  };

  const handleGenerate = async () => {
    const cslJson = buildCSL();

    if (!selectedStyle) {
      alert("Debes seleccionar un estilo de cita.");
      return;
    }

    if (!cslJson.title && !cslJson.author) {
      alert("Debes completar al menos el título o el autor.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/citation/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: cslJson,
          style: selectedStyle,
          output: "html",
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error("Respuesta no OK del servidor");
      }

      const data = JSON.parse(text);
      if (!data.citationHtml) throw new Error("Falta citationHtml");

      setDoc((prev) => prev + data.citationHtml);
      setModalOpen(false);

      // Limpiar metadata
      setMetadata({
        author: "",
        title: "",
        year: "",
        containerTitle: "",
        pages: "",
        publisher: "",
        URL: "",
      });
    } catch (error) {
      console.error("Error generando cita:", error);
      alert("Error generando cita: " + error.message);
    }
  };

  return (
    <div className="flex flex-col h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-semibold mb-4">Editor de Investigación</h1>
      <div className="flex flex-1 gap-6">
        <TextEditor
          doc={doc}
          setDoc={setDoc}
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          metadata={metadata}
          setMetadata={setMetadata}
          selectedStyle={selectedStyle}
          setSelectedStyle={setSelectedStyle}
          styles={styles}
          handleGenerate={handleGenerate}
        />
        <PdfViewer />
      </div>
    </div>
  );
}
