const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ message: "Acceso denegado. No hay token." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // El usuario decodificado queda disponible en req.user
    next();
  } catch (err) {
    res.status(400).json({ message: "Token inválido." });
  }
};

module.exports = verifyToken;
