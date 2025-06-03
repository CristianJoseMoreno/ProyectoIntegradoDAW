const mongoose = require("mongoose");

const referenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Si usas el _id de MongoDB del usuario
    ref: "User", // Nombre del modelo de usuario
    required: true,
  },
  // O si tu User._id es el googleId, podrías usar:
  // googleId: { type: String, required: true },

  citationData: {
    type: Object, // Para almacenar el objeto CSL-JSON completo de la citación
    required: true,
  },
  formattedString: {
    type: String, // Para almacenar la citación ya formateada (ej. en HTML)
  },
  url: {
    type: String, // URL del archivo o recurso al que hace referencia
  },
  notes: {
    type: String, // Campo para notas adicionales del usuario sobre la referencia
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
