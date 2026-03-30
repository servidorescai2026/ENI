import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ mensaje: "Acceso denegado. Token no proporcionado." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.requiereCambioPassword) {
      const allowedPaths = ["/api/usuarios/cambiar-password"];
      const canAccess = allowedPaths.some((allowedPath) => req.originalUrl.startsWith(allowedPath));

      if (!canAccess) {
        return res.status(403).json({
          mensaje: "Debes cambiar tu contraseña temporal antes de continuar",
          codigo: "PASSWORD_CHANGE_REQUIRED"
        });
      }
    }

    req.usuario = decoded;
    next();
  } catch (error) {
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
  }
};

export default verifyToken;
