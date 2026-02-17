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
      attributes: ['id', 'nombre', 'descripcion', 'duracion', 'categoria', 'nivel', 'areaId', 'usuarioId', 'created_at', 'updated_at']
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

    const areaIdInt = parseInt(areaId);

    // Ahora usamos la tabla de relación cursos_areas para soportar
    // cursos que pertenecen a múltiples áreas.
    const cursos = await sequelize.query(
      `SELECT c.id, c.nombre, c.descripcion, c.duracion, c.categoria, c.nivel,
              c.areaId, c.usuarioId, c.created_at, c.updated_at
       FROM cursos c
       INNER JOIN cursos_areas ca ON ca.cursoId = c.id
       WHERE ca.areaId = ?
       ORDER BY c.created_at DESC`,
      {
        replacements: [areaIdInt],
        type: QueryTypes.SELECT,
      }
    );

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

    // Obtener solo los cursos vinculados al área del usuario
    const cursos = await sequelize.query(
      `SELECT c.id, c.nombre, c.descripcion, c.duracion, c.categoria, c.nivel,
              c.areaId, c.usuarioId, c.created_at, c.updated_at
       FROM cursos c
       INNER JOIN cursos_areas ca ON ca.cursoId = c.id
       WHERE ca.areaId = ?
       ORDER BY c.created_at DESC`,
      {
        replacements: [usuario.areaId],
        type: QueryTypes.SELECT,
      }
    );

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

// GET /api/cursos/:id/areas - Obtener áreas vinculadas a un curso (many-to-many)
router.get("/:id/areas", async (req, res) => {
  try {
    const { id } = req.params;

    const areasCurso = await sequelize.query(
      `SELECT a.id, a.codigo, a.nombre
       FROM areas a
       INNER JOIN cursos_areas ca ON ca.areaId = a.id
       WHERE ca.cursoId = ?
       ORDER BY a.nombre ASC`,
      {
        replacements: [id],
        type: QueryTypes.SELECT,
      }
    );

    res.json(areasCurso);
  } catch (error) {
    console.error("Error al obtener áreas del curso:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      code: "INTERNAL_ERROR",
    });
  }
});

