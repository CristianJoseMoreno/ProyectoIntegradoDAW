// routes/referenceRoutes.js
const express = require("express");
const router = express.Router();
const referenceController = require("../controllers/referenceController");
const authenticateAppToken = require("../middleware/authMiddleware"); // Importación correcta del middleware

router.post(
  "/references",
  authenticateAppToken,
  referenceController.createReference
);
router.get(
  "/references",
  authenticateAppToken,
  referenceController.getReferences
);
router.put(
  "/references/:id",
  authenticateAppToken,
  referenceController.updateReference
);
router.delete(
  "/references/:id",
  authenticateAppToken,
  referenceController.deleteReference
);

module.exports = router;
