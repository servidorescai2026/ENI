import express from "express";
import { Curso } from "../database/models/cursos.js";
import { Area } from "../database/models/area.js";
import { Usuario } from "../database/models/usuarios.js";
import { Inscripcion } from "../database/models/inscripciones.js";
import { Notificacion } from "../database/models/notificacion.js";
import { sequelize } from "../database/config.js";
import { QueryTypes, Op } from "sequelize";
import verifyToken from "../middleware/verifyToken.js";
import verifyAdmin from "../middleware/verifyAdmin.js";

const router = express.Router();

// GET /api/cursos - Obtener todos los cursos (sin autenticación requerida)
router.get("/", async (req, res) => {
  try {
    const cursos = await Curso.findAll({
      order: [['created_at', 'DESC']],
      attributes: ['id', 'nombre', 'descripcion', 'duracion', 'categoria', 'nivel', 'areaId', 'usuarioId', 'fechaInicio', 'fechaFin', 'tipoLanzamiento', 'maxPersonas', 'fechaCierreInscripcion', 'created_at', 'updated_at']
    });

    // Agregar conteo de inscritos activos a cada curso
    const cursosConInscritos = await Promise.all(
      cursos.map(async (curso) => {
        const inscritosActivos = await Inscripcion.count({
          where: {
            curso_id: curso.id,
            estado: "activo"
          }
        });

        return {
          ...curso.toJSON(),
          inscritosActivos,
          cuposDisponibles: curso.maxPersonas ? Math.max(0, curso.maxPersonas - inscritosActivos) : null,
          inscripcionesAbiertas: (() => {
            const ahora = new Date();
            const fechaCerrada = curso.fechaCierreInscripcion && new Date(curso.fechaCierreInscripcion) < ahora;
            const cupoLleno = curso.maxPersonas && inscritosActivos >= curso.maxPersonas;
            return !fechaCerrada && !cupoLleno;
          })()
        };
      })
    );

    res.json(cursosConInscritos);
  } catch (error) {
    console.error("Error al obtener cursos:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      code: "INTERNAL_ERROR"
    });
  }
});

// GET /api/cursos/area/:areaId - Obtener cursos por área específica
router.get("/area/:areaId", async (req, res) => {
  try {
    const { areaId } = req.params;

    const cursos = await Curso.findAll({
      where: { areaId: parseInt(areaId) },
      attributes: ['id', 'nombre', 'descripcion', 'duracion', 'categoria', 'nivel', 'areaId', 'usuarioId', 'fechaInicio', 'fechaFin', 'tipoLanzamiento', 'maxPersonas', 'fechaCierreInscripcion', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']]
    });

    // Agregar conteo de inscritos activos a cada curso
    const cursosConInscritos = await Promise.all(
      cursos.map(async (curso) => {
        const inscritosActivos = await Inscripcion.count({
          where: {
            curso_id: curso.id,
            estado: "activo"
          }
        });

        return {
          ...curso.toJSON(),
          inscritosActivos,
          cuposDisponibles: curso.maxPersonas ? Math.max(0, curso.maxPersonas - inscritosActivos) : null,
          inscripcionesAbiertas: (() => {
            const ahora = new Date();
            const fechaCerrada = curso.fechaCierreInscripcion && new Date(curso.fechaCierreInscripcion) < ahora;
            const cupoLleno = curso.maxPersonas && inscritosActivos >= curso.maxPersonas;
            return !fechaCerrada && !cupoLleno;
          })()
        };
      })
    );

    res.json(cursosConInscritos);
  } catch (error) {
    console.error("Error al obtener cursos por área:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      code: "INTERNAL_ERROR"
    });
  }
});

// GET /api/cursos/:id/usuarios - Obtener usuarios vinculados a un curso
router.get("/:id/usuarios", async (req, res) => {
  try {
    const { id } = req.params;

    const usuarios = await sequelize.query(
      `SELECT u.id, u.nombre, u.email, u.areaId
       FROM usuarios u
       INNER JOIN cursos_usuarios cu ON u.id = cu.usuarioId
       WHERE cu.cursoId = ?
       ORDER BY u.nombre ASC`,
      { replacements: [id], type: QueryTypes.SELECT }
    );

    res.json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios del curso:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      code: "INTERNAL_ERROR"
    });
  }
});

