import React, { useRef } from "react";

export default function PdfViewer({
  pdfs,
  activePdfUrl,
  setActivePdfUrl,
  addPdf,
  removePdf,
}) {
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
    const fileName = file.name;
    addPdf({ url: fileUrl, name: fileName });
    e.target.value = null;
  };

  const handleTabClick = (url) => {
    setActivePdfUrl(url);
  };

  const handleCloseTab = (urlToRemove, e) => {
    e.stopPropagation();
    removePdf(urlToRemove);
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

      <div className="flex overflow-x-auto border-b border-gray-200">
        {pdfs.map((pdf) => (
          <div
            key={pdf.url}
            className={`flex items-center px-4 py-2 cursor-pointer border-r border-l border-t rounded-t-md text-sm whitespace-nowrap ${
              activePdfUrl === pdf.url
                ? "bg-white border-blue-500 text-blue-700"
                : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => handleTabClick(pdf.url)}
          >
            <span>{pdf.name || "Sin nombre"}</span>
            {pdfs.length > 0 && (
              <button
                onClick={(e) => handleCloseTab(pdf.url, e)}
                className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                &times;
              </button>
            )}
          </div>
        ))}
        {pdfs.length === 0 && (
          <div className="px-4 py-2 text-gray-500 text-sm">
            Carga un PDF para empezar
          </div>
        )}
      </div>

      {activePdfUrl ? (
        <iframe
          key={activePdfUrl}
          src={`/web/viewer.html?file=${encodeURIComponent(activePdfUrl)}`}
          title="Visor PDF"
          className="flex-1 rounded-md border mt-2"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No hay PDF seleccionado. Carga uno o selecciona una pestaña.
        </div>
      )}
    </div>
  );
}
