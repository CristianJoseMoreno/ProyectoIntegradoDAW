const mongoose = require("mongoose");

const referenceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  authors: { type: String, required: true },
  year: { type: Number, required: true },
  publisher: { type: String, required: true },
  type: { type: String, enum: ["book", "article", "thesis"], required: true },
});

const Reference = mongoose.model("reference", referenceSchema);

module.exports = Reference;
