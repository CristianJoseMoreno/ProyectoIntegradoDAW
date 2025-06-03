const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Referencia al modelo de Usuario
    required: true,
  },
  title: { type: String, default: "Documento sin título" }, // Puedes añadir un título
  content: { type: String, default: "" }, // Contenido HTML/texto de ReactQuill
  openPdfIds: [{ type: String }], // Array de IDs de Google Drive de los PDFs abiertos
  lastEdited: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Document", documentSchema);
