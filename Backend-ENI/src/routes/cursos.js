import express from "express";
import { Curso } from "../database/models/cursos.js";
import { Area } from "../database/models/area.js";
import { Usuario } from "../database/models/usuarios.js";
import { sequelize } from "../database/config.js";
import { QueryTypes } from "sequelize";
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

    res.json(cursos);
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

    res.json(cursos);
  } catch (error) {
    console.error("Error al obtener cursos por área:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      code: "INTERNAL_ERROR"
    });
  }
});

// GET /api/cursos/mis-cursos - Obtener mis cursos (solo del área del usuario autenticado)
router.get("/mios", verifyToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    // Obtener el usuario para saber su areaId
    const usuario = await Usuario.findByPk(usuarioId, {
      attributes: ['id', 'areaId']
    });

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
        code: "USER_NOT_FOUND"
      });
    }

    if (!usuario.areaId) {
      return res.json([]);
    }

    // Obtener solo los cursos del área del usuario
    const cursos = await Curso.findAll({
      where: { areaId: usuario.areaId },
      attributes: ['id', 'nombre', 'descripcion', 'duracion', 'categoria', 'nivel', 'areaId', 'usuarioId', 'fechaInicio', 'fechaFin', 'tipoLanzamiento', 'maxPersonas', 'fechaCierreInscripcion', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']]
    });

    res.json(cursos);
  } catch (error) {
    console.error("Error al obtener mis cursos:", error);
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
    const { nombre, descripcion, duracion, categoria, nivel, areaId, fechaInicio, fechaFin, tipoLanzamiento, maxPersonas, fechaCierreInscripcion } = req.body;

    if (!usuarioId) {
      return res.status(401).json({
        error: "Usuario no autenticado",
        code: "UNAUTHORIZED"
      });
    }

    // Validaciones
    if (!nombre || !descripcion || !duracion || !categoria || !nivel || !areaId) {
      return res.status(400).json({
        error: "Todos los campos son requeridos",
        code: "MISSING_FIELDS"
      });
    }

    if (typeof duracion !== 'number' || duracion < 1) {
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

    // Validar tipoLanzamiento
    const tiposLanzamientoValidos = ['fecha', 'cantidad', 'ambos'];
    if (tipoLanzamiento && !tiposLanzamientoValidos.includes(tipoLanzamiento)) {
      return res.status(400).json({
        error: "Tipo de lanzamiento inválido",
        code: "INVALID_LAUNCH_TYPE"
      });
    }

    // Validar que el areaId existe
    const area = await Area.findByPk(areaId);
    if (!area) {
      return res.status(400).json({
        error: "El área especificada no existe",
        code: "INVALID_AREA"
      });
    }

    const nuevoCurso = await Curso.create({
      nombre,
      descripcion,
      duracion,
      categoria,
      nivel,
      areaId,
      usuarioId,
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null,
      tipoLanzamiento: tipoLanzamiento || 'fecha',
      maxPersonas: maxPersonas || 0,
      fechaCierreInscripcion: fechaCierreInscripcion || null
    });

    // 🔑 Obtener todos los usuarios del área y vincularlos
    const usuariosDelArea = await Usuario.findAll({
      where: { areaId: areaId },
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
    const { nombre, descripcion, duracion, categoria, nivel, areaId, fechaInicio, fechaFin, tipoLanzamiento, maxPersonas, fechaCierreInscripcion } = req.body;

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
      if (typeof duracion !== 'number' || duracion < 1) {
        return res.status(400).json({
          error: "Duración inválida",
          code: "INVALID_DURATION"
        });
      }
      updateData.duracion = duracion;
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

    if (areaId !== undefined) {
      const area = await Area.findByPk(areaId);
      if (!area) {
        return res.status(400).json({
          error: "El área especificada no existe",
          code: "INVALID_AREA"
        });
      }
      updateData.areaId = areaId;
    }

    // Nuevos campos de fechas y lanzamiento
    if (fechaInicio !== undefined) {
      updateData.fechaInicio = fechaInicio || null;
    }

    if (fechaFin !== undefined) {
      updateData.fechaFin = fechaFin || null;
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

    if (maxPersonas !== undefined) {
      updateData.maxPersonas = maxPersonas || 0;
    }

    if (fechaCierreInscripcion !== undefined) {
      updateData.fechaCierreInscripcion = fechaCierreInscripcion || null;
    }

    // Actualizar timestamps
    updateData.updated_at = new Date();

    await curso.update(updateData);
    // 🔑 Si cambió el areaId, actualizar usuarios vinculados
    if (areaId !== undefined && areaId !== areaIdAnterior) {
      // Eliminar vinculaciones antiguas
      await sequelize.query(
        'DELETE FROM cursos_usuarios WHERE cursoId = ?',
        { replacements: [id] }
      );

      // Obtener nuevos usuarios del área
      const nuevosusuarios = await Usuario.findAll({
        where: { areaId: areaId },
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

export default router;