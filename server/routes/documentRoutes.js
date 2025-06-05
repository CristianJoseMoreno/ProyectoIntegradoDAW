// server/routes/documentRoutes.js
const express = require("express"); // ¡Necesitas importar Express aquí!
const router = express.Router();
const documentController = require("../controllers/documentController"); // Asegúrate de que la ruta sea correcta
const authenticateAppToken = require("../middleware/authMiddleware"); // Asegúrate de que la ruta sea correcta

// Aplica el middleware de autenticación a todas las rutas definidas en este router.
// Esto es más limpio que aplicarlo en index.js y luego de nuevo aquí.
router.use(authenticateAppToken);

// Rutas para el documento del usuario
router.post("/documents", documentController.saveDocument); // Esta ruta maneja tanto la creación como la actualización
router.get("/documents", documentController.getDocument); // Para obtener el documento del usuario

module.exports = router; // ¡Exporta la instancia del router!
