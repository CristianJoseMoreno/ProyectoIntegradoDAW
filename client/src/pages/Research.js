// src/pages/Research.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import TextEditor from "../components/TextEditor";
import PdfViewer from "../components/PdfViewer";
import axios from "axios";

// --- FUNCIÓN UTILITARIA: Convierte una cadena "binaria" a ArrayBuffer ---
// Esta función es crucial si gapi.client devuelve una cadena en lugar de un ArrayBuffer directo
const stringToArrayBuffer = (str) => {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};

export default function Research({ googleAccessToken, areGoogleApisReady }) {
  const [doc, setDoc] = useState("");
  const [pdfs, setPdfs] = useState([]);
  const [activePdfUrl, setActivePdfUrl] = useState("");
  const [documentId, setDocumentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const autosaveTimerRef = useRef(null);
  const AUTOSAVE_DEBOUNCE_DELAY = 2000;

  const userToken = localStorage.getItem("token");

  const pdfsRef = useRef(pdfs);
  const activePdfUrlRef = useRef(activePdfUrl);

  useEffect(() => {
    pdfsRef.current = pdfs;
  }, [pdfs]);

  useEffect(() => {
    activePdfUrlRef.current = activePdfUrl;
  }, [activePdfUrl]);

  const addPdf = useCallback(({ url, name, googleDriveFileId = null }) => {
    setPdfs((prevPdfs) => {
      if (
        googleDriveFileId &&
        prevPdfs.some((pdf) => pdf.googleDriveFileId === googleDriveFileId)
      ) {
        if (activePdfUrlRef.current !== url) {
          setActivePdfUrl(url);
        }
        return prevPdfs;
      }
      if (!googleDriveFileId && prevPdfs.some((pdf) => pdf.url === url)) {
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

  const downloadPdfFromDriveAndAddToState = useCallback(
    async (fileId, fileName) => {
      console.log(
        "DEBUG (Research): Intentando descargar PDF con ID:",
        fileId,
        "y Nombre:",
        fileName
      );
      if (!areGoogleApisReady || !googleAccessToken) {
        console.warn(
          "DEBUG (Research): Google APIs no listas o Access Token no disponible. No se puede descargar PDF de Drive."
        );
        return null;
      }

      try {
        const response = await window.gapi.client.drive.files.get(
          {
            fileId: fileId,
            alt: "media",
          },
          {
            responseType: "arraybuffer", // Pide un arraybuffer
          }
        );

        if (response.status === 200) {
          let pdfData = response.body || response.result;

          // **AÑADIR ESTA VERIFICACIÓN Y CONVERSIÓN**
          // Si `pdfData` es una cadena (string), convertirla a ArrayBuffer
          if (typeof pdfData === "string") {
            console.log(
              "DEBUG (Research): Convirtiendo cadena a ArrayBuffer para PDF."
            );
            pdfData = stringToArrayBuffer(pdfData); // Usar la función de conversión
          }

          // Asegúrate de que pdfData sea un ArrayBuffer antes de pasarlo a Blob
          if (!(pdfData instanceof ArrayBuffer)) {
            console.error(
              "DEBUG (Research): pdfData no es un ArrayBuffer después de la conversión:",
              pdfData
            );
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
          `Error (Research): Error al descargar PDF de Google Drive (ID: ${fileId}):`,
          error
        );
        return null;
      }
    },
    [googleAccessToken, areGoogleApisReady, addPdf]
  );

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
        const response = await axios.get(
          "http://localhost:5000/api/documents",
          {
            headers: { Authorization: `Bearer ${userToken}` },
          }
        );

        if (!isMounted) return;

        if (response.data) {
          const { _id, content, openPdfIds } = response.data;
          setDocumentId(_id);
          setDoc(content || "");
          console.log("DEBUG (Research): Documento cargado del backend:", {
            _id,
            content,
            openPdfIds,
          });

          if (openPdfIds && openPdfIds.length > 0) {
            const loadDrivePdfsWithRetry = async () => {
              if (!isMounted) return;
              if (areGoogleApisReady) {
                setPdfs([]); // Limpia PDFs al inicio de la carga desde DB

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
                  } else if (typeof pdfInfo !== "string") {
                    console.warn(
                      "DEBUG (Research): Formato de PDF ID inesperado:",
                      pdfInfo
                    );
                    return null;
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
        console.error("Error (Research): Error al cargar el documento:", err);
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
        console.log(
          "DEBUG (Research): Datos enviados para guardar:",
          dataToSave
        );

        const response = await axios.post(
          "http://localhost:5000/api/documents",
          dataToSave,
          {
            headers: { Authorization: `Bearer ${userToken}` },
          }
        );

        setDocumentId(response.data.document._id);
        console.log("Documento guardado/actualizado con éxito.");
      } catch (err) {
        console.error("Error (Research): Error al guardar el documento:", err);
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
          addPdf={addPdf} // Mantén `addPdf` sin el sufijo "ToStateFromViewer" para simplificar
          removePdf={removePdf} // Mantén `removePdf` sin el sufijo "FromState" para simplificar
          googleAccessToken={googleAccessToken}
          downloadPdfFromDriveAndAddToState={downloadPdfFromDriveAndAddToState}
          areGoogleApisReady={areGoogleApisReady}
        />
      </div>
    </div>
  );
}
