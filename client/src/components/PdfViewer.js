import React, { useRef } from "react";

export default function PdfViewer() {
  const pdfInputRef = useRef(null);

  const openPdfDialog = () => {
    pdfInputRef.current?.click();
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

    e.target.value = null;
  };

  return (
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
  );
}
