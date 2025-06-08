const mongoose = require("mongoose");

/**
 * @typedef {object} Reference
 * @property {mongoose.Schema.Types.ObjectId} userId - El ID de MongoDB del usuario al que pertenece la referencia.
 * @property {object} citationData - Objeto que contiene los datos completos de la citación, generalmente en formato CSL-JSON.
 * @property {string} [formattedString] - La representación de cadena formateada de la citación (ej. HTML o texto plano).
 * @property {string} [url] - La URL asociada a la referencia, si aplica.
 * @property {string} [notes] - Notas adicionales que el usuario pueda tener sobre esta referencia.
 * @property {Date} [createdAt] - La fecha y hora de creación de la referencia. Por defecto, se establece al momento de la creación.
 * @property {Date} [lastEdited] - La fecha y hora de la última edición de la referencia. Por defecto, se establece al momento de la creación y se puede actualizar manualmente.
 */

const referenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  citationData: {
    type: Object,
    required: true,
  },
  formattedString: {
    type: String,
  },
  url: {
    type: String,
  },
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastEdited: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Reference", referenceSchema);
