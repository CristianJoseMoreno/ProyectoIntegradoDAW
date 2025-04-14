// controllers/referencesController.js
const Reference = require("../models/reference"); // Modelo de referencia

// Crear nueva referencia
const createReference = async (req, res) => {
  try {
    const newReference = new Reference(req.body);
    await newReference.save();
    res.status(201).json(newReference);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener todas las referencias
const getReferences = async (req, res) => {
  try {
    const references = await Reference.find();
    res.status(200).json(references);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar una referencia
const updateReference = async (req, res) => {
  try {
    const updatedReference = await Reference.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedReference) {
      return res.status(404).json({ message: "Referencia no encontrada" });
    }
    res.status(200).json(updatedReference);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar una referencia
const deleteReference = async (req, res) => {
  try {
    const deletedReference = await Reference.findByIdAndDelete(req.params.id);
    if (!deletedReference) {
      return res.status(404).json({ message: "Referencia no encontrada" });
    }
    res.status(200).json({ message: "Referencia eliminada con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReference,
  getReferences,
  updateReference,
  deleteReference,
};
