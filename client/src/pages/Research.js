// src/pages/Research.js
import React, { useState } from "react"; // Ya no necesitas useEffect para estilos, ni los estados de metadata/modal
import TextEditor from "../components/TextEditor";
import PdfViewer from "../components/PdfViewer";

export default function Research({ googleAccessToken }) {
  const [doc, setDoc] = useState("");
  // Eliminamos los estados relacionados con el modal de referencias
  // const [styles, setStyles] = useState([]);
  // const [selectedStyle, setSelectedStyle] = useState("");
  // const [modalOpen, setModalOpen] = useState(false);
  // const [metadata, setMetadata] = useState({ /* ... */ });

  const [pdfs, setPdfs] = useState([]);
  const [activePdfUrl, setActivePdfUrl] = useState("");

  // Eliminamos el useEffect para cargar estilos, el modal de referencias ahora lo gestiona
  // useEffect(() => { /* ... */ }, []);

  // Eliminamos buildCSL y handleGenerate, ahora están en ReferenceFormModal
  // const buildCSL = () => { /* ... */ };
  // const handleGenerate = async () => { /* ... */ };

  const addPdf = ({ url, name }) => {
    setPdfs((prevPdfs) => {
      if (prevPdfs.some((pdf) => pdf.url === url)) {
        setActivePdfUrl(url);
        return prevPdfs;
      }
      const newPdfs = [...prevPdfs, { url, name }];
      setActivePdfUrl(url);
      return newPdfs;
    });
  };

  const removePdf = (urlToRemove) => {
    setPdfs((prevPdfs) => {
      const updatedPdfs = prevPdfs.filter((pdf) => pdf.url !== urlToRemove);
      if (activePdfUrl === urlToRemove) {
        setActivePdfUrl(updatedPdfs.length > 0 ? updatedPdfs[0].url : "");
      }

      URL.revokeObjectURL(urlToRemove);
      return updatedPdfs;
    });
  };

  return (
    <div className="flex flex-col h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-semibold mb-4">Editor de Investigación</h1>
      <div className="flex flex-1 gap-6">
        <TextEditor
          doc={doc}
          setDoc={setDoc}
          googleAccessToken={googleAccessToken}
          // Ya no pasamos props de referencia al TextEditor
          // modalOpen={modalOpen}
          // setModalOpen={setModalOpen}
          // metadata={metadata}
          // setMetadata={setMetadata}
          // selectedStyle={selectedStyle}
          // setSelectedStyle={setSelectedStyle}
          // styles={styles}
          // handleGenerate={handleGenerate}
        />
        <PdfViewer
          pdfs={pdfs}
          activePdfUrl={activePdfUrl}
          setActivePdfUrl={setActivePdfUrl}
          addPdf={addPdf}
          removePdf={removePdf}
          googleAccessToken={googleAccessToken}
        />
      </div>
    </div>
  );
}
