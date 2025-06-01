import React, { useState, useRef, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Dialog } from "@headlessui/react";
import mammoth from "mammoth";

export default function TextEditor({
  doc,
  setDoc,
  modalOpen,
  setModalOpen,
  metadata,
  setMetadata,
  selectedStyle,
  setSelectedStyle,
  styles,
  handleGenerate,
}) {
  const fileInputRef = useRef(null);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

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

    e.target.value = null;
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
