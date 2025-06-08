require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const helmet = require("helmet");
const { OAuth2Client } = require("google-auth-library");

const authenticateAppToken = require("./middleware/authMiddleware");
const citationRoutes = require("./routes/citations");
const documentRoutes = require("./routes/documentRoutes");
const referenceRoutes = require("./routes/referenceRoutes");

const User = require("./models/User");

const app = express();

/**
 * @namespace GlobalMiddlewares
 * @description Middleware globales para configuración de CORS, parseo de JSON y seguridad (Helmet).
 */

/**
 * Configuración de CORS para permitir solicitudes desde el frontend.
 * @memberof GlobalMiddlewares
 * @function
 */
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

/**
 * Middleware para parsear cuerpos de solicitud JSON.
 * @memberof GlobalMiddlewares
 * @function
 */
app.use(express.json());

/**
 * Configuración de seguridad HTTP con Helmet, incluyendo una Política de Seguridad de Contenido (CSP).
 * @memberof GlobalMiddlewares
 * @function
 */
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: [
        "'self'",
        "data:",
        "http://localhost:5000",
        "https://*.googleusercontent.com",
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://accounts.google.com",
        "https://apis.google.com",
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: [
        "'self'",
        "http://localhost:5000",
        "https://accounts.google.com",
        "https://oauth2.googleapis.com",
        "https://www.googleapis.com",
      ],
      frameSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://docs.google.com",
      ],
    },
  })
);

/**
 * @namespace DatabaseConnection
 * @description Configuración y conexión a la base de datos MongoDB.
 */

/**
 * Establece la conexión a MongoDB utilizando la URI proporcionada en las variables de entorno.
 * @memberof DatabaseConnection
 * @function
 */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.error("Error en la conexión a MongoDB", err));

/**
 * @namespace GoogleOAuth2
 * @description Cliente de OAuth2 de Google para la autenticación de usuarios.
 */

/**
 * Instancia del cliente OAuth2 de Google.
 * @memberof GoogleOAuth2
 * @type {OAuth2Client}
 */
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage"
);

/**
 * @namespace AuthenticationRoutes
 * @description Rutas relacionadas con la autenticación de usuarios, principalmente a través de Google.
 */

/**
 * Maneja la autenticación de usuarios a través de Google OAuth.
 * Recibe un código de autorización, lo intercambia por tokens de Google,
 * verifica la identidad del usuario y genera un JWT para la sesión de la aplicación.
 * Crea un nuevo usuario o actualiza uno existente en la base de datos.
 * @route POST /api/auth/google
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} req.body - El cuerpo de la solicitud.
 * @param {string} req.body.code - El código de autorización de Google.
 * @returns {object} 200 - Un objeto con `success`, el JWT de la aplicación y el `googleAccessToken`.
 * @returns {object} 400 - Si no se proporciona el código de autorización.
 * @returns {object} 401 - Si hay un error en la autenticación de Google.
 * @api
 */
app.post("/api/auth/google", async (req, res) => {
  const { code } = req.body;

  if (!code)
    return res
      .status(400)
      .json({ success: false, message: "No code provided" });

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      user = new User({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });
    } else {
      user.name = payload.name;
      user.picture = payload.picture;
    }

    if (tokens.refresh_token) {
      user.googleRefreshToken = tokens.refresh_token;
    }

    await user.save();

    const jwtToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name,
        picture: payload.picture,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      token: jwtToken,
      googleAccessToken: tokens.access_token,
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Error en la autenticación de Google.",
    });
  }
});

/**
 * Refresca el token de acceso de Google utilizando el token de actualización almacenado.
 * Requiere autenticación con el JWT de la aplicación.
 * @route POST /api/google/refresh-token
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} req.user - Objeto de usuario inyectado por el middleware de autenticación, conteniendo `userId` (el `_id` de MongoDB del usuario).
 * @returns {object} 200 - Un objeto con `success` y el nuevo `googleAccessToken`.
 * @returns {object} 400 - Si no se encuentra un token de actualización de Google para el usuario.
 * @returns {object} 401 - Si no hay autenticación o el token de la aplicación es inválido.
 * @returns {object} 500 - Si ocurre un error al refrescar el token de Google.
 * @api
 */
