const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const referenceRoutes = require("./routes/References");
const authRoutes = require("./routes/Auth");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

// Habilita CORS para permitir peticiones del frontend
app.use(
  cors({
    origin: "http://localhost:3000", // Permite las peticiones desde el frontend
    credentials: true,
  })
);

app.use(express.json());

// Middleware
app.use(bodyParser.json());

// Rutas
app.use("/api/References", referenceRoutes);
app.use("/api/Auth", authRoutes);

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error al conectar a MongoDB:", err));

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