// POST /api/cursos - Crear nuevo curso (requiere admin)
router.post("/", verifyAdmin, async (req, res) => {
  try {
    const usuarioId = req.usuario?.id;
    const { nombre, descripcion, duracion, categoria, nivel, areaId, areaIds } = req.body;

    if (!usuarioId) {
      return res.status(401).json({
        error: "Usuario no autenticado",
        code: "UNAUTHORIZED"
      });
    }

    // Normalizar áreas: soportar múltiples áreas por curso
    let normalizedAreaIds = [];

    if (Array.isArray(areaIds)) {
      normalizedAreaIds = areaIds;
    } else if (typeof areaIds === "string") {
      try {
        const parsed = JSON.parse(areaIds);
        if (Array.isArray(parsed)) {
          normalizedAreaIds = parsed;
        }
      } catch (e) {
        // si no se puede parsear, se ignora y se usa areaId simple
      }
    }

    if (!normalizedAreaIds.length && areaId) {
      normalizedAreaIds = [areaId];
    }

    // Convertir a enteros únicos y válidos
    normalizedAreaIds = Array.from(
      new Set(
        normalizedAreaIds
          .map((id) => parseInt(id))
          .filter((id) => !Number.isNaN(id))
      )
    );

    // Validaciones
    if (!nombre || !descripcion || !duracion || !categoria || !nivel || !normalizedAreaIds.length) {
      return res.status(400).json({
        error: "Todos los campos son requeridos y se debe enviar al menos un área",
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

    // Validar que TODAS las áreas existen
    const areasEncontradas = await Area.findAll({
      where: { id: normalizedAreaIds },
    });

    if (areasEncontradas.length !== normalizedAreaIds.length) {
      return res.status(400).json({
        error: "Una o más áreas especificadas no existen",
        code: "INVALID_AREA"
      });
    }

    const nuevoCurso = await Curso.create({
      nombre,
      descripcion,
      duracion,
      categoria,
      nivel,
      // guardamos la primera área como área principal para compatibilidad
      areaId: normalizedAreaIds[0],
      usuarioId
    });

    // 🔑 Obtener todos los usuarios de las áreas y vincularlos
    const usuariosDelArea = await Usuario.findAll({
      where: { areaId: normalizedAreaIds },
      attributes: ['id', 'areaId'],
    });

    // Crear registros en cursos_usuarios (curso-usuario)
    for (const usuario of usuariosDelArea) {
      await sequelize.query(
        "INSERT INTO cursos_usuarios (cursoId, usuarioId) VALUES (?, ?)",
        { replacements: [nuevoCurso.id, usuario.id] }
      );
    }

    // Crear registros en cursos_areas (curso-área) para soportar múltiples áreas
    for (const areaIdValue of normalizedAreaIds) {
      await sequelize.query(
        "INSERT INTO cursos_areas (cursoId, areaId) VALUES (?, ?)",
        { replacements: [nuevoCurso.id, areaIdValue] }
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
    const { nombre, descripcion, duracion, categoria, nivel, areaId, areaIds } = req.body;

    const curso = await Curso.findByPk(id);
    if (!curso) {
      return res.status(404).json({
        error: "Curso no encontrado",
        code: "COURSE_NOT_FOUND"
      });
    }

    // Normalizar áreas si se envían (múltiples áreas por curso)
    let normalizedAreaIds = [];
    if (Array.isArray(areaIds)) {
      normalizedAreaIds = areaIds;
    } else if (typeof areaIds === "string") {
      try {
        const parsed = JSON.parse(areaIds);
        if (Array.isArray(parsed)) {
          normalizedAreaIds = parsed;
        }
      } catch (e) {
        // ignorar error de parseo
      }
    }

    if (!normalizedAreaIds.length && areaId !== undefined && areaId !== null && areaId !== "") {
      normalizedAreaIds = [areaId];
    }

    if (normalizedAreaIds.length) {
      normalizedAreaIds = Array.from(
        new Set(
          normalizedAreaIds
            .map((value) => parseInt(value))
            .filter((value) => !Number.isNaN(value))
        )
      );
    }

    // Validaciones opcionales (solo si se proporcionan)
    const updateData = {};

    // Guardar areaId anterior (para compatibilidad)
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

    // Si se envían nuevas áreas, validarlas y usar la primera como principal
    if (normalizedAreaIds.length) {
      const areasEncontradas = await Area.findAll({
        where: { id: normalizedAreaIds },
      });

      if (areasEncontradas.length !== normalizedAreaIds.length) {
        return res.status(400).json({
          error: "Una o más áreas especificadas no existen",
          code: "INVALID_AREA",
        });
      }

      updateData.areaId = normalizedAreaIds[0];
    } else if (areaId !== undefined) {
      // Compatibilidad: si solo viene un areaId simple
      const area = await Area.findByPk(areaId);
      if (!area) {
        return res.status(400).json({
          error: "El área especificada no existe",
          code: "INVALID_AREA"
        });
      }
      updateData.areaId = areaId;
    }

    // Actualizar timestamps
    updateData.updated_at = new Date();

    await curso.update(updateData);
    // 🔑 Si se enviaron nuevas áreas o cambió el área principal,
    // actualizamos las relaciones en cursos_areas y cursos_usuarios
    if (normalizedAreaIds.length || (areaId !== undefined && areaId !== areaIdAnterior)) {
      const areaIdsParaUsar =
        normalizedAreaIds.length > 0
          ? normalizedAreaIds
          : [parseInt(areaId)].filter((v) => !Number.isNaN(v));

      // Actualizar cursos_areas
      await sequelize.query(
        "DELETE FROM cursos_areas WHERE cursoId = ?",
        { replacements: [id] }
      );

      for (const areaIdValue of areaIdsParaUsar) {
        await sequelize.query(
          "INSERT INTO cursos_areas (cursoId, areaId) VALUES (?, ?)",
          { replacements: [id, areaIdValue] }
        );
      }

      // Actualizar cursos_usuarios basado en las nuevas áreas
      await sequelize.query(
        "DELETE FROM cursos_usuarios WHERE cursoId = ?",
        { replacements: [id] }
      );

      const nuevosusuarios = await Usuario.findAll({
        where: { areaId: areaIdsParaUsar },
        attributes: ["id"],
      });

      for (const usuario of nuevosusuarios) {
        await sequelize.query(
          "INSERT INTO cursos_usuarios (cursoId, usuarioId) VALUES (?, ?)",
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