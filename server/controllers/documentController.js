const Document = require("../models/Document");

/**
 * @typedef {object} OpenPdfId
 * @property {string} fileId - El ID del archivo PDF.
 * @property {string} name - El nombre del archivo PDF.
 */

/**
 * Guarda o actualiza el documento de un usuario, incluyendo el contenido del editor y los IDs de los PDFs abiertos.
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} req.user - Objeto de usuario inyectado por el middleware de autenticación.
 * @param {string} req.user.userId - El ID del usuario autenticado.
 * @param {object} req.body - El cuerpo de la solicitud.
 * @param {string} req.body.content - El contenido del documento (por ejemplo, el texto del editor).
 * @param {OpenPdfId[]} req.body.openPdfIds - Un array de objetos que contienen el ID y el nombre de los PDFs abiertos.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {Promise<void>} Una promesa que resuelve cuando el documento ha sido guardado o actualizado, o rechaza si ocurre un error.
 * @api
 */
exports.saveDocument = async (req, res) => {
  const userId = req.user.userId;
  const { content, openPdfIds } = req.body;

  try {
    const document = await Document.findOneAndUpdate(
      { userId: userId },
      {
        content: content,
        openPdfIds: openPdfIds,
        lastEdited: Date.now(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({ message: "Documento guardado con éxito", document });
  } catch (error) {
    res.status(500).json({
      message: "Error interno del servidor al guardar el documento",
      error: error.message,
    });
  }
};

/**
 * Obtiene el documento de un usuario.
 * Si no se encuentra un documento, devuelve un objeto con `content` vacío y `openPdfIds` vacío.
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} req.user - Objeto de usuario inyectado por el middleware de autenticación.
 * @param {string} req.user.userId - El ID del usuario autenticado.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {Promise<void>} Una promesa que resuelve con el documento del usuario, o rechaza si ocurre un error.
 * @api
 */
exports.getDocument = async (req, res) => {
  try {
    const userId = req.user.userId;

    const document = await Document.findOne({ userId: userId });

    if (!document) {
      return res.status(200).json({ content: "", openPdfIds: [] });
    }

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({
      message: "Error interno del servidor al obtener el documento",
      error: error.message,
    });
  }
};
