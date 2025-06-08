const express = require("express");
const router = express.Router();
const referenceController = require("../controllers/referenceController");
const authenticateAppToken = require("../middleware/authMiddleware");

/**
 * Crea una nueva referencia para el usuario autenticado.
 * Requiere autenticación.
 * @route POST /api/references
 * @param {object} req.user - Objeto de usuario inyectado por el middleware de autenticación.
 * @param {object} req.body - Datos de la referencia a crear.
 * @returns {object} 201 - Referencia creada con éxito.
 * @returns {object} 401 - Si no hay autenticación o el token es inválido.
 * @returns {object} 500 - Si ocurre un error interno del servidor.
 * @api
 */
router.post(
  "/references",
  authenticateAppToken,
  referenceController.createReference
);

/**
 * Obtiene todas las referencias del usuario autenticado.
 * Requiere autenticación.
 * @route GET /api/references
 * @param {object} req.user - Objeto de usuario inyectado por el middleware de autenticación.
 * @returns {object} 200 - Array de referencias del usuario.
 * @returns {object} 401 - Si no hay autenticación o el token es inválido.
 * @returns {object} 500 - Si ocurre un error interno del servidor.
 * @api
 */
router.get(
  "/references",
  authenticateAppToken,
  referenceController.getReferences
);

/**
 * Actualiza una referencia existente del usuario autenticado.
 * Requiere autenticación.
 * @route PUT /api/references/:id
 * @param {string} id - El ID de la referencia a actualizar.
 * @param {object} req.user - Objeto de usuario inyectado por el middleware de autenticación.
 * @param {object} req.body - Nuevos datos para la referencia.
 * @returns {object} 200 - Referencia actualizada con éxito.
 * @returns {object} 401 - Si no hay autenticación o el token es inválido.
 * @returns {object} 404 - Si la referencia no se encuentra o el usuario no tiene permiso.
 * @returns {object} 500 - Si ocurre un error interno del servidor.
 * @api
 */
router.put(
  "/references/:id",
  authenticateAppToken,
  referenceController.updateReference
);

/**
 * Elimina una referencia existente del usuario autenticado.
 * Requiere autenticación.
 * @route DELETE /api/references/:id
 * @param {string} id - El ID de la referencia a eliminar.
 * @param {object} req.user - Objeto de usuario inyectado por el middleware de autenticación.
 * @returns {object} 200 - Mensaje de éxito al eliminar la referencia.
 * @returns {object} 401 - Si no hay autenticación o el token es inválido.
 * @returns {object} 404 - Si la referencia no se encuentra o el usuario no tiene permiso.
 * @returns {object} 500 - Si ocurre un error interno del servidor.
 * @api
 */
router.delete(
  "/references/:id",
  authenticateAppToken,
  referenceController.deleteReference
);

module.exports = router;
