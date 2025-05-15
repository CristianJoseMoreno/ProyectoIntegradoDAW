import React, { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";

export default function Investigar() {
  const [doc, setDoc] = useState("// Comienza a escribir aquí...");
  const [zoteroId, setZoteroId] = useState("");

  const handleInsertCitation = async () => {
    if (!zoteroId) return alert("Introduce un ID de Zotero");
    try {
      const res = await fetch(
        `http://localhost:5000/api/zotero/citation/${zoteroId}`
      );
      const { citation } = await res.json();
      setDoc((prev) => prev + ` (${citation})`);
    } catch (err) {
      alert("Error al insertar cita");
    }
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-50">
      <h1 className="text-2xl font-semibold mb-4">Editor de Investigación</h1>
      <div className="flex flex-1 gap-4">
        <div className="w-1/2 bg-white p-4 rounded-2xl shadow-md flex flex-col">
          <h2 className="text-lg font-medium mb-2">Editor</h2>
          <CodeMirror
            value={doc}
            height="400px"
            extensions={[javascript()]}
            onChange={(val) => setDoc(val)}
            theme="light"
          />
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              placeholder="ID de Zotero"
              value={zoteroId}
              onChange={(e) => setZoteroId(e.target.value)}
              className="border px-3 py-2 rounded-lg flex-1"
            />
            <button
              onClick={handleInsertCitation}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Insertar Cita
            </button>
          </div>
        </div>

        <div className="w-1/2 bg-white p-4 rounded-2xl shadow-md">
          <h2 className="text-lg font-medium mb-2">Lector de PDF</h2>
          <iframe
            src="https://mozilla.github.io/pdf.js/web/viewer.html"
            title="Visor PDF"
            className="w-full h-[90%] rounded-md border"
          />
        </div>
      </div>
    </div>
  );
}
