import verifyToken from "./verifyToken.js";

const verifyAdmin = (req, res, next) => {
  // Primero verificar que el token sea válido
  verifyToken(req, res, (err) => {
    if (err) return; // El middleware verifyToken ya maneja los errores

    // Verificar que el usuario tenga rol de Administrador
    if (req.usuario.rol !== "Administrador") {
      return res.status(403).json({
        error: "Acceso denegado. Se requieren permisos de administrador",
        code: "FORBIDDEN"
      });
    }

    next();
  });
};

export default verifyAdmin;