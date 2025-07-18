const Reference = require("../models/Reference");

/**
 * @typedef {object} ReferenceData
 * @property {object} citationData - Objeto con los datos crudos de la citación.
 * @property {string} formattedString - La cadena de citación formateada (por ejemplo, en formato APA, MLA).
 * @property {string} [url] - La URL asociada a la referencia, si existe.
 * @property {string} [notes] - Notas adicionales para la referencia, si existen.
 */

/**
 * Crea una nueva referencia para un usuario.
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} req.user - Objeto de usuario inyectado por el middleware de autenticación.
 * @param {string} req.user.userId - El ID de MongoDB del usuario autenticado.
 * @param {ReferenceData} req.body - El cuerpo de la solicitud que contiene los datos de la referencia.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {Promise<void>} Una promesa que resuelve con la nueva referencia creada, o rechaza si ocurre un error.
 * @api
 */
exports.createReference = async (req, res) => {
  try {
    const { citationData, formattedString, url, notes } = req.body;
    const userId = req.user.userId;

    const newReference = new Reference({
      userId,
      citationData,
      formattedString,
      url,
      notes,
    });

    await newReference.save();
    res.status(201).json({
      message: "Referencia creada con éxito",
      reference: newReference,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error interno del servidor al crear la referencia",
      error: error.message,
    });
  }
};

/**
 * Obtiene todas las referencias asociadas a un usuario.
 * Las referencias se devuelven ordenadas por fecha de creación descendente.
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} req.user - Objeto de usuario inyectado por el middleware de autenticación.
 * @param {string} req.user.userId - El ID de MongoDB del usuario autenticado.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {Promise<void>} Una promesa que resuelve con un array de referencias, o rechaza si ocurre un error.
 * @api
 */
exports.getReferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const references = await Reference.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(references);
  } catch (error) {
    res.status(500).json({
      message: "Error interno del servidor al obtener las referencias",
      error: error.message,
    });
  }
};

/**
 * Actualiza una referencia existente para un usuario.
 * La actualización solo se realiza si el usuario autenticado es el propietario de la referencia.
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} req.params - Los parámetros de la ruta.
 * @param {string} req.params.id - El ID de MongoDB de la referencia a actualizar.
 * @param {object} req.user - Objeto de usuario inyectado por el middleware de autenticación.
 * @param {string} req.user.userId - El ID de MongoDB del usuario autenticado.
 * @param {ReferenceData} req.body - El cuerpo de la solicitud con los datos actualizados de la referencia.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {Promise<void>} Una promesa que resuelve con la referencia actualizada, o rechaza si no se encuentra o no hay permiso.
 * @api
 */
exports.updateReference = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { citationData, formattedString, url, notes } = req.body;

    const reference = await Reference.findOneAndUpdate(
      { _id: id, userId: userId },
      { citationData, formattedString, url, notes, lastEdited: Date.now() },
      { new: true }
    );

    if (!reference) {
      return res.status(404).json({
        message: "Referencia no encontrada o no tienes permiso para editarla.",
      });
    }

    res
      .status(200)
      .json({ message: "Referencia actualizada con éxito", reference });
  } catch (error) {
    res.status(500).json({
      message: "Error interno del servidor al actualizar la referencia",
      error: error.message,
    });
  }
};

/**
 * Elimina una referencia existente para un usuario.
 * La eliminación solo se realiza si el usuario autenticado es el propietario de la referencia.
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} req.params - Los parámetros de la ruta.
 * @param {string} req.params.id - El ID de MongoDB de la referencia a eliminar.
 * @param {object} req.user - Objeto de usuario inyectado por el middleware de autenticación.
 * @param {string} req.user.userId - El ID de MongoDB del usuario autenticado.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {Promise<void>} Una promesa que resuelve con un mensaje de éxito, o rechaza si no se encuentra o no hay permiso.
 * @api
 */
exports.deleteReference = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const reference = await Reference.findOneAndDelete({
      _id: id,
      userId: userId,
    });

    if (!reference) {
      return res.status(404).json({
        message:
          "Referencia no encontrada o no tienes permiso para eliminarla.",
      });
    }

    res.status(200).json({ message: "Referencia eliminada con éxito" });
  } catch (error) {
    res.status(500).json({
      message: "Error interno del servidor al eliminar la referencia",
      error: error.message,
    });
  }
};
