// server/controllers/documentController.js
const Document = require("../models/Document"); // Asegúrate de que la ruta al modelo sea correcta

// Crear o actualizar un documento
exports.saveDocument = async (req, res) => {
  const userId = req.user.userId; // Obtenido del JWT por el middleware de autenticación
  const { content, openPdfIds } = req.body; // openPdfIds DEBE ser un array de {fileId, name} desde el frontend
  console.log("Datos recibidos para guardar (Backend):", {
    content,
    openPdfIds,
  }); // LOG DE DEPURACIÓN

  try {
    // findOneAndUpdate con upsert: true es la forma más limpia para crear si no existe o actualizar si sí existe.
    const document = await Document.findOneAndUpdate(
      { userId: userId }, // Criterio de búsqueda: por userId
      {
        content: content,
        openPdfIds: openPdfIds, // Guarda el array de {fileId, name}
        lastEdited: Date.now(),
      },
      {
        new: true, // Devuelve el documento modificado después de la actualización (o el nuevo documento)
        upsert: true, // Crea el documento si no existe si no se encuentra
        setDefaultsOnInsert: true, // Aplica los valores por defecto del esquema si se crea un nuevo documento
      }
    );

    res.status(200).json({ message: "Documento guardado con éxito", document });
  } catch (error) {
    console.error("Error al guardar el documento (Backend):", error);
    res.status(500).json({
      message: "Error interno del servidor al guardar el documento",
      error: error.message,
    });
  }
};

// Obtener el documento de un usuario
exports.getDocument = async (req, res) => {
  try {
    const userId = req.user.userId; // Obtenido del payload de tu JWT

    const document = await Document.findOne({ userId: userId });

    if (!document) {
      // Si no hay documento, devuelve un estado 200 con un objeto vacío
      // para que el frontend sepa que debe inicializar el editor y la lista de PDFs vacíos.
      console.log("No se encontró documento para el usuario (Backend)."); // LOG DE DEPURACIÓN
      return res.status(200).json({ content: "", openPdfIds: [] });
    }

    console.log("Documento recuperado del DB (Backend):", document); // LOG DE DEPURACIÓN
    res.status(200).json(document);
  } catch (error) {
    console.error("Error al obtener el documento (Backend):", error);
    res.status(500).json({
      message: "Error interno del servidor al obtener el documento",
      error: error.message,
    });
  }
};
