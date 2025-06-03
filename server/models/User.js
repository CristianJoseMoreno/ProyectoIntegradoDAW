// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true }, // ID único de Google
  email: { type: String, required: true, unique: true },
  name: String,
  picture: String,
  googleRefreshToken: String, // Aquí es donde guardaremos el refresh_token
  createdAt: { type: Date, default: Date.now },
  preferredCitationStyles: {
    type: [String], // Array de strings para guardar los 'value' de los estilos (ej. ['apa', 'mla'])
    default: ["apa"], // Puedes establecer un valor por defecto si quieres que siempre tengan APA
  },
});

module.exports = mongoose.model("User", userSchema);
