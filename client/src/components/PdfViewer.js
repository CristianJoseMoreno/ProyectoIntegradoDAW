// src/components/PdfViewer.js
import React, { useState, useRef, useCallback } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  FolderOpenIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import PromptConfirmModal from "./PromptConfirmModal";

export default function PdfViewer({
  pdfs,
  activePdfUrl,
  setActivePdfUrl,
  addPdf,
  removePdf,
  googleAccessToken,
  downloadPdfFromDriveAndAddToState,
  areGoogleApisReady,
}) {
  const pdfInputRef = useRef(null);
  const [fileSelectionModalOpen, setFileSelectionModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptModalConfig, setPromptModalConfig] = useState({
    title: "",
    message: "",
    showInputField: false,
    inputPlaceholder: "",
    onConfirm: () => {}, // Función a llamar al confirmar
    iconType: "document", // O 'warning'
  });

  const openPdfDialog = useCallback(() => {
    pdfInputRef.current?.click();
  }, []);

  const handlePdfChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file || file.type !== "application/pdf") {
        toast.error("Por favor selecciona un archivo PDF válido.");
        e.target.value = null;
        setFileSelectionModalOpen(false);
        return;
      }

      const fileUrl = URL.createObjectURL(file);
      const fileName = file.name;
      addPdf({ url: fileUrl, name: fileName, googleDriveFileId: null }); // PDFs locales no tienen googleDriveFileId
      e.target.value = null;
      toast.success(`PDF "${fileName}" cargado desde Mi dispositivo.`);
      setFileSelectionModalOpen(false);
    },
    [addPdf]
  );

  const handleTabClick = useCallback(
    (url) => {
      setActivePdfUrl(url);
    },
    [setActivePdfUrl]
  );

  const handleCloseTab = useCallback(
    (urlToRemove, e) => {
      e.stopPropagation();
      removePdf(urlToRemove);
    },
    [removePdf]
  );

  const pickerCallback = useCallback(
    async (data) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const doc = data.docs[0];
        const fileId = doc.id;
        const fileName = doc.name;
        const mimeType = doc.mimeType;

        if (mimeType !== "application/pdf") {
          toast.error(
            `El archivo "${fileName}" (Tipo: ${mimeType}) no es un PDF. Por favor, selecciona un archivo PDF.`
          );
          setFileSelectionModalOpen(false);
          return;
        }

        try {
          console.log(
            "DEBUG (PdfViewer): Picker seleccionado - ID:",
            fileId,
            "Nombre:",
            fileName
          );
          await downloadPdfFromDriveAndAddToState(fileId, fileName);
          toast.success(`PDF "${fileName}" cargado desde Google Drive.`);
        } catch (error) {
          console.error(
            "Error (PdfViewer): Error en pickerCallback al descargar PDF:",
            error
          );
          toast.error(
            `Error al cargar el PDF "${fileName}": ${error.message}.`
          );
        } finally {
          setFileSelectionModalOpen(false);
        }
      } else if (data.action === window.google.picker.Action.CANCEL) {
        setFileSelectionModalOpen(false);
      }
    },
    [downloadPdfFromDriveAndAddToState]
  );

  const openGoogleDrivePicker = useCallback(() => {
    if (
      !window.gapi ||
      !window.gapi.client ||
      !googleAccessToken ||
      !areGoogleApisReady
    ) {
      toast.error(
        "Google Drive API no cargada o no autenticada. Intenta recargar la página."
      );
      setFileSelectionModalOpen(false);
      return;
    }

    const view = new window.google.picker.DocsView();

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(googleAccessToken)
      .setDeveloperKey(process.env.REACT_APP_GOOGLE_API_KEY)
      .setCallback(pickerCallback)
      .build();

    if (!window.google || !window.google.picker) {
      console.error(
        "Google Picker no está disponible. Asegúrate de que las APIs se cargaron correctamente."
      );
      toast.error(
        "El servicio de selección de archivos de Google no está listo. Intenta recargar la página."
      );
      // Aquí también debería ser setFileSelectionModalOpen(false); en lugar de setIsPromptModalOpen(false);
      // Si la API no está lista, cierras el modal de selección de archivos, no el de prompt
      setFileSelectionModalOpen(false);
      return;
    }
    picker.setVisible(true);
  }, [googleAccessToken, areGoogleApisReady, pickerCallback]);

  // CAMBIO: Lógica real para guardar localmente, ahora llamada desde onConfirm de la modal
  const executeSavePdfLocal = useCallback(
    async (fileName) => {
      if (!activePdfUrl) {
        toast.error("No hay un PDF activo para guardar.");
        // No cierres el modal aquí, el onConfirm ya lo hará.
        return;
      }

      const activePdf = pdfs.find((pdf) => pdf.url === activePdfUrl);
      if (!activePdf) {
        toast.error("No se encontró el PDF activo para guardar.");
        // No cierres el modal aquí, el onConfirm ya lo hará.
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

        toast.success(
          `PDF "${fileName}.pdf" guardado con éxito en su dispositivo.`
        );
      } catch (error) {
        console.error("Error al guardar PDF localmente:", error);
        toast.error(
          `Error al guardar el PDF localmente: ${
            error.message || "Error desconocido"
          }`
        );
      } finally {
        // El onConfirm del promptModalConfig cerrará el modal
      }
    },
    [activePdfUrl, pdfs]
  );

  // CAMBIO: La función handleSavePdfLocal ahora usa el PromptConfirmModal
  const handleSavePdfLocal = useCallback(() => {
    if (!activePdfUrl) {
      toast.error("No hay un PDF activo para guardar.");
      setFileSelectionModalOpen(false); // Cierra el modal de selección si no hay PDF
      return;
    }
    const activePdf = pdfs.find((pdf) => pdf.url === activePdfUrl);
    const defaultFileName = activePdf?.name.endsWith(".pdf")
      ? activePdf.name.slice(0, -4)
      : activePdf?.name || "documento";

    setPromptModalConfig({
      title: "Guardar archivo en Mi dispositivo",
      message:
        "Introduce el nombre del archivo (sin extensión). Se guardará como .pdf",
      showInputField: true,
      inputPlaceholder: defaultFileName,
      onConfirm: (fileName) => {
        if (fileName) {
          executeSavePdfLocal(fileName); // Llama a la lógica de guardado real
          setIsPromptModalOpen(false); // Cierra el modal después de la confirmación
        } else {
          toast.error(
            "Operación de guardar cancelada: Nombre de archivo vacío."
          );
          // No cierres el modal aquí para que el usuario pueda corregir
        }
      },
      iconType: "document",
    });
    setIsPromptModalOpen(true); // Abre el modal de prompt
    // setFileSelectionModalOpen(false); // Podrías cerrar el modal de selección aquí o en onConfirm del prompt
  }, [activePdfUrl, pdfs, executeSavePdfLocal]);

  // Helper function to convert Blob to Base64 (Esta función ya existía y es correcta)
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]); // Get only the Base64 part
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // CAMBIO: Lógica real para guardar en Google Drive, ahora llamada desde onConfirm de la modal
  const executeSavePdfToDrive = useCallback(
    async (fileName) => {
      if (!activePdfUrl) {
        toast.error("No hay un PDF activo para guardar.");
        // No cierres el modal aquí, el onConfirm ya lo hará.
        return;
      }
      if (!googleAccessToken) {
        toast.error(
          "No estás autenticado con Google. Por favor, inicia sesión para guardar en Drive."
        );
        // No cierres el modal aquí, el onConfirm ya lo hará.
        return;
      }
      const activePdf = pdfs.find((pdf) => pdf.url === activePdfUrl);
      if (!activePdf) {
        toast.error("No se encontró el PDF activo para guardar.");
        // No cierres el modal aquí, el onConfirm ya lo hará.
        return;
      }

      let blob;
      try {
        const response = await fetch(activePdf.url);
        blob = await response.blob();
      } catch (error) {
        console.error("Error al obtener el Blob del PDF activo:", error);
        toast.error(
          "No se pudo preparar el PDF para guardar. Asegúrate de que el PDF esté cargado correctamente."
        );
        // No cierres el modal aquí, el onConfirm ya lo hará.
        return;
      }

      if (!window.gapi || !window.gapi.client || !window.gapi.client.drive) {
        toast.error(
          "Las APIs de Google Drive no están cargadas o no se han inicializado correctamente. Intenta recargar la página."
        );
        console.error("gapi.client.drive no está disponible:", window.gapi);
        // No cierres el modal aquí, el onConfirm ya lo hará.
        return;
      }

      try {
        const base64Data = await blobToBase64(blob); // Convertir blob a Base64

        const boundary = "-------314159265358979323846"; // Define a unique boundary
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delimiter = "\r\n--" + boundary + "--";

        const metadata = {
          name: fileName.toLowerCase().endsWith(".pdf")
            ? fileName
            : `${fileName}.pdf`,
          mimeType: "application/pdf",
          // parents: [] // If you want to put it in a specific folder, use parent IDs
        };

        const multipartRequestBody =
          delimiter +
          "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
          JSON.stringify(metadata) +
          delimiter +
          "Content-Type: application/pdf\r\n" + // Explicitly set content type for the file
          "Content-Transfer-Encoding: base64\r\n" + // Indicate base64 encoding
          "\r\n" +
          base64Data + // Insert the Base64 data
          close_delimiter;

        const response = await window.gapi.client.request({
          path: "https://www.googleapis.com/upload/drive/v3/files",
          method: "POST",
          params: { uploadType: "multipart" },
          headers: {
            Authorization: `Bearer ${googleAccessToken}`,
            "Content-Type": `multipart/related; boundary="${boundary}"`, // Set content type with boundary
          },
          body: multipartRequestBody, // Send the manually constructed body string
        });

        if (response.status === 200) {
          toast.success(
            `PDF "${response.result.name}" subido exitosamente a Google Drive.`
          );
          console.log("PDF guardado en Drive:", response.result);
        } else {
          console.error("Error al subir el PDF:", response);
          toast.error(
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
        toast.error(`Error al subir el PDF a Google Drive: ${errorMessage}.`);
      } finally {
        // El onConfirm del promptModalConfig cerrará el modal
      }
    },
    [activePdfUrl, googleAccessToken, pdfs]
  );

  // CAMBIO: La función savePdfToDrive ahora usa el PromptConfirmModal
  const savePdfToDrive = useCallback(() => {
    if (!activePdfUrl) {
      toast.error("No hay un PDF activo para guardar.");
      setFileSelectionModalOpen(false); // Cierra el modal de selección si no hay PDF
      return;
    }
    if (!googleAccessToken) {
      toast.error(
        "No estás autenticado con Google. Por favor, inicia sesión para guardar en Drive."
      );
      setFileSelectionModalOpen(false);
      return;
    }

    const activePdf = pdfs.find((pdf) => pdf.url === activePdfUrl);
    const defaultFileName = activePdf?.name.endsWith(".pdf")
      ? activePdf.name.slice(0, -4)
      : activePdf?.name || "documento";

    setPromptModalConfig({
      title: "Guardar archivo en Google Drive",
      message:
        "Introduce el nombre del archivo para Google Drive (se guardará como .pdf):",
      showInputField: true,
      inputPlaceholder: defaultFileName,
      onConfirm: (fileName) => {
        if (fileName) {
          executeSavePdfToDrive(fileName); // Llama a la lógica de guardado real
          setIsPromptModalOpen(false); // Cierra el modal después de la confirmación
        } else {
          toast.error(
            "Operación de guardar cancelada: Nombre de archivo vacío."
          );
          // No cierres el modal aquí para que el usuario pueda corregir
        }
      },
      iconType: "document",
    });
    setIsPromptModalOpen(true); // Abre el modal de prompt
    // setFileSelectionModalOpen(false); // Podrías cerrar el modal de selección aquí o en onConfirm del prompt
  }, [activePdfUrl, googleAccessToken, pdfs, executeSavePdfToDrive]);

  // CAMBIO: handleActionSelection llama a las funciones que abren el modal
  const handleActionSelection = useCallback(
    (source) => {
      setFileSelectionModalOpen(false); // Cierra el modal de selección antes de abrir el de nombre

      if (currentAction === "upload") {
        if (source === "local") {
          openPdfDialog();
        } else if (source === "drive") {
          openGoogleDrivePicker();
        }
      } else if (currentAction === "download") {
        if (source === "local") {
          handleSavePdfLocal(); // Ahora esta función abre el PromptConfirmModal
        } else if (source === "drive") {
          savePdfToDrive(); // Ahora esta función abre el PromptConfirmModal
        }
      }
    },
    [
      currentAction,
      openPdfDialog,
      openGoogleDrivePicker,
      handleSavePdfLocal, // Dependencia añadida
      savePdfToDrive, // Dependencia añadida
    ]
  );

  return (
    <div className="w-1/2 bg-white p-4 rounded-2xl shadow-lg flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-medium">Visor de PDF</h2>
        <div className="flex gap-3">
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

          <button
            onClick={() => {
              setCurrentAction("download");
              setFileSelectionModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            disabled={!activePdfUrl}
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
            <button
              onClick={(e) => handleCloseTab(pdf.url, e)}
              className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              &times;
            </button>
          </div>
        ))}
        {pdfs.length === 0 && (
          <div className="px-4 py-2 text-gray-500 text-sm"></div>
        )}
      </div>

      {activePdfUrl ? (
        // Uso de `key` aquí para forzar la recarga del iframe si la URL activa cambia
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

      {/* MODAL PARA SELECCIÓN DE ORIGEN/DESTINO DE ARCHIVOS (Este modal ya estaba bien) */}
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
                    <button
                      onClick={() => handleActionSelection("local")}
                      className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition"
                    >
                      <FolderOpenIcon className="h-6 w-6 text-indigo-600" />
                      <span className="text-lg">Mi dispositivo</span>
                    </button>

                    <button
                      onClick={() => handleActionSelection("drive")}
                      disabled={!googleAccessToken || !areGoogleApisReady}
                      className={`w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-800 transition ${
                        !googleAccessToken || !areGoogleApisReady
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      }`}
                      title={
                        !googleAccessToken
                          ? "Inicia sesión con Google para usar Drive"
                          : !areGoogleApisReady
                          ? "Cargando APIs de Google Drive..."
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

      {/* CAMBIO: Se añade el PromptConfirmModal */}
      <PromptConfirmModal
        isOpen={isPromptModalOpen}
        onClose={() => {
          setIsPromptModalOpen(false);
          // Opcional: Si el modal de selección de origen se cerró, podrías querer reabrirlo aquí
          // o manejar un estado más complejo para el flujo de UX si el usuario cancela en el prompt.
          // Por ahora, solo cerramos este modal.
        }}
        onConfirm={promptModalConfig.onConfirm}
        title={promptModalConfig.title}
        message={promptModalConfig.message}
        showInputField={promptModalConfig.showInputField}
        inputPlaceholder={promptModalConfig.inputPlaceholder}
        iconType={promptModalConfig.iconType}
      />
    </div>
  );
}
