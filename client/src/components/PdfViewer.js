import React, { useRef } from "react";

export default function PdfViewer({
  pdfs,
  activePdfUrl,
  setActivePdfUrl,
  addPdf,
  removePdf,
  googleAccessToken,
}) {
  console.log("PdfViewer googleAccessToken:", googleAccessToken);
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

  // 1. FUNCIÓN PARA ABRIR EL GOOGLE PICKER
  const openGoogleDrivePicker = () => {
    // Verificar si las APIs de Google están cargadas y si tenemos un token de acceso
    if (!window.gapi || !window.gapi.client || !googleAccessToken) {
      alert(
        "Google Drive API no cargada o no autenticada. Intenta recargar la página."
      );
      console.error("Google Drive API o token de acceso no disponible:", {
        gapi: window.gapi,
        client: window.gapi?.client,
        googleAccessToken,
      });
      return;
    }

    // Configurar la vista del Picker para PDFs
    const view = new window.google.picker.DocsView()
      .setMimeTypes("application/pdf") // Solo PDFs
      .setParent("root") // Puedes cambiar esto a una carpeta específica si lo deseas
      .setOwnedByMe(true); // Opcional: mostrar solo archivos propiedad del usuario

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(googleAccessToken) // Usar el token de acceso del usuario
      // IMPORTANTE: Asegúrate de tener una REACT_APP_GOOGLE_API_KEY en tu .env.local
      // Esta API Key se obtiene del Google Cloud Console (APIs & Services -> Credentials)

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
      return;
    }
    console.log("API Key:", process.env.REACT_APP_GOOGLE_API_KEY);
    picker.setVisible(true); // Abre el Picker
  };

  // 2. CALLBACK DEL GOOGLE PICKER
  const pickerCallback = (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0]; // Asumimos que solo se selecciona un archivo
      const fileId = doc.id;
      const fileName = doc.name;
      console.log(`Archivo seleccionado: ID=${fileId}, Nombre=${fileName}`);
      downloadFileFromDrive(fileId, fileName);
    } else if (data.action === window.google.picker.Action.CANCEL) {
      console.log("Selección de archivo de Google Drive cancelada.");
    }
  };

  // 3. FUNCIÓN PARA DESCARGAR EL ARCHIVO DE GOOGLE DRIVE
  // PdfViewer.js (en la función downloadFileFromDrive)

  const downloadFileFromDrive = async (fileId, fileName) => {
    try {
      const response = await window.gapi.client.drive.files.get(
        {
          fileId: fileId,
          alt: "media", // Esto es crucial para obtener el contenido binario del archivo
        },
        {
          // Este 'responseType' es una SUGERENCIA para gapi.client.
          // A veces, gapi.client aún puede devolver un string,
          // por lo que debemos manejarlo.
          responseType: "arraybuffer", // Asegura que la solicitud pida arraybuffer
        }
      );

      console.log("Respuesta completa de Google Drive:", response);
      console.log(
        "response.body (tipo y contenido):",
        typeof response.body,
        response.body
      );
      console.log(
        "response.result (tipo y contenido):",
        typeof response.result,
        response.result
      );

      if (response.status === 200) {
        let pdfData;

        // CASO 1: response.body ya es un ArrayBuffer o Uint8Array (IDEAL)
        if (
          response.body instanceof ArrayBuffer ||
          response.body instanceof Uint8Array
        ) {
          pdfData = response.body;
          console.log("PDF data es ArrayBuffer/Uint8Array de response.body");
        }
        // CASO 2: response.result es un ArrayBuffer (Algunas APIs o versiones de gapi)
        else if (
          response.result instanceof ArrayBuffer ||
          response.result instanceof Uint8Array
        ) {
          pdfData = response.result;
          console.log("PDF data es ArrayBuffer/Uint8Array de response.result");
        }
        // CASO 3: response.body es una STRING que contiene los datos BINARIOS (¡TU CASO ACTUAL!)
        else if (
          typeof response.body === "string" &&
          response.body.startsWith("%PDF-")
        ) {
          // Convertir la cadena (que en realidad son bytes) a un ArrayBuffer
          // Esto se hace creando un Uint8Array a partir de los códigos de caracteres de la cadena
          const stringToBytes = (str) => {
            const bytes = new Uint8Array(str.length);
            for (let i = 0; i < str.length; i++) {
              bytes[i] = str.charCodeAt(i) & 0xff; // Asegura que solo se toma el byte bajo
            }
            return bytes.buffer; // Devuelve el ArrayBuffer subyacente
          };
          pdfData = stringToBytes(response.body);
          console.log("PDF data convertida de string a ArrayBuffer.");
        }
        // CASO 4: Ninguno de los anteriores, error
        else {
          throw new Error(
            "La respuesta de Google Drive no contiene datos PDF binarios esperados."
          );
        }

        const fileBlob = new Blob([pdfData], { type: "application/pdf" });
        const fileUrl = URL.createObjectURL(fileBlob);
        addPdf({ url: fileUrl, name: fileName });
        alert(`PDF "${fileName}" cargado desde Google Drive.`);
      } else {
        // Manejo de errores HTTP como 403, 404, etc.
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
      console.error("Error descargando archivo de Google Drive:", error);
      alert(
        `Error al descargar el PDF de Google Drive: ${error.message}. Asegúrate de tener permisos.`
      );
    }
  };

  return (
    <div className="w-1/2 bg-white p-4 rounded-2xl shadow-lg flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-medium">Visor de PDF</h2>
        <div className="flex gap-2">
          {" "}
          {/* Contenedor para los botones */}
          <button
            onClick={openPdfDialog}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Cargar PDF (local)
          </button>
          {/* NUEVO BOTÓN PARA CARGAR DESDE GOOGLE DRIVE */}
          <button
            onClick={openGoogleDrivePicker}
            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            // Deshabilitar si no hay token de acceso de Google
            disabled={!googleAccessToken}
            title={
              !googleAccessToken
                ? "Inicia sesión con Google para usar Drive"
                : "Cargar PDF desde Google Drive"
            }
          >
            Cargar PDF (Drive)
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
