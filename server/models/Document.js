// server/models/Document.js
const mongoose = require("mongoose");

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
    // ¡IMPORTANTE! Array de objetos, no solo strings
    {
      fileId: { type: String, required: true },
      name: { type: String, required: true },
    },
  ],
  lastEdited: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }, // Es buena práctica tener un updatedAt
});

documentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Document", documentSchema);
