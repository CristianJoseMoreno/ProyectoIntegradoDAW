const mongoose = require("mongoose");

/**
 * @typedef {object} OpenPdfId
 * @property {string} fileId - El ID único del archivo PDF.
 * @property {string} name - El nombre del archivo PDF.
 */

/**
 * @typedef {object} Document
 * @property {mongoose.Schema.Types.ObjectId} userId - El ID del usuario al que pertenece el documento. Referencia al modelo 'User'. Es único y obligatorio.
 * @property {string} [title='Documento sin título'] - El título del documento.
 * @property {string} [content=''] - El contenido principal del documento, por ejemplo, el texto del editor.
 * @property {OpenPdfId[]} [openPdfIds=[]] - Un array de objetos que representan los IDs y nombres de los PDFs abiertos asociados al documento.
 * @property {Date} [lastEdited] - La fecha y hora de la última edición del documento. Se actualiza automáticamente.
 * @property {Date} [createdAt] - La fecha y hora de creación del documento. Se establece automáticamente al crear.
 * @property {Date} [updatedAt] - La fecha y hora de la última actualización del documento. Se actualiza automáticamente en cada guardado.
 */

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  title: { type: String, default: "Documento sin título" },
  content: { type: String, default: "" },
  openPdfIds: [
    {
      fileId: { type: String, required: true },
      name: { type: String, required: true },
    },
  ],
  lastEdited: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

documentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Document", documentSchema);
