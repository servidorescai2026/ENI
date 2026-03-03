import express from "express";
import { Inscripcion } from "../database/models/inscripciones.js";
import { Curso } from "../database/models/cursos.js";
import { Usuario } from "../database/models/usuarios.js";
import { sequelize } from "../database/config.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// POST /api/inscripciones - Inscribirse a un curso (requiere autenticación)
router.post("/", verifyToken, async (req, res) => {
  try {
    const curso_id = Number(req.body?.curso_id);
    const usuario_id = req.usuario.id;

    // Validaciones
    if (!Number.isInteger(curso_id) || curso_id <= 0) {
      return res.status(400).json({
        error: "ID del curso es requerido y debe ser un número",
        code: "INVALID_COURSE_ID"
      });
    }

    // Verificar que el curso existe
    const curso = await Curso.findByPk(curso_id);
    if (!curso) {
      return res.status(404).json({
        error: "Curso no encontrado",
        code: "COURSE_NOT_FOUND"
      });
    }

    const nuevaInscripcion = await sequelize.transaction(async (transaction) => {
      await sequelize.query(
        "SELECT id FROM usuarios WHERE id = ? FOR UPDATE",
        { replacements: [usuario_id], transaction }
      );

      // 🔒 Validar fecha de cierre de inscripciones
      if (curso.fechaCierreInscripcion) {
        const fechaCierre = new Date(curso.fechaCierreInscripcion);
        const ahora = new Date();
        if (ahora > fechaCierre) {
          const error = new Error("El período de inscripciones para este curso ha cerrado");
          error.code = "ENROLLMENT_CLOSED";
          throw error;
        }
      }

      // 🔒 Validar cupo máximo de personas
      if (curso.maxPersonas && curso.maxPersonas > 0) {
        const inscritosActivos = await Inscripcion.count({
          where: {
            curso_id,
            estado: "activo",
          },
          transaction,
        });

        if (inscritosActivos >= curso.maxPersonas) {
          const error = new Error(`El curso ha alcanzado su cupo máximo (${curso.maxPersonas} personas)`);
          error.code = "COURSE_FULL";
          throw error;
        }
      }

      const inscripcionExistente = await Inscripcion.findOne({
        where: {
          usuario_id,
          curso_id
        },
        transaction,
      });

      const inscripcionActiva = await Inscripcion.findOne({
        where: {
          usuario_id,
          estado: "activo",
        },
        transaction,
      });

      if (inscripcionActiva) {
        const error = new Error("Solo puedes estar inscrito en un curso activo a la vez");
        error.code = "SINGLE_ACTIVE_ENROLLMENT";
        throw error;
      }

      if (inscripcionExistente?.estado === "activo") {
        const error = new Error("Ya estás inscrito en este curso");
        error.code = "ALREADY_ENROLLED";
        throw error;
      }

      if (inscripcionExistente && inscripcionExistente.estado !== "activo") {
        await inscripcionExistente.update(
          {
            estado: "activo",
            fecha_inscripcion: new Date(),
          },
          { transaction }
        );

        return inscripcionExistente;
      }

      return Inscripcion.create(
        {
          usuario_id,
          curso_id,
          estado: "activo",
        },
        { transaction }
      );
    });

    res.status(201).json({
      id: nuevaInscripcion.id,
      usuario_id: nuevaInscripcion.usuario_id,
      curso_id: nuevaInscripcion.curso_id,
      fecha_inscripcion: nuevaInscripcion.fecha_inscripcion,
      estado: nuevaInscripcion.estado
    });

  } catch (error) {
    if (error?.code === "ALREADY_ENROLLED") {
      return res.status(409).json({ error: error.message, code: error.code });
    }

    if (error?.code === "SINGLE_ACTIVE_ENROLLMENT") {
      return res.status(409).json({ error: error.message, code: error.code });
    }

    if (error?.code === "ENROLLMENT_CLOSED") {
      return res.status(409).json({ error: error.message, code: error.code });
    }

    if (error?.code === "COURSE_FULL") {
      return res.status(409).json({ error: error.message, code: error.code });
    }

    console.error("Error al crear inscripción:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      code: "INTERNAL_ERROR"
    });
  }
});

