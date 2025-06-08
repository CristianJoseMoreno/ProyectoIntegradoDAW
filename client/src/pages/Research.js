import React, { useState, useEffect, useCallback, useRef } from "react";
import TextEditor from "../components/TextEditor";
import PdfViewer from "../components/PdfViewer";
import axios from "axios";

/**
 * @file Componente principal de la página de Investigación (Research).
 * @description Permite al usuario editar un documento de investigación y gestionar la visualización de PDFs.
 * Implementa carga, guardado automático (autosave) y sincronización de PDFs desde Google Drive.
 */

/**
 * Convierte una cadena de "caracteres binarios" a un ArrayBuffer.
 * Es útil si una API devuelve datos binarios como una cadena.
 * @param {string} str - La cadena a convertir.
 * @returns {ArrayBuffer} Un ArrayBuffer que contiene los datos de la cadena.
 */
const stringToArrayBuffer = (str) => {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};

/**
 * Componente Research.
 * @param {object} props - Propiedades del componente.
 * @param {string | null} props.googleAccessToken - Token de acceso de Google para interactuar con sus APIs.
 * @param {boolean} props.areGoogleApisReady - Indica si las APIs de Google (Drive, Picker) están cargadas y listas.
 * @returns {JSX.Element} El componente de la página de investigación.
 */
