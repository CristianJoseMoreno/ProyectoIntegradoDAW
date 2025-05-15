require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const helmet = require("helmet");
const { OAuth2Client } = require("google-auth-library");
const zoteroRoutes = require("./routes/zotero");

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/zotero", zoteroRoutes);

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:5000"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "http://localhost:5000"],
    },
  })
);

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.error("Error en la conexión a MongoDB", err));

// Configura cliente OAuth2 con redirect_uri "postmessage" para intercambio código JS
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage"
);

// Ruta POST para recibir el código de autorización del frontend y obtener tokens de Google
app.post("/api/auth/google", async (req, res) => {
  const { code } = req.body;

  if (!code)
    return res
      .status(400)
      .json({ success: false, message: "No code provided" });

  try {
    // Intercambia código por tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Verifica el id_token obtenido para validar usuario
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Construye objeto user con datos del payload
    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };

    // Crea JWT firmado con clave secreta y expiración
    const jwtToken = jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Responde con token JWT y user info
    res.json({ success: true, token: jwtToken, user });
  } catch (err) {
    console.error("Error validando código de Google OAuth:", err);
    res.status(401).json({ success: false, message: "Código inválido" });
  }
});

// Puerto
app.listen(5000, () => {
  console.log("Servidor corriendo en http://localhost:5000");
});
