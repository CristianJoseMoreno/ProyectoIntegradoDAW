import React, { useState, useRef, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Dialog } from "@headlessui/react";
import mammoth from "mammoth"; // Asegúrate de que mammoth esté importado

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
  googleAccessToken,
}) {
  // Función auxiliar para convertir una cadena "binaria" a ArrayBuffer
  const stringToBytes = (str) => {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i) & 0xff; // Asegura que solo se toma el byte bajo
    }
    return bytes.buffer; // Devuelve el ArrayBuffer subyacente
  };
  const fileInputRef = useRef(null);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };
  // *** LÍNEA CORREGIDA: Esta línea fue eliminada de aquí, ya que 'file' no estaba definida en este scope.
  // const ext = file.name.split(".").pop().toLowerCase();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Aquí es donde 'ext' debe definirse, dentro del scope de la función handleFileChange
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
        const result = await mammoth.convertToHtml({ arrayBuffer });
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
    // 1. Obtener el nombre del archivo del usuario
    const fileName = prompt(
      "Introduce el nombre del archivo (sin extensión). Se guardará como .txt"
    );
    if (!fileName) {
      alert("Operación de guardar cancelada.");
      return;
    }

    // 2. Convertir el contenido HTML de ReactQuill a texto plano
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = doc; // Carga el HTML en un div temporal
    const plainTextContent = tempDiv.textContent || tempDiv.innerText || ""; // Extrae solo el texto

    // 3. Crear un Blob con el contenido de texto plano
    const blob = new Blob([plainTextContent], {
      type: "text/plain;charset=utf-8",
    });

    // 4. Crear un enlace de descarga y simular un clic
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.txt`; // Asegura la extensión .txt

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 5. Mostrar la alerta de futuras versiones
    alert(
      `Documento "${fileName}.txt" guardado con éxito. En futuras versiones se aceptarán más formatos de guardado.`
    );
  };

  // 1. FUNCIÓN PARA ABRIR EL GOOGLE PICKER PARA TEXTOS (TXT/DOCX)
  const openGoogleDrivePicker = () => {
    if (!window.gapi || !window.gapi.client || !googleAccessToken) {
      alert(
        "Google Drive API no cargada o no autenticada. Intenta recargar la página."
      );
      return;
    }

    // *** NUEVO ALERT PARA INFORMAR AL USUARIO ***
    alert(
      "Para cargar archivos de Google Drive, el documento debe estar configurado como 'Visible para todos' (enlace)." +
        " En futuras versiones, mejoraremos esta funcionalidad."
    );

    // Define los MIME types permitidos ANTES de usarlos
    const allowedMimeTypes =
      "text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,text/html";

    const view = new window.google.picker.DocsView();

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(googleAccessToken)
      .setDeveloperKey(process.env.REACT_APP_GOOGLE_API_KEY) // Mantengo esta línea ya que la tenías, aunque la comentamos para depuración
      .setAppId(process.env.REACT_APP_GOOGLE_APP_ID)
      .setCallback(pickerCallback)
      .build();

    if (!window.google || !window.google.picker) {
      alert(
        "El servicio de selección de archivos de Google no está listo. Intenta recargar la página."
      );
      return;
    }
    picker.setVisible(true);
  };

  // 2. CALLBACK DEL GOOGLE PICKER PARA TEXTOS
  const pickerCallback = async (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0];
      const fileId = doc.id;
      const fileName = doc.name;
      const mimeType = doc.mimeType;
      try {
        await downloadFileFromDrive(fileId, fileName, mimeType);
        alert(`Archivo "${fileName}" cargado desde Google Drive.`); // Solo si la descarga fue exitosa
      } catch (error) {
        console.error("Error en pickerCallback al descargar archivo:", error);
        // Muestra un mensaje más útil desde el error
        alert(
          `Error al cargar el archivo "${fileName}": ${
            error.message || "Error desconocido"
          }. Asegúrate de tener permisos.`
        );
      }
    } else if (data.action === window.google.picker.Action.CANCEL) {
      // Selección de archivo cancelada.
    }
  };

  // 3. FUNCIÓN PARA DESCARGAR EL ARCHIVO DE GOOGLE DRIVE Y CARGARLO EN EL EDITOR
  const downloadFileFromDrive = async (fileId, fileName, mimeType) => {
    let response;
    let fileContent;

    try {
      // Validación para .doc (Word 97-2003) - la mantendremos si no quieres soportarlos directamente
      if (mimeType === "application/msword") {
        throw new Error(
          "Los archivos .doc (Word 97-2003) no son directamente compatibles. Por favor, conviértelos a .docx o Google Doc."
        );
      }

      // Para archivos nativos de Google (Google Docs, Sheets, Slides)
      if (
        mimeType === "application/vnd.google-apps.document" || // Google Docs
        mimeType === "application/vnd.google-apps.html" || // Google Sites HTML
        mimeType === "application/vnd.google-apps.drawing" // Google Drawing
      ) {
        let exportMimeType = "";
        if (mimeType === "application/vnd.google-apps.document") {
          exportMimeType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; // Exportar como DOCX
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
        mimeType = exportMimeType; // Actualiza el mimeType para que la lógica de carga funcione
      } else {
        // Para archivos no nativos (TXT, DOCX subidos, PDF, etc.) usamos drive.files.get con alt: "media"
        try {
          response = await window.gapi.client.drive.files.get(
            {
              fileId: fileId,
              alt: "media",
            },
            {
              responseType: "arraybuffer", // Esto es crucial para obtener ArrayBuffer
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
        // Lógica unificada para asegurar que fileContent es un ArrayBuffer para mammoth o texto para setDoc

        let processedFileContent = fileContent;

        // Si el contenido es una cadena (posiblemente de exportación de Google Docs)
        if (
          typeof fileContent === "string" &&
          !["text/plain", "text/html", "application/rtf"].includes(mimeType)
        ) {
          // Asumiendo que esta cadena es la representación binaria del archivo
          processedFileContent = stringToBytes(fileContent);
        }

        // Ahora processedFileContent debería ser un ArrayBuffer (o ya lo era)
        // O si es texto plano, no necesita conversión de ArrayBuffer para setDoc directamente

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
            // Esto es si ya es una cadena legible (ej. de drive.files.export de HTML)
            textData = fileContent; // Usar el original fileContent ya que es string legible
          }
          setDoc(textData);
        } else if (
          mimeType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          // Aquí esperamos un ArrayBuffer
          if (!(processedFileContent instanceof ArrayBuffer)) {
            // Si por alguna razón sigue sin ser ArrayBuffer, lanzamos el error
            throw new Error(
              "Contenido de DOCX no es un ArrayBuffer válido después de procesamiento."
            );
          }
          const result = await mammoth.convertToHtml({
            arrayBuffer: processedFileContent, // Usar el ArrayBuffer procesado
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

  // 4. FUNCIÓN PARA SUBIR EL CONTENIDO DEL EDITOR A GOOGLE DRIVE
  const handleSaveToDrive = async () => {
    // Verificación de carga de la API de Google y del token
    if (
      !window.gapi ||
      !window.gapi.client ||
      !window.gapi.client.drive ||
      !googleAccessToken
    ) {
      alert(
        "Las APIs de Google Drive no están cargadas o no estás autenticado."
      );
      return;
    }

    // AVISO CLARO: SOLO SE GUARDARÁ EN TXT POR AHORA
    alert(
      "Actualmente, solo se puede guardar como texto plano (.txt) en Google Drive para asegurar la compatibilidad. " +
        "En futuras versiones, se aceptarán más formatos."
    );

    const fileName = prompt(
      "Introduce el nombre del archivo para Google Drive (ej: mi_documento.txt). Se guardará como texto plano."
    );
    if (!fileName) {
      alert(
        "Nombre de archivo no proporcionado. La operación de guardar ha sido cancelada."
      );
      return;
    }

    let mimeType = "text/plain"; // Forzamos siempre a TXT
    // Convertimos el contenido del editor a texto plano
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = doc;
    const fileContentToSend = tempDiv.textContent || tempDiv.innerText || "";

    // Aseguramos que el nombre de archivo termine en .txt
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
        alert(
          `Archivo "${response.result.name}" (ID: ${response.result.id}, Tipo: ${response.result.mimeType}) subido a Google Drive con éxito.`
        );
      } else {
        console.error("Error inesperado al subir archivo:", response);
        alert(
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
      alert(`Error al subir el archivo a Google Drive: ${errorMessage}.`);
    }
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
          {/* NUEVO BOTÓN PARA CARGAR DESDE GOOGLE DRIVE */}
          <button
            onClick={openGoogleDrivePicker}
            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            disabled={!googleAccessToken}
            title={
              !googleAccessToken
                ? "Inicia sesión con Google para usar Drive"
                : "Cargar archivo desde Google Drive"
            }
          >
            Cargar archivo (Drive)
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Guardar archivo
          </button>
          {/* NUEVO BOTÓN PARA GUARDAR EN GOOGLE DRIVE */}
          <button
            onClick={handleSaveToDrive}
            className="px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
            disabled={!googleAccessToken}
            title={
              !googleAccessToken
                ? "Inicia sesión con Google para usar Drive"
                : "Guardar archivo en Google Drive"
            }
          >
            Guardar archivo (Drive)
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
