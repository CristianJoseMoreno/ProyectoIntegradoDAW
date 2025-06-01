require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const helmet = require("helmet");
const { OAuth2Client } = require("google-auth-library");

const citationRoutes = require("./routes/citations");

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Agrega este middleware para parsear el JWT de tu app
const authenticateAppToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1]; // Espera "Bearer YOUR_TOKEN"

  if (!token) {
    return res.status(401).json({ success: false, message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Adjunta el payload decodificado al objeto request
    next();
  } catch (error) {
    console.error("Error verifying app token:", error);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

app.use("/api", citationRoutes);

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: [
        "'self'",
        "data:",
        "http://localhost:5000",
        "https://*.googleusercontent.com",
      ], // Añade googleusercontent.com para imágenes de perfil de Google
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://accounts.google.com",
        "https://apis.google.com",
      ], // Añade dominios de Google scripts
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: [
        "'self'",
        "http://localhost:5000",
        "https://accounts.google.com",
        "https://oauth2.googleapis.com",
        "https://www.googleapis.com",
      ], // Añade dominios de Google APIs
      frameSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://docs.google.com",
      ], // Necesario para el picker o popups de login
    },
  })
);

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.error("Error en la conexión a MongoDB", err));

// --- Modelo de Usuario (Simplificado para el ejemplo) ---
// **IMPORTANTE**: Adapta esto a tu esquema de usuario real y a tu lógica de guardado.
const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  name: String,
  picture: String,
  googleRefreshToken: String, // Aquí es donde guardaremos el refresh_token
});

const User = mongoose.model("User", userSchema);
// --- FIN Modelo de Usuario ---

// OAuth2 Google
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage" // Para la comunicación del popup
);

app.post("/api/auth/google", async (req, res) => {
  const { code } = req.body;

  if (!code)
    return res
      .status(400)
      .json({ success: false, message: "No code provided" });

  try {
    const { tokens } = await oauth2Client.getToken(code);
    // oauth2Client.setCredentials(tokens); // No necesitas setear credenciales aquí si solo usas el token

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      // Si el usuario no existe, crearlo
      user = new User({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });
    } else {
      // Si el usuario ya existe, asegúrate de actualizar la picture
      // ya que podría cambiar en Google.
      user.name = payload.name; // También actualiza el nombre por si acaso
      user.picture = payload.picture;
    }

    // *** Guardar el refresh_token si se recibió ***
    // Google solo envía el refresh_token la primera vez que se autoriza 'offline'
    if (tokens.refresh_token) {
      user.googleRefreshToken = tokens.refresh_token;
    }

    await user.save(); // Guarda o actualiza el usuario en la DB

    const jwtToken = jwt.sign(
      {
        userId: user.googleId,
        email: user.email,
        name: user.name,
        picture: payload.picture,
      }, // Payload de tu JWT
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
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

// *** NUEVA RUTA PARA REFRESCAR EL TOKEN DE GOOGLE ***
app.post(
  "/api/google/refresh-token",
  authenticateAppToken,
  async (req, res) => {
    try {
      const userId = req.user.userId; // Obtenido del JWT de tu app

      const user = await User.findOne({ googleId: userId });

      if (!user || !user.googleRefreshToken) {
        return res.status(400).json({
          success: false,
          message: "No Google refresh token found for this user.",
        });
      }

      // Configurar el cliente con el refresh_token del usuario
      oauth2Client.setCredentials({
        refresh_token: user.googleRefreshToken,
      });

      // Obtener un nuevo access_token
      const { credentials } = await oauth2Client.refreshAccessToken();

      res.json({
        success: true,
        googleAccessToken: credentials.access_token,
        // (Opcional) Si la expiración del access_token cambia, puedes devolverla también:
        // googleAccessTokenExpiry: credentials.expiry_date
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

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
