// index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken"); // Necesario para firmar los tokens en la ruta de autenticación
const cors = require("cors");
const helmet = require("helmet");
const { OAuth2Client } = require("google-auth-library");

// Importaciones de módulos
const authenticateAppToken = require("./middleware/authMiddleware"); // Tu middleware de autenticación JWT
const citationRoutes = require("./routes/citations");
const documentRoutes = require("./routes/documentRoutes"); // Importación del router de documentos
const referenceRoutes = require("./routes/referenceRoutes"); // Importación del router de referencias

// Importar modelos
const User = require("./models/User"); // Importa el modelo de usuario

const app = express();

// --- Middleware Globales ---
app.use(
  cors({
    origin: "http://localhost:3000", // Asegúrate de que este sea el origen de tu frontend
    credentials: true,
  })
);
app.use(express.json()); // Para parsear cuerpos de solicitud JSON

// --- Configuración de Seguridad (Helmet) ---
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
        "'unsafe-inline'", // Considera revisar esto si puedes usar hashes/nonces
        "https://accounts.google.com",
        "https://apis.google.com",
      ],
      styleSrc: ["'self'", "'unsafe-inline'"], // Considera revisar esto si puedes usar hashes/nonces
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

// --- Conexión a MongoDB ---
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.error("Error en la conexión a MongoDB", err));

// --- OAuth2 Google Client ---
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage"
);

// --- Rutas de Autenticación (No protegidas por JWT de app inicialmente) ---
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
      // Actualiza la información del usuario si ya existe
      user.name = payload.name;
      user.picture = payload.picture;
    }

    if (tokens.refresh_token) {
      user.googleRefreshToken = tokens.refresh_token;
    }

    await user.save(); // Guarda o actualiza el usuario en la DB

    // Genera tu JWT para la sesión de la aplicación
    const jwtToken = jwt.sign(
      {
        userId: user._id, // ¡Importante! Usamos el _id de MongoDB del usuario
        email: user.email,
        name: user.name,
        picture: payload.picture,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" } // El token expira en 8 horas
    );

    res.json({
      success: true,
      token: jwtToken, // Tu token de sesión de la app
      googleAccessToken: tokens.access_token, // El access_token de Google (de corta duración)
    });
  } catch (err) {
    console.error("Error en /api/auth/google:", err);
    res.status(401).json({
      success: false,
      message: "Error en la autenticación de Google.",
    });
  }
});

// Ruta para refrescar el token de acceso de Google
app.post(
  "/api/google/refresh-token",
  authenticateAppToken, // Protegida por tu JWT de aplicación
  async (req, res) => {
    try {
      const userId = req.user.userId; // Obtenido del JWT de tu app (es el _id de MongoDB)

      // Busca al usuario por su _id de MongoDB
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
      console.error("Error al refrescar token de Google:", error);
      res.status(500).json({
        success: false,
        message: "Error al refrescar token de Google.",
      });
    }
  }
);

// --- Rutas de la Aplicación (Protegidas por JWT de app mediante sus propios routers) ---

// Las rutas de citación no necesitan autenticación si solo formatean
app.use("/api", citationRoutes);

// Las rutas de documentos y referencias tienen su propio middleware de autenticación
// dentro de sus archivos de ruta (documentRoutes.js, referenceRoutes.js)
// Por lo tanto, NO necesitamos aplicar authenticateAppToken aquí de nuevo.
app.use("/api", documentRoutes); // <--- CAMBIO AQUÍ: Quitamos authenticateAppToken
app.use("/api", referenceRoutes); // <--- ASUMO el mismo cambio para referenceRoutes

// Rutas de usuario (perfil, etc.) que sí necesitan autenticación directamente aquí
app.get("/api/users/me", authenticateAppToken, async (req, res) => {
  try {
    // req.user.userId viene del token decodificado por authenticateToken
    const user = await User.findById(req.user.userId).select(
      "-googleRefreshToken -__v"
    ); // No enviar el refresh token ni __v

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error al obtener el perfil del usuario:", error);
    res
      .status(500)
      .json({ message: "Error al obtener el perfil del usuario." });
  }
});

// Ruta para actualizar Perfil y Preferencias del Usuario
app.put("/api/users/me", authenticateAppToken, async (req, res) => {
  try {
    const { name, preferredCitationStyles } = req.body;
    const userId = req.user.userId;

    const updateFields = {};
    if (name) updateFields.name = name;
    if (preferredCitationStyles && Array.isArray(preferredCitationStyles)) {
      // Asegúrate de que los estilos enviados son válidos si quieres validarlos aquí
      updateFields.preferredCitationStyles = preferredCitationStyles;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true } // 'new: true' devuelve el documento actualizado, 'runValidators: true' ejecuta las validaciones del schema
    ).select("-googleRefreshToken -__v");

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.status(200).json({
      message: "Perfil y preferencias actualizadas con éxito.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error al actualizar el perfil del usuario:", error);
    res
      .status(500)
      .json({ message: "Error al actualizar el perfil del usuario." });
  }
});

// --- Puerto de escucha del Servidor ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