app.post(
  "/api/google/refresh-token",
  authenticateAppToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const user = await User.findById(userId);

      if (!user || !user.googleRefreshToken) {
        return res.status(400).json({
          success: false,
          message: "No Google refresh token found for this user.",
        });
      }

      oauth2Client.setCredentials({
        refresh_token: user.googleRefreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();

      res.json({
        success: true,
        googleAccessToken: credentials.access_token,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al refrescar token de Google.",
      });
    }
  }
);

/**
 * @namespace ApplicationRoutes
 * @description Rutas principales de la aplicación, que incluyen funcionalidades de citaciones, documentos y referencias.
 */

/**
 * Monta las rutas de citaciones. Estas rutas no requieren autenticación.
 * @memberof ApplicationRoutes
 * @function
 */
app.use("/api", citationRoutes);

/**
 * Monta las rutas de documentos. Estas rutas tienen su propio middleware de autenticación.
 * @memberof ApplicationRoutes
 * @function
 */
app.use("/api", documentRoutes);

/**
 * Monta las rutas de referencias. Estas rutas tienen su propio middleware de autenticación.
 * @memberof ApplicationRoutes
 * @function
 */
app.use("/api", referenceRoutes);

/**
 * Obtiene el perfil del usuario autenticado.
 * Requiere autenticación con el JWT de la aplicación.
 * Excluye `googleRefreshToken` y `__v` de la respuesta.
 * @route GET /api/users/me
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} req.user - Objeto de usuario inyectado por el middleware de autenticación, conteniendo `userId`.
 * @returns {object} 200 - El objeto de usuario sin información sensible.
 * @returns {object} 401 - Si no hay autenticación o el token es inválido.
 * @returns {object} 404 - Si el usuario no es encontrado.
 * @returns {object} 500 - Si ocurre un error interno del servidor.
 * @api
 */
app.get("/api/users/me", authenticateAppToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-googleRefreshToken -__v"
    );

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }
    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener el perfil del usuario." });
  }
});

/**
 * Actualiza el perfil y las preferencias de citación del usuario autenticado.
 * Permite actualizar el nombre y los estilos de citación preferidos.
 * Requiere autenticación con el JWT de la aplicación.
 * @route PUT /api/users/me
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} req.user - Objeto de usuario inyectado por el middleware de autenticación, conteniendo `userId`.
 * @param {object} req.body - El cuerpo de la solicitud con los campos a actualizar.
 * @param {string} [req.body.name] - El nuevo nombre del usuario.
 * @param {string[]} [req.body.preferredCitationStyles] - Un array de cadenas con los nuevos estilos de citación preferidos.
 * @returns {object} 200 - Mensaje de éxito y el usuario actualizado.
 * @returns {object} 401 - Si no hay autenticación o el token es inválido.
 * @returns {object} 404 - Si el usuario no es encontrado.
 * @returns {object} 500 - Si ocurre un error interno del servidor.
 * @api
 */
app.put("/api/users/me", authenticateAppToken, async (req, res) => {
  try {
    const { name, preferredCitationStyles } = req.body;
    const userId = req.user.userId;

    const updateFields = {};
    if (name) updateFields.name = name;
    if (preferredCitationStyles && Array.isArray(preferredCitationStyles)) {
      updateFields.preferredCitationStyles = preferredCitationStyles;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-googleRefreshToken -__v");

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.status(200).json({
      message: "Perfil y preferencias actualizadas con éxito.",
      user: updatedUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al actualizar el perfil del usuario." });
  }
});

/**
 * @namespace ServerInitialization
 * @description Configuración del puerto y el inicio del servidor.
 */

/**
 * Puerto en el que el servidor Express escuchará las solicitudes.
 * Utiliza el puerto definido en las variables de entorno (`process.env.PORT`) o el puerto 5000 por defecto.
 * @memberof ServerInitialization
 * @type {number}
 */
const PORT = process.env.PORT || 5000;

/**
 * Inicia el servidor Express y lo pone a escuchar en el puerto especificado.
 * @memberof ServerInitialization
 * @function
 */
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
