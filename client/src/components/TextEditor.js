// src/components/TextEditor.js
import React, { useState, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Dialog, Transition } from "@headlessui/react";
import mammoth from "mammoth";
import toast from "react-hot-toast";

// Importa iconos.
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  FolderOpenIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
} from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/outline";

// Importa el nuevo ReferenceFormModal
import ReferenceFormModal from "./ReferenceFormModal";
// Importa la nueva modal de Prompt/Confirmación
import PromptConfirmModal from "./PromptConfirmModal"; // <-- NUEVA IMPORTACIÓN

export default function TextEditor({ doc, setDoc, googleAccessToken }) {
  // Estado para controlar el modal de selección de archivo (UPLOAD/DOWNLOAD)
  const [fileSelectionModalOpen, setFileSelectionModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null); // 'upload' o 'download'

  // NUEVO ESTADO para controlar la visibilidad del modal de referencias
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);

  // NUEVOS ESTADOS para la modal de PROMPT/CONFIRMACIÓN (para guardar archivos)
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptModalConfig, setPromptModalConfig] = useState({
    title: "",
    message: "",
    showInputField: false,
    inputPlaceholder: "",
    onConfirm: () => {}, // Función a llamar al confirmar
    iconType: "document", // O 'warning'
  });

  // Ref para el editor de texto Quill para la inserción de texto
  const quillRef = useRef(null);

  // Función auxiliar para convertir una cadena "binaria" a ArrayBuffer (mantener la misma lógica que tenías)
  const stringToBytes = (str) => {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i) & 0xff;
    }
    return bytes.buffer;
  };
  const fileInputRef = useRef(null);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setFileSelectionModalOpen(false);
      return;
    }

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "txt") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDoc(event.target.result);
        toast.success(`Archivo "${file.name}" cargado desde Mi dispositivo.`);
      };
      reader.readAsText(file);
    } else if (ext === "docx") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setDoc(result.value);
        toast.success(`Archivo "${file.name}" cargado desde Mi dispositivo.`);
      } catch (err) {
        toast.error("Error leyendo archivo .docx: " + err.message);
      }
    } else {
      toast.error("Solo se permiten archivos .txt y .docx");
    }

    e.target.value = null;
    setFileSelectionModalOpen(false);
  };

  // Función para abrir la modal de prompt para guardar localmente
  const requestFileNameLocal = () => {
    setPromptModalConfig({
      title: "Guardar archivo en Mi dispositivo",
      message:
        "Introduce el nombre del archivo (sin extensión). Se guardará como .txt",
      showInputField: true,
      inputPlaceholder: "mi_documento",
      // La función onConfirm ahora se encarga de llamar a executeSaveLocal Y cerrar la modal
      onConfirm: (fileName) => {
        if (fileName) {
          executeSaveLocal(fileName);
          setIsPromptModalOpen(false); // <-- Cierra la modal aquí
        } else {
          toast.error(
            "Operación de guardar cancelada: Nombre de archivo vacío."
          );
          // NO CERRAR la modal aquí para que el usuario vea el error y pueda corregir
        }
      },
      iconType: "document",
    });
    setIsPromptModalOpen(true);
  };

  // Lógica real para guardar localmente, llamada desde onConfirm de la modal
  const executeSaveLocal = (fileName) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = doc;
    const plainTextContent = tempDiv.textContent || tempDiv.innerText || "";

    const blob = new Blob([plainTextContent], {
      type: "text/plain;charset=utf-8",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(
      `Documento "${fileName}.txt" guardado con éxito. En futuras versiones se aceptarán más formatos de guardado.`
    );
    // Ya no necesitas setFileSelectionModalOpen(false) aquí, la modal se cierra en onConfirm
  };

  const openGoogleDrivePicker = () => {
    if (!window.gapi || !window.gapi.client || !googleAccessToken) {
      toast.error(
        "Google Drive API no cargada o no autenticada. Intenta recargar la página."
      );
      setFileSelectionModalOpen(false);
      return;
    }

    toast(
      "Para cargar archivos de Google Drive, el documento debe estar configurado como 'Visible para todos' (enlace)." +
        " En futuras versiones, mejoraremos esta funcionalidad."
    );

    const view = new window.google.picker.DocsView();

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(googleAccessToken)
      .setDeveloperKey(process.env.REACT_APP_GOOGLE_API_KEY)
      .setAppId(process.env.REACT_APP_GOOGLE_APP_ID)
      .setCallback(pickerCallback)
      .build();

    if (!window.google || !window.google.picker) {
      toast.error(
        "El servicio de selección de archivos de Google no está listo. Intenta recargar la página."
      );
      setFileSelectionModalOpen(false);
      return;
    }
    picker.setVisible(true);
  };

  const pickerCallback = async (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0];
      const fileId = doc.id;
      const fileName = doc.name;
      const mimeType = doc.mimeType;
      try {
        await downloadFileFromDrive(fileId, fileName, mimeType);
        toast.success(`Archivo "${fileName}" cargado desde Google Drive.`);
      } catch (error) {
        console.error("Error en pickerCallback al descargar archivo:", error);
        toast.error(
          `Error al cargar el archivo "${fileName}": ${
            error.message || "Error desconocido"
          }. Asegúrate de tener permisos.`
        );
      } finally {
        setFileSelectionModalOpen(false);
      }
    } else if (data.action === window.google.picker.Action.CANCEL) {
      setFileSelectionModalOpen(false);
    }
  };

  const downloadFileFromDrive = async (fileId, fileName, mimeType) => {
    let response;
    let fileContent;

    try {
      if (mimeType === "application/msword") {
        throw new Error(
          "Los archivos .doc (Word 97-2003) no son directamente compatibles. Por favor, conviértelos a .docx o Google Doc."
        );
      }

      if (
        mimeType === "application/vnd.google-apps.document" ||
        mimeType === "application/vnd.google-apps.html" ||
        mimeType === "application/vnd.google-apps.drawing"
      ) {
        let exportMimeType = "";
        if (mimeType === "application/vnd.google-apps.document") {
          exportMimeType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else if (mimeType === "application/vnd.google-apps.html") {
          exportMimeType = "text/html";
        } else {
          throw new Error(
            `Exportación no soportada para el tipo de documento de Google: ${mimeType}`
          );
        }

        response = await window.gapi.client.drive.files.export(
          {
            fileId: fileId,
            mimeType: exportMimeType,
            alt: "media",
          },
          {}
        );

        fileContent = response.body || response.result;
        mimeType = exportMimeType;
      } else {
        try {
          response = await window.gapi.client.drive.files.get(
            {
              fileId: fileId,
              alt: "media",
            },
            {
              responseType: "arraybuffer",
            }
          );
          fileContent = response.body || response.result;
        } catch (get_error) {
          if (get_error.result && get_error.result.error) {
            throw new Error(
              `Error de Drive API: ${
                get_error.result.error.message || "Desconocido"
              }`
            );
          }
          throw get_error;
        }
      }

      if (response.status === 200) {
        let processedFileContent = fileContent;

        if (
          typeof fileContent === "string" &&
          !["text/plain", "text/html", "application/rtf"].includes(mimeType)
        ) {
          processedFileContent = stringToBytes(fileContent);
        }

        if (
          mimeType === "text/plain" ||
          mimeType === "text/html" ||
          mimeType === "application/rtf"
        ) {
          let textData;
          if (processedFileContent instanceof ArrayBuffer) {
            const textDecoder = new TextDecoder("utf-8");
            textData = textDecoder.decode(processedFileContent);
          } else {
            textData = fileContent;
          }
          setDoc(textData);
        } else if (
          mimeType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          if (!(processedFileContent instanceof ArrayBuffer)) {
            throw new Error(
              "Contenido de DOCX no es un ArrayBuffer válido después de procesamiento."
            );
          }
          const result = await mammoth.convertToHtml({
            arrayBuffer: processedFileContent,
          });

          setDoc(result.value);
        } else {
          throw new Error(`Tipo de archivo no soportado: ${mimeType}`);
        }
      } else {
        // ... (manejo de errores HTTP existente)
      }
    } catch (error) {
      if (error.result && error.result.error && error.result.error.message) {
        throw new Error(error.result.error.message);
      } else {
        throw error;
      }
    }
  };

  // Función para abrir la modal de prompt para guardar en Google Drive
  const requestFileNameForDrive = () => {
    setPromptModalConfig({
      title: "Guardar archivo en Google Drive",
      message:
        "Introduce el nombre del archivo para Google Drive (ej: mi_documento). Se guardará como .txt",
      showInputField: true,
      inputPlaceholder: "mi_documento",
      // La función onConfirm ahora se encarga de llamar a executeSaveToDrive Y cerrar la modal
      onConfirm: (fileName) => {
        if (fileName) {
          executeSaveToDrive(fileName);
          setIsPromptModalOpen(false); // <-- Cierra la modal aquí
        } else {
          toast.error(
            "Operación de guardar cancelada: Nombre de archivo vacío."
          );
          // NO CERRAR la modal aquí para que el usuario vea el error y pueda corregir
        }
      },
      iconType: "document",
    });
    setIsPromptModalOpen(true);
  };

  // Lógica real para guardar en Google Drive, llamada desde onConfirm de la modal
  const executeSaveToDrive = async (fileName) => {
    if (
      !window.gapi ||
      !window.gapi.client ||
      !window.gapi.client.drive ||
      !googleAccessToken
    ) {
      toast.error(
        "Las APIs de Google Drive no están cargadas o no estás autenticado."
      );
      // setFileSelectionModalOpen(false); // Esto ya no es necesario aquí
      return;
    }

    toast(
      "Actualmente, solo se puede guardar como texto plano (.txt) en Google Drive para asegurar la compatibilidad. " +
        "En futuras versiones, se aceptarán más formatos."
    );

    let mimeType = "text/plain";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = doc;
    const fileContentToSend = tempDiv.textContent || tempDiv.innerText || "";

    const finalFileName = fileName.toLowerCase().endsWith(".txt")
      ? fileName
      : `${fileName}.txt`;

    try {
      const response = await window.gapi.client.request({
        path: "https://www.googleapis.com/upload/drive/v3/files",
        method: "POST",
        params: {
          uploadType: "multipart",
        },
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
          "Content-Type": `multipart/related; boundary=foo_bar_baz`,
        },
        body: `--foo_bar_baz\nContent-Type: application/json; charset=UTF-8\n\n${JSON.stringify(
          { name: finalFileName, mimeType: mimeType }
        )}\n\n--foo_bar_baz\nContent-Type: ${mimeType}\n\n${fileContentToSend}\n--foo_bar_baz--`,
      });

      if (response.status === 200) {
        toast.success(
          `Archivo "${response.result.name}" (ID: ${response.result.id}, Tipo: ${response.result.mimeType}) subido a Google Drive con éxito.`
        );
      } else {
        console.error("Error inesperado al subir archivo:", response);
        toast.error(
          `Error al subir el archivo a Google Drive: ${
            response.statusText || "Error desconocido"
          }.`
        );
      }
    } catch (error) {
      console.error("Error subiendo archivo a Google Drive:", error);
      let errorMessage = "Error desconocido al subir el archivo.";
      if (error.result && error.result.error && error.result.error.message) {
        errorMessage = error.result.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(`Error al subir el archivo a Google Drive: ${errorMessage}.`);
    } finally {
      // Ya no necesitas setFileSelectionModalOpen(false) aquí, la modal se cierra en onConfirm
    }
  };

  const handleActionSelection = (source) => {
    setFileSelectionModalOpen(false); // Cierra la modal de selección de acción

    if (currentAction === "upload") {
      if (source === "local") {
        openFileDialog();
      } else if (source === "drive") {
        openGoogleDrivePicker();
      }
    } else if (currentAction === "download") {
      if (source === "local") {
        requestFileNameLocal(); // Llama a la nueva función para pedir el nombre
      } else if (source === "drive") {
        requestFileNameForDrive(); // Llama a la nueva función para pedir el nombre
      }
    }
  };

  // Función para insertar texto formateado en ReactQuill
  // Esta es la función que se pasará a ReferenceFormModal
  const handleInsertFormattedText = (formattedHtml) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const selection = quill.getSelection();
      let index = selection ? selection.index : quill.getLength(); // Insertar en la posición del cursor o al final

      quill.clipboard.dangerouslyPasteHTML(index, formattedHtml);
      quill.setSelection(index + formattedHtml.length); // Mover el cursor al final del texto insertado
      setDoc(quill.root.innerHTML); // Actualizar el estado `doc` con el nuevo contenido HTML
    }
  };

  return (
    <div className="w-1/2 relative bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
      <div className="flex justify-between items-center gap-3 p-4">
        <h2 className="text-lg font-medium">Editor de Texto</h2>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setCurrentAction("upload");
              setFileSelectionModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
            <span>Cargar</span>
          </button>

          <button
            onClick={() => {
              setCurrentAction("download");
              setFileSelectionModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Guardar</span>
          </button>

          {/* Botón para abrir el nuevo modal de referencias */}
          <button
            onClick={() => setIsReferenceModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Insertar referencia</span>
          </button>
        </div>
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
          ref={quillRef}
          value={doc}
          onChange={setDoc}
          theme="snow"
          className="h-full"
        />
      </div>

      {/* MODAL PARA SELECCIÓN DE ORIGEN/DESTINO DE ARCHIVOS */}
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
                      ? "Cargar archivo desde..."
                      : "Guardar archivo en..."}
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

      {/* Nuevo componente ReferenceFormModal */}
      <ReferenceFormModal
        isOpen={isReferenceModalOpen}
        onClose={() => setIsReferenceModalOpen(false)}
        onSaveSuccess={() => {}}
        forTextEditor={true} // Muy importante: indica que es para el editor de texto
        onInsertFormattedText={handleInsertFormattedText} // Callback para insertar el texto
      />

      {/* Nueva Modal de Prompt/Confirmación para guardar */}
      <PromptConfirmModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)} // Aquí cerramos la modal si se pulsa Cancelar o si se llama directamente onCLose
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
