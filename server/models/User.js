const mongoose = require("mongoose");

/**
 * @typedef {object} User
 * @property {string} googleId - El ID único proporcionado por Google para el usuario. Es obligatorio y debe ser único.
 * @property {string} email - El correo electrónico del usuario. Es obligatorio y debe ser único.
 * @property {string} [name] - El nombre completo del usuario.
 * @property {string} [picture] - La URL de la foto de perfil del usuario.
 * @property {string} [googleRefreshToken] - El token de actualización de Google para el usuario, utilizado para obtener nuevos tokens de acceso.
 * @property {Date} [createdAt] - La fecha y hora en que se creó el perfil de usuario. Se establece automáticamente al momento de la creación.
 * @property {string[]} [preferredCitationStyles=['apa']] - Un array de cadenas que representan los estilos de citación preferidos del usuario (por ejemplo, 'apa', 'mla'). Por defecto, se establece en ['apa'].
 */

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: String,
  picture: String,
  googleRefreshToken: String,
  createdAt: { type: Date, default: Date.now },
  preferredCitationStyles: {
    type: [String],
    default: ["apa"],
  },
});

module.exports = mongoose.model("User", userSchema);
