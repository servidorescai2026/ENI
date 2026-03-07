import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import {
  obtenerInscripcionesCapacitacion,
  obtenerInscripcionCapacitacionPorId,
  obtenerInscripcionCapacitacionPorIdInterna,
  obtenerInscripcionesCapacitacionPorUsuario,
  crearInscripcionCapacitacion,
  actualizarInscripcionCapacitacion,
  eliminarInscripcionCapacitacion,
} from "./capacitacionesController.js";

const router = express.Router();

const canAccessCapacitacion = (req, usuarioId) => {
  return req.usuario?.rol === "Administrador" || Number(req.usuario?.id) === Number(usuarioId);
};

const validarAccesoUsuarioCapacitacion = (req, res, next) => {
  if (!canAccessCapacitacion(req, req.params.usuarioId)) {
    return res.status(403).json({
      mensaje: "No tienes permisos para consultar estas inscripciones",
    });
  }

  next();
};

const validarAccesoInscripcionCapacitacion = async (req, res, next) => {
  try {
    if (req.usuario?.rol === "Administrador") {
      return next();
    }

    const inscripcion = await obtenerInscripcionCapacitacionPorIdInterna(req.params.id);

    if (!inscripcion) {
      return res.status(404).json({
        mensaje: "Inscripción de capacitación no encontrada",
      });
    }

    if (!canAccessCapacitacion(req, inscripcion.usuarioId)) {
      return res.status(403).json({
        mensaje: "No tienes permisos para consultar esta inscripción",
      });
    }

    next();
  } catch (error) {
    console.error("Error validando acceso a inscripción de capacitación:", error);
    return res.status(500).json({
      mensaje: "Error validando permisos",
      error: error.message,
    });
  }
};

// Obtener todas las inscripciones de capacitación (solo admin)
router.get("/", verifyToken, verifyAdmin, obtenerInscripcionesCapacitacion);

// Obtener inscripciones por usuario
router.get("/usuario/:usuarioId", verifyToken, validarAccesoUsuarioCapacitacion, obtenerInscripcionesCapacitacionPorUsuario);

// Obtener inscripción de capacitación por ID
router.get("/:id", verifyToken, validarAccesoInscripcionCapacitacion, obtenerInscripcionCapacitacionPorId);

// Crear nueva inscripción de capacitación (solo admin)
router.post("/", verifyToken, verifyAdmin, crearInscripcionCapacitacion);

// Actualizar inscripción de capacitación (solo admin)
router.put("/:id", verifyToken, verifyAdmin, actualizarInscripcionCapacitacion);

// Eliminar inscripción de capacitación (solo admin)
router.delete("/:id", verifyToken, verifyAdmin, eliminarInscripcionCapacitacion);

export default router;