// POST /api/cursos - Crear nuevo curso (requiere admin)
router.post("/", verifyAdmin, async (req, res) => {
  try {
    const usuarioId = req.usuario?.id;
    const {
      nombre,
      descripcion,
      duracion,
      categoria,
      nivel,
      areaId,
      areaIds,
      fechaInicio,
      fechaFin,
      tipoLanzamiento,
      maxPersonas,
      fechaCierreInscripcion,
    } = req.body;
    const areaIdNormalizado = Number.isInteger(Number(areaId))
      ? Number(areaId)
      : Array.isArray(areaIds) && areaIds.length > 0
        ? Number(areaIds[0])
        : null;
    const duracionNormalizada = Number(duracion);
    const maxPersonasNormalizado = maxPersonas !== undefined && maxPersonas !== null && maxPersonas !== ""
      ? Number(maxPersonas)
      : null;

    if (!usuarioId) {
      return res.status(401).json({
        error: "Usuario no autenticado",
        code: "UNAUTHORIZED"
      });
    }

    // Validaciones
    if (!nombre || !descripcion || !duracion || !categoria || !nivel || !areaIdNormalizado) {
      return res.status(400).json({
        error: "Todos los campos son requeridos",
        code: "MISSING_FIELDS"
      });
    }

    if (!Number.isFinite(duracionNormalizada) || duracionNormalizada < 1) {
      return res.status(400).json({
        error: "La duración debe ser un número mayor a 0",
        code: "INVALID_DURATION"
      });
    }

    if (nombre.length > 255) {
      return res.status(400).json({
        error: "El nombre no puede exceder 255 caracteres",
        code: "NAME_TOO_LONG"
      });
    }

    const categoriasValidas = ['Programación', 'Idiomas', 'Matemáticas', 'Ciencias', 'Negocios', 'Arte', 'Otro'];
    if (!categoriasValidas.includes(categoria)) {
      return res.status(400).json({
        error: "Categoría inválida",
        code: "INVALID_CATEGORY"
      });
    }

    const nivelesValidos = ['Básico', 'Intermedio', 'Avanzado'];
    if (!nivelesValidos.includes(nivel)) {
      return res.status(400).json({
        error: "Nivel inválido",
        code: "INVALID_LEVEL"
      });
    }

    const tiposLanzamientoValidos = ['fecha', 'cantidad', 'ambos'];
    const tipoLanzamientoNormalizado = tipoLanzamiento || 'fecha';
    if (!tiposLanzamientoValidos.includes(tipoLanzamientoNormalizado)) {
      return res.status(400).json({
        error: "Tipo de lanzamiento inválido",
        code: "INVALID_LAUNCH_TYPE"
      });
    }

    if ((tipoLanzamientoNormalizado === 'fecha' || tipoLanzamientoNormalizado === 'ambos') && !fechaCierreInscripcion) {
      return res.status(400).json({
        error: "La fecha de cierre de inscripción es requerida para este tipo de lanzamiento",
        code: "MISSING_CLOSE_DATE"
      });
    }

    if ((tipoLanzamientoNormalizado === 'cantidad' || tipoLanzamientoNormalizado === 'ambos') && (!Number.isFinite(maxPersonasNormalizado) || maxPersonasNormalizado < 1)) {
      return res.status(400).json({
        error: "El máximo de personas debe ser mayor o igual a 1 para este tipo de lanzamiento",
        code: "INVALID_MAX_PEOPLE"
      });
    }

    if (fechaInicio && fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
      return res.status(400).json({
        error: "La fecha de finalización no puede ser menor a la fecha de inicio",
        code: "INVALID_DATE_RANGE"
      });
    }

    // Validar que el areaId existe
    const area = await Area.findByPk(areaIdNormalizado);
    if (!area) {
      return res.status(400).json({
        error: "El área especificada no existe",
        code: "INVALID_AREA"
      });
    }

    const nuevoCurso = await Curso.create({
      nombre,
      descripcion,
      duracion: duracionNormalizada,
      categoria,
      nivel,
      areaId: areaIdNormalizado,
      usuarioId,
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null,
      tipoLanzamiento: tipoLanzamientoNormalizado,
      maxPersonas: (tipoLanzamientoNormalizado === 'cantidad' || tipoLanzamientoNormalizado === 'ambos') ? maxPersonasNormalizado : null,
      fechaCierreInscripcion: (tipoLanzamientoNormalizado === 'fecha' || tipoLanzamientoNormalizado === 'ambos') ? fechaCierreInscripcion : null,
    });

    // 🔑 Obtener todos los usuarios del área y vincularlos
    const usuariosDelArea = await Usuario.findAll({
      where: { areaId: areaIdNormalizado },
      attributes: ['id']
    });

    // Crear registros en cursos_usuarios
    for (const usuario of usuariosDelArea) {
      await sequelize.query(
        'INSERT INTO cursos_usuarios (cursoId, usuarioId) VALUES (?, ?)',
        { replacements: [nuevoCurso.id, usuario.id] }
      );
    }

    res.status(201).json({
      id: nuevoCurso.id,
      nombre: nuevoCurso.nombre,
      descripcion: nuevoCurso.descripcion,
      duracion: nuevoCurso.duracion,
      categoria: nuevoCurso.categoria,
      nivel: nuevoCurso.nivel,
      areaId: nuevoCurso.areaId,
      usuarioId: nuevoCurso.usuarioId,
      fechaInicio: nuevoCurso.fechaInicio,
      fechaFin: nuevoCurso.fechaFin,
      tipoLanzamiento: nuevoCurso.tipoLanzamiento,
      maxPersonas: nuevoCurso.maxPersonas,
      fechaCierreInscripcion: nuevoCurso.fechaCierreInscripcion,
      usuariosAsignados: usuariosDelArea.length,
      created_at: nuevoCurso.created_at,
      updated_at: nuevoCurso.updated_at
    });

  } catch (error) {
    console.error("Error al crear curso:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      code: "INTERNAL_ERROR"
    });
  }
});

