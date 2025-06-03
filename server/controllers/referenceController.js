const Reference = require("../models/Reference");

// Crear una nueva referencia
exports.createReference = async (req, res) => {
  try {
    const { citationData, formattedString, url, notes } = req.body;
    const userId = req.user.userId; // Obtenido del JWT decodificado (ahora es el _id de MongoDB)

    const newReference = new Reference({
      userId,
      citationData,
      formattedString,
      url,
      notes,
    });

    await newReference.save();
    res
      .status(201)
      .json({
        message: "Referencia creada con éxito",
        reference: newReference,
      });
  } catch (error) {
    console.error("Error al crear referencia:", error);
    res
      .status(500)
      .json({
        message: "Error interno del servidor al crear la referencia",
        error: error.message,
      });
  }
};

// Obtener todas las referencias de un usuario
exports.getReferences = async (req, res) => {
  try {
    const userId = req.user.userId; // Obtenido del JWT decodificado
    const references = await Reference.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(references);
  } catch (error) {
    console.error("Error al obtener referencias:", error);
    res
      .status(500)
      .json({
        message: "Error interno del servidor al obtener las referencias",
        error: error.message,
      });
  }
};

// Actualizar una referencia existente
exports.updateReference = async (req, res) => {
  try {
    const { id } = req.params; // ID de la referencia a actualizar
    const userId = req.user.userId; // Asegurarse de que el usuario sea el dueño de la referencia
    const { citationData, formattedString, url, notes } = req.body;

    const reference = await Reference.findOneAndUpdate(
      { _id: id, userId: userId }, // Busca por ID de referencia y por el userId del dueño
      { citationData, formattedString, url, notes, lastEdited: Date.now() },
      { new: true } // Devuelve el documento actualizado
    );

    if (!reference) {
      return res
        .status(404)
        .json({
          message:
            "Referencia no encontrada o no tienes permiso para editarla.",
        });
    }

    res
      .status(200)
      .json({ message: "Referencia actualizada con éxito", reference });
  } catch (error) {
    console.error("Error al actualizar referencia:", error);
    res
      .status(500)
      .json({
        message: "Error interno del servidor al actualizar la referencia",
        error: error.message,
      });
  }
};

// Eliminar una referencia
exports.deleteReference = async (req, res) => {
  try {
    const { id } = req.params; // ID de la referencia a eliminar
    const userId = req.user.userId; // Asegurarse de que el usuario sea el dueño

    const reference = await Reference.findOneAndDelete({
      _id: id,
      userId: userId,
    });

    if (!reference) {
      return res
        .status(404)
        .json({
          message:
            "Referencia no encontrada o no tienes permiso para eliminarla.",
        });
    }

    res.status(200).json({ message: "Referencia eliminada con éxito" });
  } catch (error) {
    console.error("Error al eliminar referencia:", error);
    res
      .status(500)
      .json({
        message: "Error interno del servidor al eliminar la referencia",
        error: error.message,
      });
  }
};
