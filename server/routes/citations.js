// routes/citations.js
const express = require("express");
const fs = require("fs");
const path = require("path");
require("@citation-js/plugin-csl");
const Cite = require("citation-js");

const router = express.Router();

router.get("/citation/styles", async (req, res) => {
  const stylesDir = path.join(__dirname, "../styles");

  try {
    const files = await fs.promises.readdir(stylesDir);

    const styles = files
      .filter((f) => f.endsWith(".csl"))
      .map((f) => {
        const value = f.replace(".csl", "");
        return {
          label: value, // Puedes mejorar aquí el label si quieres
          value: value,
        };
      });

    return res.json({ styles });
  } catch (error) {
    console.error("Error al leer estilos:", error);
    return res
      .status(500)
      .json({ error: "No se pudieron cargar los estilos." });
  }
});
// POST /api/citation/format
router.post("/citation/format", (req, res) => {
  try {
    const { metadata, style, output = "html" } = req.body;

    if (!metadata || !style) {
      return res
        .status(400)
        .json({ error: "metadata y style son obligatorios" });
    }

    // Usa el style directamente como nombre de archivo sin modificar
    const cslPath = path.join(__dirname, "..", "styles", `${style}.csl`);

    if (!fs.existsSync(cslPath)) {
      return res
        .status(400)
        .json({ error: `Archivo CSL '${style}.csl' no encontrado` });
    }

    const csl = fs.readFileSync(cslPath, "utf8");
    const cite = new Cite([metadata]);

    const formatted = cite.format("bibliography", {
      format: output === "text" ? "text" : "html",
      csl,
      lang: "es-ES",
    });

    const key = output === "text" ? "citationText" : "citationHtml";
    res.json({ [key]: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al formatear cita" });
  }
});

module.exports = router;
