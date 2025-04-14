// routes/auth.js
const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
  const { token } = req.body;

  try {
    // Verificamos el token de Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Creamos un JWT interno para proteger tus rutas
    const ourToken = jwt.sign(
      { email, name, picture },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ ourToken }); // Enviamos el token JWT al frontend
  } catch (error) {
    console.error("Error en autenticación:", error);
    res.status(401).json({ error: "Token inválido" });
  }
});

module.exports = router;