// PUT /api/cursos/{id} - Actualizar curso (requiere admin)
router.put("/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      duracion,
      categoria,
      nivel,
      areaId,
      areaIds,
      fechaInicio,
      fechaFin,
      tipoLanzamiento,
      maxPersonas,
      fechaCierreInscripcion,
    } = req.body;
    const areaIdBody = areaId !== undefined
      ? Number(areaId)
      : Array.isArray(areaIds) && areaIds.length > 0
        ? Number(areaIds[0])
        : undefined;

    const curso = await Curso.findByPk(id);
    if (!curso) {
      return res.status(404).json({
        error: "Curso no encontrado",
        code: "COURSE_NOT_FOUND"
      });
    }

    // Validaciones opcionales (solo si se proporcionan)
    const updateData = {};

  // Guardar areaId anterior para detectar cambios
  const areaIdAnterior = curso.areaId;

    if (nombre !== undefined) {
      if (typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 255) {
        return res.status(400).json({
          error: "Nombre inválido",
          code: "INVALID_NAME"
        });
      }
      updateData.nombre = nombre.trim();
    }

    if (descripcion !== undefined) {
      if (typeof descripcion !== 'string' || descripcion.trim().length === 0) {
        return res.status(400).json({
          error: "Descripción inválida",
          code: "INVALID_DESCRIPTION"
        });
      }
      updateData.descripcion = descripcion.trim();
    }

    if (duracion !== undefined) {
      const duracionNormalizada = Number(duracion);
      if (!Number.isFinite(duracionNormalizada) || duracionNormalizada < 1) {
        return res.status(400).json({
          error: "Duración inválida",
          code: "INVALID_DURATION"
        });
      }
      updateData.duracion = duracionNormalizada;
    }

    if (categoria !== undefined) {
      const categoriasValidas = ['Programación', 'Idiomas', 'Matemáticas', 'Ciencias', 'Negocios', 'Arte', 'Otro'];
      if (!categoriasValidas.includes(categoria)) {
        return res.status(400).json({
          error: "Categoría inválida",
          code: "INVALID_CATEGORY"
        });
      }
      updateData.categoria = categoria;
    }

    if (nivel !== undefined) {
      const nivelesValidos = ['Básico', 'Intermedio', 'Avanzado'];
      if (!nivelesValidos.includes(nivel)) {
        return res.status(400).json({
          error: "Nivel inválido",
          code: "INVALID_LEVEL"
        });
      }
      updateData.nivel = nivel;
    }

    if (fechaInicio !== undefined) {
      if (fechaInicio && Number.isNaN(new Date(fechaInicio).getTime())) {
        return res.status(400).json({
          error: "Fecha de inicio inválida",
          code: "INVALID_START_DATE"
        });
      }
      updateData.fechaInicio = fechaInicio || null;
    }

    if (fechaFin !== undefined) {
      if (fechaFin && Number.isNaN(new Date(fechaFin).getTime())) {
        return res.status(400).json({
          error: "Fecha de finalización inválida",
          code: "INVALID_END_DATE"
        });
      }
      updateData.fechaFin = fechaFin || null;
    }

    const fechaInicioValidar = updateData.fechaInicio !== undefined ? updateData.fechaInicio : curso.fechaInicio;
    const fechaFinValidar = updateData.fechaFin !== undefined ? updateData.fechaFin : curso.fechaFin;
    if (fechaInicioValidar && fechaFinValidar && new Date(fechaFinValidar) < new Date(fechaInicioValidar)) {
      return res.status(400).json({
        error: "La fecha de finalización no puede ser menor a la fecha de inicio",
        code: "INVALID_DATE_RANGE"
      });
    }

    if (tipoLanzamiento !== undefined) {
      const tiposLanzamientoValidos = ['fecha', 'cantidad', 'ambos'];
      if (!tiposLanzamientoValidos.includes(tipoLanzamiento)) {
        return res.status(400).json({
          error: "Tipo de lanzamiento inválido",
          code: "INVALID_LAUNCH_TYPE"
        });
      }
      updateData.tipoLanzamiento = tipoLanzamiento;
    }

    const tipoLanzamientoActual = updateData.tipoLanzamiento || curso.tipoLanzamiento || 'fecha';

    if (fechaCierreInscripcion !== undefined) {
      if (fechaCierreInscripcion && Number.isNaN(new Date(fechaCierreInscripcion).getTime())) {
        return res.status(400).json({
          error: "Fecha de cierre de inscripción inválida",
          code: "INVALID_CLOSE_DATE"
        });
      }
      updateData.fechaCierreInscripcion = fechaCierreInscripcion || null;
    }

    if (maxPersonas !== undefined) {
      const maxPersonasNormalizado = maxPersonas !== null && maxPersonas !== "" ? Number(maxPersonas) : null;
      if (maxPersonasNormalizado !== null && (!Number.isFinite(maxPersonasNormalizado) || maxPersonasNormalizado < 1)) {
        return res.status(400).json({
          error: "Máximo de personas inválido",
          code: "INVALID_MAX_PEOPLE"
        });
      }
      updateData.maxPersonas = maxPersonasNormalizado;
    }

    const fechaCierreActual = updateData.fechaCierreInscripcion !== undefined
      ? updateData.fechaCierreInscripcion
      : curso.fechaCierreInscripcion;
    const maxPersonasActual = updateData.maxPersonas !== undefined
      ? updateData.maxPersonas
      : curso.maxPersonas;

    if ((tipoLanzamientoActual === 'fecha' || tipoLanzamientoActual === 'ambos') && !fechaCierreActual) {
      return res.status(400).json({
        error: "La fecha de cierre de inscripción es requerida para este tipo de lanzamiento",
        code: "MISSING_CLOSE_DATE"
      });
    }

    if ((tipoLanzamientoActual === 'cantidad' || tipoLanzamientoActual === 'ambos') && (!Number.isFinite(maxPersonasActual) || maxPersonasActual < 1)) {
      return res.status(400).json({
        error: "El máximo de personas debe ser mayor o igual a 1 para este tipo de lanzamiento",
        code: "INVALID_MAX_PEOPLE"
      });
    }

    if (tipoLanzamientoActual === 'fecha') {
      updateData.maxPersonas = null;
    }

    if (tipoLanzamientoActual === 'cantidad') {
      updateData.fechaCierreInscripcion = null;
    }

    if (areaIdBody !== undefined) {
      const area = await Area.findByPk(areaIdBody);
      if (!area) {
        return res.status(400).json({
          error: "El área especificada no existe",
          code: "INVALID_AREA"
        });
      }
      updateData.areaId = areaIdBody;
    }

    // Actualizar timestamps
    updateData.updated_at = new Date();

    await curso.update(updateData);
    // 🔑 Si cambió el areaId, actualizar usuarios vinculados
    if (areaIdBody !== undefined && areaIdBody !== areaIdAnterior) {
      // Eliminar vinculaciones antiguas
      await sequelize.query(
        'DELETE FROM cursos_usuarios WHERE cursoId = ?',
        { replacements: [id] }
      );

      // Obtener nuevos usuarios del área
      const nuevosusuarios = await Usuario.findAll({
        where: { areaId: areaIdBody },
        attributes: ['id']
      });

      // Crear nuevas vinculaciones
      for (const usuario of nuevosusuarios) {
        await sequelize.query(
          'INSERT INTO cursos_usuarios (cursoId, usuarioId) VALUES (?, ?)',
          { replacements: [id, usuario.id] }
        );
      }
    }


    res.json({
      id: curso.id,
      nombre: curso.nombre,
      descripcion: curso.descripcion,
      duracion: curso.duracion,
      categoria: curso.categoria,
      nivel: curso.nivel,
      areaId: curso.areaId,
      usuarioId: curso.usuarioId,
      fechaInicio: curso.fechaInicio,
      fechaFin: curso.fechaFin,
      tipoLanzamiento: curso.tipoLanzamiento,
      maxPersonas: curso.maxPersonas,
      fechaCierreInscripcion: curso.fechaCierreInscripcion,
      updated_at: curso.updated_at
    });

  } catch (error) {
    console.error("Error al actualizar curso:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      code: "INTERNAL_ERROR"
    });
  }
});

