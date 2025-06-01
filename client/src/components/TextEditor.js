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
  console.log("TextEditor googleAccessToken:", googleAccessToken);
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
    const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "documento.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. FUNCIÓN PARA ABRIR EL GOOGLE PICKER PARA TEXTOS (TXT/DOCX)
  const openGoogleDrivePicker = () => {
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

    const view = new window.google.picker.DocsView()
      .setMimeTypes(
        "text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,text/html"
      ) // TXT, DOCX, RTF, HTML
      .setParent("root")
      .setOwnedByMe(true);

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
      alert(
        "El servicio de selección de archivos de Google no está listo. Intenta recargar la página."
      );
      return;
    }
    console.log("API Key:", process.env.REACT_APP_GOOGLE_API_KEY);
    picker.setVisible(true);
  };

  // 2. CALLBACK DEL GOOGLE PICKER PARA TEXTOS
  const pickerCallback = (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0];
      const fileId = doc.id;
      const fileName = doc.name;
      const mimeType = doc.mimeType;
      console.log(
        `Archivo seleccionado: ID=${fileId}, Nombre=${fileName}, Tipo=${mimeType}`
      );
      downloadFileFromDrive(fileId, fileName, mimeType);
    } else if (data.action === window.google.picker.Action.CANCEL) {
      console.log("Selección de archivo de Google Drive cancelada.");
    }
  };

  // 3. FUNCIÓN PARA DESCARGAR EL ARCHIVO DE GOOGLE DRIVE Y CARGARLO EN EL EDITOR
  const downloadFileFromDrive = async (fileId, fileName, mimeType) => {
    try {
      const response = await window.gapi.client.drive.files.get(
        {
          fileId: fileId,
          alt: "media", // Para obtener el contenido del archivo
        },
        {
          responseType: "arraybuffer", // O 'text' si esperas texto plano directamente
        }
      );

      if (response.status === 200) {
        if (
          mimeType === "text/plain" ||
          mimeType === "text/html" ||
          mimeType === "application/rtf"
        ) {
          const textDecoder = new TextDecoder("utf-8");
          setDoc(textDecoder.decode(response.body));
          alert(`Archivo "${fileName}" cargado desde Google Drive.`);
        } else if (
          mimeType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          const arrayBuffer = response.body;
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setDoc(result.value);
          alert(
            `Archivo DOCX "${fileName}" cargado y convertido desde Google Drive.`
          );
        } else {
          alert(
            `Tipo de archivo no soportado para carga desde Drive: ${mimeType}`
          );
        }
      } else {
        throw new Error(
          `Error HTTP: ${response.status} - ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error descargando archivo de Google Drive:", error);
      alert(
        `Error al descargar el archivo de Google Drive: ${error.message}. Asegúrate de tener permisos.`
      );
    }
  };

  // 4. FUNCIÓN PARA SUBIR EL CONTENIDO DEL EDITOR A GOOGLE DRIVE
  const handleSaveToDrive = async () => {
    if (!googleAccessToken) {
      alert("No estás autenticado con Google Drive.");
      return;
    }

    const fileName = prompt(
      "Introduce el nombre del archivo para Google Drive (ej: mi_documento.html):"
    );
    if (!fileName) return;

    let mimeType = "text/html"; // Por defecto, guardamos como HTML
    // Si quieres guardar como DOCX, necesitarías una librería para convertir HTML a DOCX,
    // lo cual es más complejo y generalmente requiere un backend.
    // Por simplicidad, guardaremos el HTML del editor como un archivo HTML.
    if (fileName.toLowerCase().endsWith(".txt")) {
      mimeType = "text/plain";
    } else if (fileName.toLowerCase().endsWith(".docx")) {
      // Opción avanzada: Aquí integrarías la conversión de HTML a DOCX.
      // Si no tienes un backend, esto es muy difícil en el frontend.
      // Por ahora, si el usuario elige .docx, podrías advertirle o guardar como HTML.
      alert(
        "Guardar como .docx requiere una conversión avanzada. Se guardará como HTML por defecto."
      );
      mimeType = "text/html";
    }

    try {
      const response = await window.gapi.client.drive.files.create({
        resource: {
          name: fileName,
          mimeType: mimeType,
          // Puedes especificar una carpeta padre si conoces su ID: parents: ['FOLDER_ID']
        },
        media: {
          mimeType: mimeType,
          body: new Blob([doc], { type: mimeType }), // Crea un Blob del contenido del editor
        },
        fields: "id", // Solo necesitamos el ID del archivo creado
      });

      console.log("Archivo subido a Drive, ID:", response.result.id);
      alert(`Archivo "${fileName}" subido a Google Drive con éxito.`);
    } catch (error) {
      console.error("Error subiendo archivo a Google Drive:", error);
      alert(`Error al subir el archivo a Google Drive: ${error.message}.`);
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
