const express = require("express");
const router = express.Router();
const documentController = require("../controllers/documentController");
const authenticateAppToken = require("../middleware/authMiddleware");

/**
 * Middleware para aplicar autenticación JWT a todas las rutas de documentos.
 * @middleware
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware.
 * @returns {void}
 */
router.use(authenticateAppToken);

/**
 * Guarda o actualiza el documento de un usuario.
 * Esta ruta maneja tanto la creación inicial como las actualizaciones subsiguientes del documento.
 * Requiere autenticación.
 * @route POST /api/documents
 * @param {object} req.user - Objeto de usuario inyectado por el middleware de autenticación, conteniendo `userId`.
 * @param {string} req.body.content - El contenido del documento (ej. texto del editor).
 * @param {Array<object>} req.body.openPdfIds - Un array de objetos `{fileId, name}` de los PDFs abiertos.
 * @returns {object} 200 - Mensaje de éxito y el documento guardado/actualizado.
 * @returns {object} 401 - Si no hay autenticación o el token es inválido.
 * @returns {object} 500 - Si ocurre un error interno del servidor.
 * @api
 */
router.post("/documents", documentController.saveDocument);

/**
 * Obtiene el documento de un usuario.
 * Si el usuario no tiene un documento, devuelve un objeto vacío (`{ content: "", openPdfIds: [] }`).
 * Requiere autenticación.
 * @route GET /api/documents
 * @param {object} req.user - Objeto de usuario inyectado por el middleware de autenticación, conteniendo `userId`.
 * @returns {object} 200 - El documento del usuario o un objeto vacío si no existe.
 * @returns {object} 401 - Si no hay autenticación o el token es inválido.
 * @returns {object} 500 - Si ocurre un error interno del servidor.
 * @api
 */
router.get("/documents", documentController.getDocument);

module.exports = router;
