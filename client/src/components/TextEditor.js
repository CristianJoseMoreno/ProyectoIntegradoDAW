import React, { useState, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Dialog, Transition } from "@headlessui/react";
import mammoth from "mammoth";
import toast from "react-hot-toast";
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  FolderOpenIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import ReferenceFormModal from "./ReferenceFormModal";
import PromptConfirmModal from "./PromptConfirmModal";

/**
 * @file Componente TextEditor.
 * @description Un editor de texto enriquecido basado en ReactQuill que permite
 * cargar y guardar documentos localmente o en Google Drive, y además,
 * insertar referencias formateadas.
 */

/**
 * Convierte una cadena de "caracteres binarios" a un ArrayBuffer.
 * Se utiliza para procesar el contenido de archivos binarios como DOCX desde Google Drive.
 * @param {string} str - La cadena a convertir.
 * @returns {ArrayBuffer} Un ArrayBuffer que contiene los datos de la cadena.
 */
const stringToBytes = (str) => {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i) & 0xff;
  }
  return bytes.buffer;
};

/**
 * Componente TextEditor.
 * @param {object} props - Propiedades del componente.
 * @param {string} props.doc - El contenido actual del documento en formato HTML.
 * @param {function(string): void} props.setDoc - Función para actualizar el contenido del documento.
 * @param {string | null} props.googleAccessToken - Token de acceso de Google para interactuar con sus APIs (Drive, Picker).
 * @returns {JSX.Element} El componente del editor de texto.
 */
