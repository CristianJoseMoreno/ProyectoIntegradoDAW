import React, { useState, useEffect, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Dialog } from "@headlessui/react";
import mammoth from "mammoth";

export default function Research() {
  const [doc, setDoc] = useState("");
  const [styles, setStyles] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(
    "https://mozilla.github.io/pdf.js/web/viewer.html"
  );
  const [metadata, setMetadata] = useState({
    author: "",
    title: "",
    year: "",
    containerTitle: "",
    pages: "",
    publisher: "",
    URL: "",
  });
  // Ref para input file oculto
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  // Abrir explorador de archivos
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openPdfDialog = () => {
    pdfInputRef.current?.click();
  };

  // Leer archivo cargado
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "txt") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDoc(event.target.result);
      };
      reader.readAsText(file);
    } else if (ext === "docx") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setDoc(result.value);
      } catch (err) {
        alert("Error leyendo archivo .docx: " + err.message);
      }
    } else {
      alert("Solo se permiten archivos .txt y .docx");
    }

    e.target.value = null; // permitir cargar mismo archivo varias veces
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") {
      alert("Por favor selecciona un archivo PDF válido.");
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    const viewerUrl = `/web/viewer.html?file=${encodeURIComponent(fileUrl)}`;

    const iframe = document.getElementById("pdf-viewer");
    if (iframe) {
      iframe.src = viewerUrl;
    }

    setPdfUrl(viewerUrl);
    e.target.value = null;
  };

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

  const handleSave = () => {
    const blob = new Blob([doc], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "documento.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-semibold mb-4">Editor de Investigación</h1>
      <div className="flex flex-1 gap-6">
        {/* Editor */}
        <div className="w-1/2 relative bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
          {/* Contenedor de botones */}
          <div className="flex justify-between items-center gap-3 p-4">
            <div className="flex gap-3">
              <button
                onClick={openFileDialog}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Cargar archivo
              </button>

              <button
                onClick={handleSave}
                className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Guardar archivo
              </button>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Insertar referencia
            </button>
          </div>

          {/* Input de archivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.docx"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <div className="flex-1 overflow-auto">
            <ReactQuill
              value={doc}
              onChange={setDoc}
              theme="snow"
              className="h-full"
            />
          </div>
        </div>

        {/* Visor PDF */}
        <div className="w-1/2 bg-white p-4 rounded-2xl shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-medium">Visor de PDF</h2>
            <button
              onClick={openPdfDialog}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Cargar PDF
            </button>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
              style={{ display: "none" }}
            />
          </div>
          <iframe
            id="pdf-viewer"
            src="/web/viewer.html"
            title="Visor PDF"
            className="flex-1 rounded-md border"
          />
        </div>
      </div>

      {/* Modal de metadatos */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      >
        <Dialog.Panel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
          <Dialog.Title className="text-xl font-semibold mb-4">
            Nueva referencia
          </Dialog.Title>
          <div className="space-y-3 h-80 overflow-auto">
            <input
              type="text"
              placeholder="Autor1,Nombre;Autor2,Nombre"
              value={metadata.author}
              onChange={(e) =>
                setMetadata((m) => ({ ...m, author: e.target.value }))
              }
              className="w-full border p-2 rounded-lg"
            />
            <input
              type="text"
              placeholder="Título"
              value={metadata.title}
              onChange={(e) =>
                setMetadata((m) => ({ ...m, title: e.target.value }))
              }
              className="w-full border p-2 rounded-lg"
            />
            <input
              type="number"
              placeholder="Año"
              value={metadata.year}
              onChange={(e) =>
                setMetadata((m) => ({ ...m, year: e.target.value }))
              }
              className="w-full border p-2 rounded-lg"
            />
            <input
              type="text"
              placeholder="Libro o revista"
              value={metadata.containerTitle}
              onChange={(e) =>
                setMetadata((m) => ({ ...m, containerTitle: e.target.value }))
              }
              className="w-full border p-2 rounded-lg"
            />
            <input
              type="text"
              placeholder="Páginas (p. x–y)"
              value={metadata.pages}
              onChange={(e) =>
                setMetadata((m) => ({ ...m, pages: e.target.value }))
              }
              className="w-full border p-2 rounded-lg"
            />
            <input
              type="text"
              placeholder="Editorial"
              value={metadata.publisher}
              onChange={(e) =>
                setMetadata((m) => ({ ...m, publisher: e.target.value }))
              }
              className="w-full border p-2 rounded-lg"
            />
            <input
              type="url"
              placeholder="URL"
              value={metadata.URL}
              onChange={(e) =>
                setMetadata((m) => ({ ...m, URL: e.target.value }))
              }
              className="w-full border p-2 rounded-lg"
            />
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="w-full border p-2 rounded-lg"
            >
              {styles.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Insertar
            </button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}