// DELETE /api/cursos/{id} - Eliminar curso (requiere admin)
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const curso = await Curso.findByPk(id);
    if (!curso) {
      return res.status(404).json({
        error: "Curso no encontrado",
        code: "COURSE_NOT_FOUND"
      });
    }

    await curso.destroy();

    res.json({
      message: "Curso eliminado exitosamente",
      id: parseInt(id)
    });

  } catch (error) {
    console.error("Error al eliminar curso:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      code: "INTERNAL_ERROR"
    });
  }
});

// POST /api/cursos/notificar-transferencia - Notificar instructores sobre transferencia de conocimiento
router.post("/notificar-transferencia", async (req, res) => {
  try {
    console.log("=== NOTIFICAR TRANSFERENCIA DE CONOCIMIENTO ===");
    
    // Buscar cursos que han terminado hoy y aún no han recibido notificación
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const cursosTerminados = await Curso.findAll({
      where: {
        fechaFin: {
          [Op.gte]: hoy,
          [Op.lt]: manana,
        },
        notificacionTransferenciaEnviada: false,
        usuarioId: { [Op.not]: null },
      },
      include: [
        {
          model: Usuario,
          as: "creador",
          attributes: ["id", "nombre", "email"],
        },
      ],
    });

    console.log(`Cursos terminados hoy: ${cursosTerminados.length}`);

    if (cursosTerminados.length === 0) {
      return res.json({
        mensaje: "No hay cursos que terminen hoy",
        cursosNotificados: 0,
      });
    }

    let cursosNotificados = 0;

    // Notificar a cada instructor
    for (const curso of cursosTerminados) {
      if (curso.usuarioId) {
        try {
          await Notificacion.create({
            usuarioId: curso.usuarioId,
            asunto: "⏰ Transferencia de Conocimiento",
            mensaje: `El curso "${curso.nombre}" ha terminado. A partir de hoy tienes 3 meses para presentar la transferencia de conocimiento.`,
            areaId: curso.areaId || null,
            leida: false,
          });

          // Marcar como notificado
          await curso.update({ notificacionTransferenciaEnviada: true });
          cursosNotificados++;

          console.log(`✅ Notificación enviada al instructor ${curso.usuarioId} del curso ${curso.nombre}`);
        } catch (error) {
          console.error(`Error notificando instructor ${curso.usuarioId}:`, error.message);
        }
      }
    }

    res.json({
      mensaje: "Notificaciones de transferencia enviadas",
      cursosNotificados,
      total: cursosTerminados.length,
    });
  } catch (error) {
    console.error("Error al notificar transferencia:", error);
    res.status(500).json({
      error: "Error al enviar notificaciones",
      detalles: error.message,
    });
  }
});

export default router;