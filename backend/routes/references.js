// routes/references.js
const express = require("express");
const router = express.Router();
const {
  createReference,
  getReferences,
  updateReference,
  deleteReference,
} = require("../controllers/referencesController");

const verifyToken = require("../middlewares/verifyToken"); // Importamos el middleware

// Ruta protegida: obtener todas las referencias
router.get("/", verifyToken, getReferences);

// Ruta protegida: crear referencia
router.post("/", verifyToken, createReference);

// Ruta protegida: actualizar referencia
router.put("/:id", verifyToken, updateReference);

// Ruta protegida: eliminar referencia
router.delete("/:id", verifyToken, deleteReference);

module.exports = router;