export default function Research({ googleAccessToken, areGoogleApisReady }) {
  /**
   * Estado para el contenido del documento principal (editor de texto).
   * @type {string}
   */
  const [doc, setDoc] = useState("");

  /**
   * Estado para la lista de PDFs abiertos en el visor. Cada PDF es un objeto { url, name, googleDriveFileId }.
   * @type {Array<object>}
   */
  const [pdfs, setPdfs] = useState([]);

  /**
   * Estado para la URL del PDF actualmente activo/visible en el visor.
   * @type {string}
   */
  const [activePdfUrl, setActivePdfUrl] = useState("");

  /**
   * Estado para el ID del documento en la base de datos del backend.
   * @type {string | null}
   */
  const [documentId, setDocumentId] = useState(null);

  /**
   * Estado para controlar el estado de carga inicial del documento.
   * @type {boolean}
   */
  const [loading, setLoading] = useState(true);

  /**
   * Estado para almacenar cualquier error que ocurra durante la carga o guardado.
   * @type {string | null}
   */
  const [error, setError] = useState(null);

  /**
   * Referencia para el temporizador de guardado automático (autosave).
   * @type {React.MutableRefObject<number | null>}
   */
  const autosaveTimerRef = useRef(null);

  /**
   * Retardo de debounce para el guardado automático en milisegundos.
   * @type {number}
   */
  const AUTOSAVE_DEBOUNCE_DELAY = 2000;

  /**
   * Token JWT del usuario obtenido del localStorage.
   * @type {string | null}
   */
  const userToken = localStorage.getItem("token");

  /**
   * Referencia mutable para la lista de PDFs. Se mantiene actualizada con el estado `pdfs`.
   * @type {React.MutableRefObject<Array<object>>}
   */
  const pdfsRef = useRef(pdfs);

  /**
   * Referencia mutable para la URL del PDF activo. Se mantiene actualizada con el estado `activePdfUrl`.
   * @type {React.MutableRefObject<string>}
   */
  const activePdfUrlRef = useRef(activePdfUrl);

  /**
   * Hook de efecto para mantener `pdfsRef.current` sincronizado con el estado `pdfs`.
   */
  useEffect(() => {
    pdfsRef.current = pdfs;
  }, [pdfs]);

  /**
   * Hook de efecto para mantener `activePdfUrlRef.current` sincronizado con el estado `activePdfUrl`.
   */
  useEffect(() => {
    activePdfUrlRef.current = activePdfUrl;
  }, [activePdfUrl]);

  /**
   * Añade un nuevo PDF a la lista de PDFs abiertos.
   * Si el PDF ya existe (por URL o por Google Drive File ID), lo activa en lugar de añadirlo de nuevo.
   * @param {object} pdfInfo - Información del PDF.
   * @param {string} pdfInfo.url - La URL del objeto del PDF.
   * @param {string} pdfInfo.name - El nombre del PDF.
   * @param {string} [pdfInfo.googleDriveFileId=null] - El ID del archivo de Google Drive si proviene de allí.
   * @returns {void}
   */
  const addPdf = useCallback(({ url, name, googleDriveFileId = null }) => {
    setPdfs((prevPdfs) => {
      const isAlreadyAdded = googleDriveFileId
        ? prevPdfs.some((pdf) => pdf.googleDriveFileId === googleDriveFileId)
        : prevPdfs.some((pdf) => pdf.url === url);

      if (isAlreadyAdded) {
        if (activePdfUrlRef.current !== url) {
          setActivePdfUrl(url);
        }
        return prevPdfs;
      }

      const newPdf = { url, name, googleDriveFileId };
      const updatedPdfs = [...prevPdfs, newPdf];

      if (!activePdfUrlRef.current || updatedPdfs.length === 1) {
        setActivePdfUrl(url);
      }
      return updatedPdfs;
    });
  }, []);

  /**
   * Elimina un PDF de la lista de PDFs abiertos.
   * Si el PDF eliminado era el activo, establece el siguiente PDF como activo (o ninguno si no quedan).
   * Revoca la URL del objeto para liberar recursos.
   * @param {string} urlToRemove - La URL del PDF a eliminar.
   * @returns {void}
   */
  const removePdf = useCallback((urlToRemove) => {
    setPdfs((prevPdfs) => {
      const updatedPdfs = prevPdfs.filter((pdf) => pdf.url !== urlToRemove);
      if (activePdfUrlRef.current === urlToRemove) {
        setActivePdfUrl(updatedPdfs.length > 0 ? updatedPdfs[0].url : "");
      }
      URL.revokeObjectURL(urlToRemove);
      return updatedPdfs;
    });
  }, []);

  /**
   * Descarga un archivo PDF de Google Drive y lo añade al estado de PDFs.
   * @param {string} fileId - El ID del archivo de Google Drive a descargar.
   * @param {string} fileName - El nombre a asignar al PDF.
   * @returns {Promise<object | null>} Un objeto con { url, name, googleDriveFileId } del PDF añadido, o null si falla.
   */
  const downloadPdfFromDriveAndAddToState = useCallback(
    async (fileId, fileName) => {
      if (!areGoogleApisReady || !googleAccessToken) {
        return null;
      }

      try {
        const response = await window.gapi.client.drive.files.get(
          {
            fileId: fileId,
            alt: "media",
          },
          {
            responseType: "arraybuffer",
          }
        );

        if (response.status === 200) {
          let pdfData = response.body || response.result;

          if (typeof pdfData === "string") {
            pdfData = stringToArrayBuffer(pdfData);
          }

          if (!(pdfData instanceof ArrayBuffer)) {
            throw new Error(
              "El contenido del PDF no es un ArrayBuffer válido."
            );
          }

          const fileBlob = new Blob([pdfData], { type: "application/pdf" });
          const fileUrl = URL.createObjectURL(fileBlob);

          addPdf({ url: fileUrl, name: fileName, googleDriveFileId: fileId });
          return { url: fileUrl, name: fileName, googleDriveFileId: fileId };
        } else {
          const errorBody =
            typeof response.body === "string"
              ? JSON.parse(response.body)
              : response.body;
          throw new Error(
            `Error HTTP al descargar PDF de Drive: ${response.status} - ${
              errorBody?.error?.message ||
              response.statusText ||
              "Error desconocido"
            }`
          );
        }
      } catch (error) {
        console.error(
          `Error al descargar PDF de Google Drive (ID: ${fileId}):`,
          error
        );
        return null;
      }
    },
    [googleAccessToken, areGoogleApisReady, addPdf]
  );

  /**
   * Hook de efecto para cargar el documento y los PDFs guardados desde el backend.
   * Se ejecuta al montar el componente y cuando `userToken` o `areGoogleApisReady` cambian.
   * Gestiona la carga de PDFs de Drive con reintentos si las APIs no están listas.
   */
  useEffect(() => {
    let isMounted = true;

    const fetchDocument = async () => {
      if (!userToken) {
        if (isMounted) {
          setLoading(false);
          setError("No user token provided. Cannot fetch document.");
        }
        return;
      }

      try {
        const response = await axios.get("/api/documents", {
          headers: { Authorization: `Bearer ${userToken}` },
        });

        if (!isMounted) return;

        if (response.data) {
          const { _id, content, openPdfIds } = response.data;
          setDocumentId(_id);
          setDoc(content || "");

          if (openPdfIds && openPdfIds.length > 0) {
            const loadDrivePdfsWithRetry = async () => {
              if (!isMounted) return;
              if (areGoogleApisReady) {
                setPdfs([]);

                const pdfPromises = openPdfIds.map(async (pdfInfo) => {
                  let fileId = pdfInfo;
                  let fileName = "PDF de Drive";
                  if (
                    typeof pdfInfo === "object" &&
                    pdfInfo.fileId &&
                    pdfInfo.name
                  ) {
                    fileId = pdfInfo.fileId;
                    fileName = pdfInfo.name;
                  }
                  return await downloadPdfFromDriveAndAddToState(
                    fileId,
                    fileName
                  );
                });
                await Promise.all(pdfPromises);
              } else {
                setTimeout(loadDrivePdfsWithRetry, 500);
              }
            };
            loadDrivePdfsWithRetry();
          } else {
            setPdfs([]);
          }
        } else {
          setDocumentId(null);
          setDoc("");
          setPdfs([]);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error al cargar el documento:", err);
        setError("Error al cargar el documento. Por favor, intenta de nuevo.");
        setDocumentId(null);
        setDoc("");
        setPdfs([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDocument();

    return () => {
      isMounted = false;
    };
  }, [userToken, areGoogleApisReady, downloadPdfFromDriveAndAddToState]);

  /**
   * Hook de efecto para implementar el guardado automático (autosave) del documento y los PDFs.
   * Guarda el contenido del editor y los IDs de los PDFs abiertos en Google Drive en el backend
   * después de un retraso definido (`AUTOSAVE_DEBOUNCE_DELAY`) desde la última modificación.
   */
  useEffect(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    if (
      !userToken ||
      loading ||
      (doc === "" && pdfs.length === 0 && documentId === null)
    ) {
      return;
    }

    autosaveTimerRef.current = setTimeout(async () => {
      try {
        const dataToSave = {
          content: doc,
          openPdfIds: pdfsRef.current
            .filter((pdf) => pdf.googleDriveFileId)
            .map((pdf) => ({ fileId: pdf.googleDriveFileId, name: pdf.name })),
        };

        const response = await axios.post("/api/documents", dataToSave, {
          headers: { Authorization: `Bearer ${userToken}` },
        });

        setDocumentId(response.data.document._id);
      } catch (err) {
        console.error("Error al guardar el documento:", err);
      }
    }, AUTOSAVE_DEBOUNCE_DELAY);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [doc, pdfs, userToken, loading, documentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Cargando documento...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-semibold mb-4">Editor de Investigación</h1>
      <div className="flex flex-1 gap-6">
        <TextEditor
          doc={doc}
          setDoc={setDoc}
          googleAccessToken={googleAccessToken}
        />
        <PdfViewer
          pdfs={pdfs}
          activePdfUrl={activePdfUrl}
          setActivePdfUrl={setActivePdfUrl}
          addPdf={addPdf}
          removePdf={removePdf}
          googleAccessToken={googleAccessToken}
          downloadPdfFromDriveAndAddToState={downloadPdfFromDriveAndAddToState}
          areGoogleApisReady={areGoogleApisReady}
        />
      </div>
    </div>
  );
}
