import React, { useState, useRef, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react"; // Importamos Dialog y Transition
import {
  ArrowUpTrayIcon, // Para cargar
  ArrowDownTrayIcon, // Para guardar
  FolderOpenIcon, // Para local (en el modal)
  CloudArrowUpIcon, // Para Drive Cargar (en el modal)
  CloudArrowDownIcon, // Para Drive Guardar (en el modal)
} from "@heroicons/react/24/outline"; // Iconos de Heroicons

export default function PdfViewer({
  pdfs,
  activePdfUrl,
  setActivePdfUrl,
  addPdf,
  removePdf,
  googleAccessToken,
}) {
  const pdfInputRef = useRef(null);
  // Nuevo estado para controlar el modal de selección de archivo
  const [fileSelectionModalOpen, setFileSelectionModalOpen] = useState(false);
  // Nuevo estado para saber si es una acción de 'upload' o 'download'
  const [currentAction, setCurrentAction] = useState(null); // 'upload' o 'download'

  const openPdfDialog = () => {
    pdfInputRef.current?.click();
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") {
      alert("Por favor selecciona un archivo PDF válido.");
      e.target.value = null;
      setFileSelectionModalOpen(false);
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    const fileName = file.name;
    addPdf({ url: fileUrl, name: fileName });
    e.target.value = null;
    alert(`PDF "${fileName}" cargado desde Mi dispositivo.`); // Alerta de confirmación local
    setFileSelectionModalOpen(false);
  };

  const handleTabClick = (url) => {
    setActivePdfUrl(url);
  };

  const handleCloseTab = (urlToRemove, e) => {
    e.stopPropagation();
    removePdf(urlToRemove);
  };

  // 1. FUNCIÓN PARA ABRIR EL GOOGLE PICKER (PARA CARGAR PDF)
  // Esta función sigue usando el Picker porque es para SELECCIONAR un PDF existente de Drive.
  const openGoogleDrivePicker = () => {
    // Verificar si las APIs de Google están cargadas y si tenemos un token de acceso
    if (!window.gapi || !window.gapi.client || !googleAccessToken) {
      alert(
        "Google Drive API no cargada o no autenticada. Intenta recargar la página."
      );
      setFileSelectionModalOpen(false);
      return;
    }

    // Configurar la vista del Picker para PDFs
    const view = new window.google.picker.DocsView();

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(googleAccessToken) // Usar el token de acceso del usuario
      .setDeveloperKey(process.env.REACT_APP_GOOGLE_API_KEY)
      .setCallback(pickerCallback) // Función que manejará los resultados del Picker
      .build();

    if (!window.google || !window.google.picker) {
      console.error(
        "Google Picker no está disponible. Asegúrate de que las APIs se cargaron correctamente."
      );
      alert(
        "El servicio de selección de archivos de Google no está listo. Intenta recargar la página."
      );
      setFileSelectionModalOpen(false);
      return;
    }
    picker.setVisible(true); // Abre el Picker
  };

  // 2. CALLBACK DEL GOOGLE PICKER (PARA CARGAR PDF)
  const pickerCallback = async (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0]; // Asumimos que solo se selecciona un archivo
      const fileId = doc.id;
      const fileName = doc.name;
      const mimeType = doc.mimeType; // Obtener el MIME type aquí

      // *** Lógica para verificar si es PDF antes de intentar descargar ***
      if (mimeType !== "application/pdf") {
        alert(
          `El archivo "${fileName}" (Tipo: ${mimeType}) no es un PDF. Por favor, selecciona un archivo PDF.`
        );
        setFileSelectionModalOpen(false);
        return;
      }

      // Si es un PDF, procedemos a intentar descargarlo
      try {
        await downloadFileFromDrive(fileId, fileName);
      } catch (error) {
        console.error("Error en pickerCallback al descargar PDF:", error);
        alert(`Error al cargar el PDF "${fileName}": ${error.message}.`);
      } finally {
        setFileSelectionModalOpen(false); // Cierra el modal después de la operación (éxito o fallo)
      }
    } else if (data.action === window.google.picker.Action.CANCEL) {
      setFileSelectionModalOpen(false);
    }
  };

  // 3. FUNCIÓN PARA DESCARGAR EL ARCHIVO DE GOOGLE DRIVE
  const downloadFileFromDrive = async (fileId, fileName) => {
    try {
      const response = await window.gapi.client.drive.files.get(
        {
          fileId: fileId,
          alt: "media", // Esto es crucial para obtener el contenido binario del archivo
        },
        {
          responseType: "arraybuffer", // Asegura que la solicitud pida arraybuffer
        }
      );

      if (response.status === 200) {
        let pdfData;

        if (
          response.body instanceof ArrayBuffer ||
          response.body instanceof Uint8Array
        ) {
          pdfData = response.body;
        } else if (
          response.result instanceof ArrayBuffer ||
          response.result instanceof Uint8Array
        ) {
          pdfData = response.result;
        } else if (
          typeof response.body === "string" &&
          response.body.startsWith("%PDF-")
        ) {
          const stringToBytes = (str) => {
            const bytes = new Uint8Array(str.length);
            for (let i = 0; i < str.length; i++) {
              bytes[i] = str.charCodeAt(i) & 0xff;
            }
            return bytes.buffer;
          };
          pdfData = stringToBytes(response.body);
        } else {
          throw new Error(
            "La respuesta de Google Drive no contiene datos PDF binarios válidos (estructura inválida)."
          );
        }

        const fileBlob = new Blob([pdfData], { type: "application/pdf" });
        const fileUrl = URL.createObjectURL(fileBlob);
        addPdf({ url: fileUrl, name: fileName });
        return;
      } else {
        const errorBody =
          typeof response.body === "string"
            ? JSON.parse(response.body)
            : response.body;
        throw new Error(
          `Error HTTP: ${response.status} - ${
            errorBody?.error?.message ||
            response.statusText ||
            "Error desconocido"
          }`
        );
      }
    } catch (error) {
      throw error;
    }
  };
  const handleSavePdfLocal = async () => {
    if (!activePdfUrl) {
      alert("No hay un PDF activo para guardar.");
      setFileSelectionModalOpen(false);
      return;
    }

    const activePdf = pdfs.find((pdf) => pdf.url === activePdfUrl);
    if (!activePdf) {
      alert("No se encontró el PDF activo para guardar.");
      setFileSelectionModalOpen(false);
      return;
    }

    const fileName = prompt(
      "Introduce el nombre del archivo (sin extensión). Se guardará como .pdf",
      activePdf.name.endsWith(".pdf")
        ? activePdf.name.slice(0, -4)
        : activePdf.name
    );
    if (!fileName) {
      alert("Operación de guardar cancelada.");
      setFileSelectionModalOpen(false);
      return;
    }

    try {
      const response = await fetch(activePdf.url);
      const blob = await response.blob();

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`PDF "${fileName}.pdf" guardado con éxito en su dispositivo.`);
    } catch (error) {
      console.error("Error al guardar PDF localmente:", error);
      alert(
        `Error al guardar el PDF localmente: ${
          error.message || "Error desconocido"
        }`
      );
    } finally {
      setFileSelectionModalOpen(false);
    }
  };
  // --- FUNCIÓN PARA GUARDAR EL PDF ACTIVO DIRECTAMENTE EN GOOGLE DRIVE CON PROMPT DE NOMBRE ---
  const savePdfToDrive = async () => {
    if (!activePdfUrl) {
      alert("No hay un PDF activo para guardar.");
      setFileSelectionModalOpen(false);
      return;
    }

    if (!googleAccessToken) {
      alert(
        "No estás autenticado con Google. Por favor, inicia sesión para guardar en Drive."
      );
      setFileSelectionModalOpen(false);
      return;
    }

    // Identificar el PDF activo que se quiere guardar
    const activePdf = pdfs.find((pdf) => pdf.url === activePdfUrl);
    if (!activePdf) {
      alert("No se encontró el PDF activo para guardar.");
      setFileSelectionModalOpen(false);
      return;
    }

    // Pedir el nombre del archivo al usuario usando prompt
    const defaultFileName = activePdf.name.endsWith(".pdf")
      ? activePdf.name.slice(0, -4) // Quitar .pdf si ya lo tiene para sugerir solo el nombre
      : activePdf.name;

    const fileName = prompt(
      `Introduce el nombre del archivo para Google Drive (se guardará como .pdf):`,
      defaultFileName
    );

    if (!fileName) {
      alert("Operación de guardar cancelada. No se proporcionó un nombre.");
      setFileSelectionModalOpen(false);
      return;
    }

    // Asegurarse de que el nombre termina en .pdf
    const finalFileName = fileName.toLowerCase().endsWith(".pdf")
      ? fileName
      : `${fileName}.pdf`;

    // Convertir la URL del blob a un objeto Blob
    let blob;
    try {
      const response = await fetch(activePdf.url);
      blob = await response.blob();
    } catch (error) {
      console.error("Error al obtener el Blob del PDF activo:", error);
      alert(
        "No se pudo preparar el PDF para guardar. Asegúrate de que el PDF esté cargado correctamente."
      );
      setFileSelectionModalOpen(false);
      return;
    }

    // Verificar que gapi.client.drive esté disponible antes de hacer la solicitud
    if (!window.gapi || !window.gapi.client || !window.gapi.client.drive) {
      alert(
        "Las APIs de Google Drive no están cargadas o no se han inicializado correctamente. Intenta recargar la página."
      );
      console.error("gapi.client.drive no está disponible:", window.gapi);
      setFileSelectionModalOpen(false);
      return;
    }

    // Metadatos del archivo para la API de Drive
    const metadata = {
      name: finalFileName,
      mimeType: "application/pdf",
      // No especificamos 'parents' para que se suba a la raíz de Google Drive
    };

    // Crear un objeto FormData para la subida multipart
    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", blob); // Aquí va el Blob del contenido del PDF

    try {
      // Realizar la solicitud de subida a la API de Google Drive
      const response = await window.gapi.client.request({
        path: "https://www.googleapis.com/upload/drive/v3/files",
        method: "POST",
        params: { uploadType: "multipart" },
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
          // FormData se encarga de 'Content-Type': 'multipart/form-data; boundary=...' automáticamente
        },
        body: form, // FormData maneja el body y el Content-Type por nosotros
      });

      if (response.status === 200) {
        alert(
          `PDF "${response.result.name}" subido exitosamente a Google Drive.`
        );
        console.log("PDF guardado en Drive:", response.result);
      } else {
        console.error("Error al subir el PDF:", response);
        alert(
          `Error al subir el PDF a Google Drive: ${
            response.statusText || "Error desconocido"
          }.`
        );
      }
    } catch (error) {
      console.error("Excepción al subir PDF a Drive:", error);
      let errorMessage = "Error desconocido al subir el PDF.";
      if (error.result && error.result.error && error.result.error.message) {
        errorMessage = error.result.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(`Error al subir el PDF a Google Drive: ${errorMessage}.`);
    } finally {
      setFileSelectionModalOpen(false); // Cierra el modal después de la operación (éxito o fallo)
    }
  };

  // Función para manejar la selección en el modal
  const handleActionSelection = (source) => {
    if (currentAction === "upload") {
      if (source === "local") {
        openPdfDialog(); // Esto dispara el input file oculto
      } else if (source === "drive") {
        openGoogleDrivePicker(); // Esto abre el picker de Google Drive
      }
    } else if (currentAction === "download") {
      if (source === "local") {
        handleSavePdfLocal(); // Lógica para guardar PDF localmente
      } else if (source === "drive") {
        savePdfToDrive(); // Lógica para guardar PDF en Drive
      }
    }
    // El modal se cierra dentro de las funciones de acción correspondientes.
  };
  return (
    <div className="w-1/2 bg-white p-4 rounded-2xl shadow-lg flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-medium">Visor de PDF</h2>
        <div className="flex gap-3">
          {/* Botón para abrir el modal de CARGAR PDF */}
          <button
            onClick={() => {
              setCurrentAction("upload");
              setFileSelectionModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
            <span>Cargar PDF</span>
          </button>

          {/* Botón para abrir el modal de GUARDAR PDF */}
          <button
            onClick={() => {
              setCurrentAction("download");
              setFileSelectionModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            disabled={!activePdfUrl} // Deshabilitar si no hay PDF activo para guardar
            title={!activePdfUrl ? "Carga un PDF para guardar" : ""}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Guardar PDF</span>
          </button>
        </div>
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
          <div className="px-4 py-2 text-gray-500 text-sm"></div>
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

      {/* MODAL PARA SELECCIÓN DE ORIGEN/DESTINO DE ARCHIVOS (Igual que en TextEditor) */}
      <Transition appear show={fileSelectionModalOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setFileSelectionModalOpen(false)}
        >
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-semibold leading-6 text-gray-900"
                  >
                    {currentAction === "upload"
                      ? "Cargar PDF desde..."
                      : "Guardar PDF en..."}
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    {/* Opción Local */}
                    <button
                      onClick={() => handleActionSelection("local")}
                      className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition"
                    >
                      <FolderOpenIcon className="h-6 w-6 text-indigo-600" />
                      <span className="text-lg">Mi dispositivo</span>
                    </button>

                    {/* Opción Google Drive */}
                    <button
                      onClick={() => handleActionSelection("drive")}
                      disabled={!googleAccessToken}
                      className={`w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-800 transition ${
                        !googleAccessToken
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      }`}
                      title={
                        !googleAccessToken
                          ? "Inicia sesión con Google para usar Drive"
                          : ""
                      }
                    >
                      {currentAction === "upload" ? (
                        <CloudArrowUpIcon className="h-6 w-6 text-indigo-600" />
                      ) : (
                        <CloudArrowDownIcon className="h-6 w-6 text-indigo-600" />
                      )}
                      <span className="text-lg">Google Drive</span>
                    </button>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
                      onClick={() => setFileSelectionModalOpen(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