export default function TextEditor({ doc, setDoc, googleAccessToken }) {
  /**
   * Estado para controlar la visibilidad de la modal de selección de origen/destino de archivo (local/Drive).
   * @type {boolean}
   */
  const [fileSelectionModalOpen, setFileSelectionModalOpen] = useState(false);

  /**
   * Estado para indicar la acción actual del usuario (carga 'upload' o descarga 'download').
   * @type {'upload' | 'download' | null}
   */
  const [currentAction, setCurrentAction] = useState(null);

  /**
   * Estado para controlar la visibilidad del modal de creación/inserción de referencias.
   * @type {boolean}
   */
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);

  /**
   * Estado para controlar la visibilidad de la modal de prompt/confirmación (usada para pedir nombres de archivo).
   * @type {boolean}
   */
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  /**
   * Estado para configurar el contenido y comportamiento de la modal de prompt/confirmación.
   * @type {{title: string, message: string, showInputField: boolean, inputPlaceholder: string, onConfirm: function(string): void, iconType: 'document' | 'warning'}}
   */
  const [promptModalConfig, setPromptModalConfig] = useState({
    title: "",
    message: "",
    showInputField: false,
    inputPlaceholder: "",
    onConfirm: () => {},
    iconType: "document",
  });

  /**
   * Referencia al componente ReactQuill para acceder a su instancia subyacente de Quill.
   * Útil para operaciones directas como la inserción de texto en la posición del cursor.
   * @type {React.MutableRefObject<ReactQuill | null>}
   */
  const quillRef = useRef(null);

  /**
   * Referencia al input de tipo 'file' oculto para disparar la selección de archivos locales.
   * @type {React.MutableRefObject<HTMLInputElement | null>}
   */
  const fileInputRef = useRef(null);

  /**
   * Abre el cuadro de diálogo de selección de archivo del sistema operativo.
   * @returns {void}
   */
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  /**
   * Maneja el evento de cambio en el input de archivo, procesando el archivo seleccionado.
   * Soporta la carga de archivos .txt y .docx, convirtiendo DOCX a HTML.
   * @param {React.ChangeEvent<HTMLInputElement>} e - El evento de cambio.
   * @returns {Promise<void>}
   */
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

    e.target.value = null; // Limpiar el input para permitir cargar el mismo archivo de nuevo
    setFileSelectionModalOpen(false);
  };

  /**
   * Configura y abre la modal de prompt para solicitar el nombre de archivo al guardar localmente.
   * @returns {void}
   */
  const requestFileNameLocal = () => {
    setPromptModalConfig({
      title: "Guardar archivo en Mi dispositivo",
      message:
        "Introduce el nombre del archivo (sin extensión). Se guardará como .txt",
      showInputField: true,
      inputPlaceholder: "mi_documento",
      onConfirm: (fileName) => {
        if (fileName) {
          executeSaveLocal(fileName);
          setIsPromptModalOpen(false);
        } else {
          toast.error(
            "Operación de guardar cancelada: Nombre de archivo vacío."
          );
        }
      },
      iconType: "document",
    });
    setIsPromptModalOpen(true);
  };

  /**
   * Ejecuta la lógica para guardar el contenido del editor como un archivo .txt localmente.
   * @param {string} fileName - El nombre base del archivo.
   * @returns {void}
   */
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
    URL.revokeObjectURL(link.href); // Liberar la URL del objeto

    toast.success(
      `Documento "${fileName}.txt" guardado con éxito. En futuras versiones se aceptarán más formatos de guardado.`
    );
  };

  /**
   * Abre el Google Drive Picker para que el usuario seleccione un archivo.
   * @returns {void}
   */
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

  /**
   * Callback que se ejecuta cuando el usuario selecciona un archivo en el Google Drive Picker.
   * Descarga y procesa el archivo seleccionado.
   * @param {object} data - Objeto de datos del picker con la acción y los documentos seleccionados.
   * @returns {Promise<void>}
   */
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

  /**
   * Descarga un archivo desde Google Drive y actualiza el contenido del editor.
   * Maneja diferentes tipos MIME, incluyendo documentos de Google y archivos DOCX.
   * @param {string} fileId - El ID del archivo en Google Drive.
   * @param {string} fileName - El nombre del archivo.
   * @param {string} mimeType - El tipo MIME del archivo.
   * @returns {Promise<void>}
   */
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
        let errorMessage = "Error desconocido al descargar archivo.";
        if (
          response.result &&
          response.result.error &&
          response.result.error.message
        ) {
          errorMessage = response.result.error.message;
        } else if (response.statusText) {
          errorMessage = response.statusText;
        }
        throw new Error(
          `Error HTTP al descargar archivo: ${response.status} - ${errorMessage}`
        );
      }
    } catch (error) {
      if (error.result && error.result.error && error.result.error.message) {
        throw new Error(error.result.error.message);
      } else {
        throw error;
      }
    }
  };

  /**
   * Configura y abre la modal de prompt para solicitar el nombre de archivo al guardar en Google Drive.
   * @returns {void}
   */
  const requestFileNameForDrive = () => {
    setPromptModalConfig({
      title: "Guardar archivo en Google Drive",
      message:
        "Introduce el nombre del archivo para Google Drive (ej: mi_documento). Se guardará como .txt",
      showInputField: true,
      inputPlaceholder: "mi_documento",
      onConfirm: (fileName) => {
        if (fileName) {
          executeSaveToDrive(fileName);
          setIsPromptModalOpen(false);
        } else {
          toast.error(
            "Operación de guardar cancelada: Nombre de archivo vacío."
          );
        }
      },
      iconType: "document",
    });
    setIsPromptModalOpen(true);
  };

  /**
   * Ejecuta la lógica para guardar el contenido del editor como un archivo .txt en Google Drive.
   * @param {string} fileName - El nombre base del archivo.
   * @returns {Promise<void>}
   */
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
      return;
    }

    toast(
      "Actualmente, solo se puede guardar como texto plano (.txt) en Google Drive para asegurar la compatibilidad. " +
        "En futuras versiones, se aceptarán más formatos."
    );

    const mimeType = "text/plain";
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
    }
  };

  /**
   * Decide qué acción ejecutar (cargar/guardar) en función de la fuente seleccionada (local/Drive).
   * @param {'local' | 'drive'} source - La fuente o destino del archivo.
   * @returns {void}
   */
  const handleActionSelection = (source) => {
    setFileSelectionModalOpen(false);

    if (currentAction === "upload") {
      if (source === "local") {
        openFileDialog();
      } else if (source === "drive") {
        openGoogleDrivePicker();
      }
    } else if (currentAction === "download") {
      if (source === "local") {
        requestFileNameLocal();
      } else if (source === "drive") {
        requestFileNameForDrive();
      }
    }
  };

  /**
   * Inserta texto formateado (HTML) en la posición actual del cursor en el editor Quill.
   * Actualiza el estado `doc` después de la inserción.
   * @param {string} formattedHtml - La cadena HTML a insertar.
   * @returns {void}
   */
  const handleInsertFormattedText = (formattedHtml) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const selection = quill.getSelection();
      let index = selection ? selection.index : quill.getLength();

      quill.clipboard.dangerouslyPasteHTML(index, formattedHtml);
      quill.setSelection(index + formattedHtml.length);
      setDoc(quill.root.innerHTML);
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

          <button
            onClick={() => setIsReferenceModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Insertar referencia</span>
          </button>
        </div>
      </div>
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

      <ReferenceFormModal
        isOpen={isReferenceModalOpen}
        onClose={() => setIsReferenceModalOpen(false)}
        onSaveSuccess={() => {}}
        forTextEditor={true}
        onInsertFormattedText={handleInsertFormattedText}
      />

      <PromptConfirmModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
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
