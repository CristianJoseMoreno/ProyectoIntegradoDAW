// controllers/documentController.js
const Document = require("../models/Document");
const User = require("../models/User"); // Importa el modelo de User si necesitas acceder a él directamente.
// En este caso, ya lo tienes, lo mantengo.

// Crear o actualizar un documento
exports.saveDocument = async (req, res) => {
  try {
    const { content, openPdfIds, title } = req.body;
    // req.user.userId viene del payload de tu JWT, que ahora es user._id
    const userId = req.user.userId;

    // Busca el documento principal del usuario, o crea uno si no existe
    let document = await Document.findOne({ userId: userId });

    if (document) {
      document.content = content;
      document.openPdfIds = openPdfIds;
      document.title = title || document.title;
      document.lastEdited = Date.now();
    } else {
      document = new Document({
        userId: userId,
        content: content,
        openPdfIds: openPdfIds,
        title: title || "Mi Primer Documento",
      });
    }

    await document.save();
    res.status(200).json({ message: "Documento guardado con éxito", document });
  } catch (error) {
    console.error("Error al guardar el documento:", error);
    res
      .status(500)
      .json({ message: "Error interno del servidor al guardar el documento" });
  }
};

// Obtener el documento de un usuario
exports.getDocument = async (req, res) => {
  try {
    // req.user.userId viene del payload de tu JWT, que ahora es user._id
    const userId = req.user.userId;

    // Busca el documento principal del usuario
    const document = await Document.findOne({ userId: userId });

    if (!document) {
      // Si no hay documento, puedes devolver un estado 200 con null o un objeto vacío
      // en lugar de un 404, para que el frontend sepa que debe crear uno nuevo.
      return res
        .status(200)
        .json({ message: "No document found, create a new one." });
    }

    res.status(200).json(document);
  } catch (error) {
    console.error("Error al obtener el documento:", error);
    res
      .status(500)
      .json({ message: "Error interno del servidor al obtener el documento" });
  }
};
