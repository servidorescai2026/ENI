import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
<<<<<<< HEAD
    return res
      .status(401)
      .json({ mensaje: "Acceso denegado. Token no proporcionado." });
=======
    return res.status(401).json({
      mensaje: "Token no proporcionado",
      codigo: "NO_TOKEN"
    });
>>>>>>> 4c646f78c86c24f773229c8c3fdbbeba13241f67
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
<<<<<<< HEAD
    res.status(403).json({ mensaje: "Token inválido o expirado" });
=======
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        mensaje: "Tu sesión ha expirado",
        codigo: "TOKEN_EXPIRED"
      });
    }

    return res.status(401).json({
      mensaje: "Token inválido",
      codigo: "INVALID_TOKEN"
    });
>>>>>>> 4c646f78c86c24f773229c8c3fdbbeba13241f67
  }
};

export default verifyToken;
<<<<<<< HEAD
=======

>>>>>>> 4c646f78c86c24f773229c8c3fdbbeba13241f67
