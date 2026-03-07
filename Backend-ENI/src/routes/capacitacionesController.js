import { InscripcionCapacitacion } from "../database/models/inscripciones_capacitacion.js";
import { Usuario } from "../database/models/usuarios.js";

export const obtenerInscripcionCapacitacionPorIdInterna = (id) => {
  return InscripcionCapacitacion.findByPk(id, {
    include: {
      model: Usuario,
      as: "usuario",
      attributes: ["id", "nombre", "apellido", "email"],
    },
  });
};

// Obtener todas las inscripciones de capacitación
export const obtenerInscripcionesCapacitacion = async (req, res) => {
  try {
    const inscripciones = await InscripcionCapacitacion.findAll({
      include: {
        model: Usuario,
        as: "usuario",
        attributes: ["id", "nombre", "apellido", "email"],
      },
      order: [["id", "ASC"]],
    });

    res.json(inscripciones);
  } catch (error) {
    console.error("Error al obtener inscripciones de capacitación:", error);
    res.status(500).json({
      mensaje: "Error al obtener inscripciones de capacitación",
      error: error.message,
    });
  }
};

// Obtener inscripción de capacitación por ID
export const obtenerInscripcionCapacitacionPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const inscripcion = await obtenerInscripcionCapacitacionPorIdInterna(id);

    if (!inscripcion) {
      return res.status(404).json({
        mensaje: "Inscripción de capacitación no encontrada",
      });
    }

    res.json(inscripcion);
  } catch (error) {
    console.error("Error al obtener inscripción de capacitación:", error);
    res.status(500).json({
      mensaje: "Error al obtener inscripción de capacitación",
      error: error.message,
    });
  }
};

// Obtener inscripciones por usuario
export const obtenerInscripcionesCapacitacionPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const inscripciones = await InscripcionCapacitacion.findAll({
      where: { usuarioId },
      order: [["id", "DESC"]],
    });

    res.json(inscripciones);
  } catch (error) {
    console.error("Error al obtener inscripciones por usuario:", error);
    res.status(500).json({
      mensaje: "Error al obtener inscripciones por usuario",
      error: error.message,
    });
  }
};

// Crear una nueva inscripción de capacitación
export const crearInscripcionCapacitacion = async (req, res) => {
  try {
    const {
      usuarioId,
      denominacion_capacitacion,
      fecha_inicio_cap,
      fecha_fin_cap,
      fecha_diligenciamiento,
      opcion_plan_multiplicacion,
      acta_compromiso,
      fecha_multiplicacion,
      validacion_plan,
      nombre_delegado_seguimiento,
      descripcion_plan,
      link_evidencias,
    } = req.body;

    // Verificar que el usuario exista
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    const nuevaInscripcion = await InscripcionCapacitacion.create({
      usuarioId,
      denominacion_capacitacion,
      fecha_inicio_cap,
      fecha_fin_cap,
      fecha_diligenciamiento,
      opcion_plan_multiplicacion,
      acta_compromiso,
      fecha_multiplicacion,
      validacion_plan,
      nombre_delegado_seguimiento,
      descripcion_plan,
      link_evidencias,
    });

    res.status(201).json({
      mensaje: "Inscripción de capacitación creada exitosamente",
      inscripcion: nuevaInscripcion,
    });
  } catch (error) {
    console.error("Error al crear inscripción de capacitación:", error);
    res.status(500).json({
      mensaje: "Error al crear inscripción de capacitación",
      error: error.message,
    });
  }
};

// Actualizar inscripción de capacitación
export const actualizarInscripcionCapacitacion = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizaciones = req.body;

    const inscripcion = await InscripcionCapacitacion.findByPk(id);
    if (!inscripcion) {
      return res.status(404).json({
        mensaje: "Inscripción de capacitación no encontrada",
      });
    }

    await inscripcion.update(actualizaciones);

    res.json({
      mensaje: "Inscripción de capacitación actualizada exitosamente",
      inscripcion,
    });
  } catch (error) {
    console.error("Error al actualizar inscripción de capacitación:", error);
    res.status(500).json({
      mensaje: "Error al actualizar inscripción de capacitación",
      error: error.message,
    });
  }
};

// Eliminar inscripción de capacitación
export const eliminarInscripcionCapacitacion = async (req, res) => {
  try {
    const { id } = req.params;

    const inscripcion = await InscripcionCapacitacion.findByPk(id);
    if (!inscripcion) {
      return res.status(404).json({
        mensaje: "Inscripción de capacitación no encontrada",
      });
    }

    await inscripcion.destroy();

    res.json({
      mensaje: "Inscripción de capacitación eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar inscripción de capacitación:", error);
    res.status(500).json({
      mensaje: "Error al eliminar inscripción de capacitación",
      error: error.message,
    });
  }
};