// GET /api/inscripciones/usuario - Obtener inscripciones del usuario autenticado
router.get("/usuario", verifyToken, async (req, res) => {
  try {
    const usuario_id = req.usuario.id;

    const inscripciones = await Inscripcion.findAll({
      where: { usuario_id },
      include: [{
        model: Curso,
        as: 'curso',
        attributes: ['id', 'nombre', 'descripcion', 'duracion', 'categoria', 'nivel']
      }],
      order: [['fecha_inscripcion', 'DESC']],
      attributes: ['id', 'usuario_id', 'curso_id', 'fecha_inscripcion', 'estado']
    });

    // Formatear respuesta
    const resultado = inscripciones.map(inscripcion => ({
      id: inscripcion.id,
      usuario_id: inscripcion.usuario_id,
      curso_id: inscripcion.curso_id,
      fecha_inscripcion: inscripcion.fecha_inscripcion,
      estado: inscripcion.estado,
      curso: inscripcion.curso ? {
        id: inscripcion.curso.id,
        nombre: inscripcion.curso.nombre,
        descripcion: inscripcion.curso.descripcion,
        duracion: inscripcion.curso.duracion,
        categoria: inscripcion.curso.categoria,
        nivel: inscripcion.curso.nivel
      } : null
    }));

    res.json(resultado);

  } catch (error) {
    console.error("Error al obtener inscripciones:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      code: "INTERNAL_ERROR"
    });
  }
});

// PATCH /api/inscripciones/:id/cancelar - Cancelar una inscripción activa del usuario autenticado
router.patch("/:id/cancelar", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.usuario.id;

    const inscripcion = await Inscripcion.findOne({
      where: {
        id,
        usuario_id
      }
    });

    if (!inscripcion) {
      return res.status(404).json({
        error: "Inscripción no encontrada",
        code: "ENROLLMENT_NOT_FOUND"
      });
    }

    if (inscripcion.estado !== "activo") {
      return res.status(409).json({
        error: "Solo puedes cancelar inscripciones activas",
        code: "ENROLLMENT_NOT_ACTIVE"
      });
    }

    await inscripcion.update({ estado: "cancelado" });

    return res.json({
      message: "Inscripción cancelada correctamente",
      id: inscripcion.id,
      estado: inscripcion.estado
    });
  } catch (error) {
    console.error("Error al cancelar inscripción:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      code: "INTERNAL_ERROR"
    });
  }
});

// GET /api/inscripciones/curso/:cursoId - Obtener inscritos activos de un curso (admin)
router.get("/curso/:cursoId", verifyToken, async (req, res) => {
  try {
    const { cursoId } = req.params;

    if (req.usuario.rol !== "Administrador") {
      return res.status(403).json({
        error: "Solo administradores pueden ver los inscritos",
        code: "FORBIDDEN"
      });
    }

    const inscripciones = await Inscripcion.findAll({
      where: {
        curso_id: Number(cursoId),
        estado: "activo"
      },
      include: [{
        model: Usuario,
        as: "usuario",
        attributes: ["id", "nombre", "apellido", "email", "rol", "areaId"]
      }],
      order: [["fecha_inscripcion", "ASC"]],
      attributes: ["id", "usuario_id", "curso_id", "fecha_inscripcion", "estado"]
    });

    const resultado = inscripciones.map(inscripcion => ({
      id: inscripcion.id,
      usuario_id: inscripcion.usuario_id,
      curso_id: inscripcion.curso_id,
      fecha_inscripcion: inscripcion.fecha_inscripcion,
      estado: inscripcion.estado,
      usuario: inscripcion.usuario ? {
        id: inscripcion.usuario.id,
        nombre: inscripcion.usuario.nombre,
        apellido: inscripcion.usuario.apellido,
        email: inscripcion.usuario.email,
        rol: inscripcion.usuario.rol,
        areaId: inscripcion.usuario.areaId
      } : null
    }));

    res.json({
      total: resultado.length,
      inscritos: resultado
    });

  } catch (error) {
    console.error("Error al obtener inscritos:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      code: "INTERNAL_ERROR"
    });
  }
});

export default router;