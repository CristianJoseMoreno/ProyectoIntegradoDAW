const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

// Formatea datos en estilo APA básico
const formatCitation = (item) => {
  const { creators, title, date, publicationTitle } = item.data;
  const authors = creators.map((c) => c.lastName || c.name).join(", ");
  return `${authors} (${date}). ${title}. ${publicationTitle || ""}`;
};

// GET /api/zotero/citation/:zoteroId
router.get("/citation/:zoteroId", async (req, res) => {
  const { zoteroId } = req.params;
  try {
    const response = await fetch(`https://api.zotero.org/items/${zoteroId}`);
    if (!response.ok)
      return res.status(404).json({ error: "No encontrado en Zotero" });

    const item = await response.json();
    const citation = formatCitation(item);
    res.json({ citation });
  } catch (error) {
    res.status(500).json({ error: "Error al contactar Zotero" });
  }
});

module.exports = router;
