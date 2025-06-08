const express = require("express");
const fs = require("fs");
const path = require("path");
require("@citation-js/plugin-csl");
const Cite = require("citation-js");

const router = express.Router();

/**
 * @typedef {object} CitationStyle
 * @property {string} label - El nombre legible del estilo de citación.
 * @property {string} value - El identificador del estilo de citación (nombre del archivo CSL sin extensión).
 */

/**
 * Obtiene una lista de los estilos de citación CSL disponibles en el servidor.
 * @route GET /api/citation/styles
 * @returns {object} 200 - Un objeto que contiene un array de estilos de citación disponibles.
 * @returns {object} 500 - Si ocurre un error al leer los estilos.
 * @property {CitationStyle[]} styles - Array de objetos de estilos de citación.
 * @api
 */
router.get("/citation/styles", async (req, res) => {
  const stylesDir = path.join(__dirname, "../styles");

  try {
    const files = await fs.promises.readdir(stylesDir);

    const styles = files
      .filter((f) => f.endsWith(".csl"))
      .map((f) => {
        const value = f.replace(".csl", "");
        return {
          label: value,
          value: value,
        };
      });

    return res.json({ styles });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "No se pudieron cargar los estilos." });
  }
});

/**
 * Formatea metadatos de citación según un estilo CSL especificado.
 * @route POST /api/citation/format
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} req.body - El cuerpo de la solicitud.
 * @param {object} req.body.metadata - Los metadatos de la citación en formato CSL-JSON. Es obligatorio.
 * @param {string} req.body.style - El nombre del estilo CSL a aplicar (ej. 'apa', 'mla'). Es obligatorio.
 * @param {string} [req.body.output='html'] - El formato de salida deseado ('html' o 'text'). Por defecto es 'html'.
 * @returns {object} 200 - Un objeto que contiene la citación formateada (HTML o texto).
 * @returns {object} 400 - Si faltan 'metadata' o 'style', o si el archivo CSL no se encuentra.
 * @returns {object} 500 - Si ocurre un error durante el formateo.
 * @property {string} [citationHtml] - La citación formateada en HTML si `output` es 'html'.
 * @property {string} [citationText] - La citación formateada en texto plano si `output` es 'text'.
 * @api
 */
router.post("/citation/format", (req, res) => {
  try {
    const { metadata, style, output = "html" } = req.body;

    if (!metadata || !style) {
      return res
        .status(400)
        .json({ error: "metadata y style son obligatorios" });
    }

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
    res.status(500).json({ error: "Error al formatear cita" });
  }
});

module.exports = router;
