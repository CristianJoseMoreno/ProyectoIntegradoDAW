const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const referenceRoutes = require("./routes/references");
const authRoutes = require("./routes/auth");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());

// Rutas
app.use("/api/references", referenceRoutes);
app.use("/api/auth", authRoutes);

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error al conectar a MongoDB:", err));

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
