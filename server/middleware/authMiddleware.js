const jwt = require("jsonwebtoken");

/**
 * @typedef {object} DecodedToken
 * @property {string} userId - El ID del usuario.
 * @property {string} email - El email del usuario.
 * @property {number} iat - Timestamp de emisión del token.
 * @property {number} exp - Timestamp de expiración del token.
 */

/**
 * Middleware para autenticar un token JWT de aplicación.
 * Verifica la presencia y validez de un token JWT en el encabezado de autorización.
 * Si el token es válido, decodifica el payload y lo adjunta a `req.user` para su uso posterior.
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} res - El objeto de respuesta de Express.
 * @param {Function} next - La función para pasar el control al siguiente middleware.
 * @returns {void} No devuelve nada directamente, sino que llama a `next()` o envía una respuesta de error.
 * @throws {401} Si el encabezado de autorización está ausente, el token no se encuentra o es inválido.
 * @api
 */
const authenticateAppToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

module.exports = authenticateAppToken;
