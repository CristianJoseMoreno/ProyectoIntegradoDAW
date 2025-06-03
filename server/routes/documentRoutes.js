// routes/documentRoutes.js
const express = require("express");
const router = express.Router();
const documentController = require("../controllers/documentController");
const authenticateAppToken = require("../middleware/authMiddleware"); // Importación correcta del middleware

router.post(
  "/documents",
  authenticateAppToken,
  documentController.saveDocument
); // Para crear/actualizar
router.get("/documents", authenticateAppToken, documentController.getDocument); // Para obtener el documento del usuario

module.exports = router;
