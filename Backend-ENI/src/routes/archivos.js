import express from "express";
import { Archivo, Usuario } from "../database/models/index.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// 📊 Obtener estadísticas de archivos por estado
router.get("/stats/resumen", verifyToken, async (req, res) => {
  try {
    const stats = await Archivo.sequelize.query(
      `SELECT estado, COUNT(*) as cantidad FROM archivos GROUP BY estado`,
      { type: "SELECT" }
    );

    res.status(200).json({
      success: true,
      message: "Estadísticas obtenidas correctamente",
      data: stats,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: error.message,
    });
  }
});

// 📤 Obtener todos los archivos de un usuario
router.get("/usuario/:usuarioId", verifyToken, async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const archivos = await Archivo.findAll({
      where: { usuarioId },
      include: {
        model: Usuario,
        as: "usuario",
        attributes: ["id", "nombre", "email"],
      },
      order: [["fechaCarga", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "Archivos obtenidos correctamente",
      data: archivos,
    });
  } catch (error) {
    console.error("Error al obtener archivos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los archivos",
      error: error.message,
    });
  }
});

// 📄 Obtener todos los archivos (admin)
router.get("/", verifyToken, async (req, res) => {
  try {
    const archivos = await Archivo.findAll({
      include: {
        model: Usuario,
        as: "usuario",
        attributes: ["id", "nombre", "email"],
      },
      order: [["fechaCarga", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "Todos los archivos obtenidos correctamente",
      data: archivos,
    });
  } catch (error) {
    console.error("Error al obtener archivos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los archivos",
      error: error.message,
    });
  }
});

// 📋 Obtener un archivo por ID (SIEMPRE AL FINAL)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const archivo = await Archivo.findByPk(id, {
      include: {
        model: Usuario,
        as: "usuario",
        attributes: ["id", "nombre", "email"],
      },
    });

    if (!archivo) {
      return res.status(404).json({
        success: false,
        message: "Archivo no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Archivo obtenido correctamente",
      data: archivo,
    });
  } catch (error) {
    console.error("Error al obtener archivo:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el archivo",
      error: error.message,
    });
  }
});

// ✏️ Actualizar estado de un archivo
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, descripcion } = req.body;

    if (estado && !["pendiente", "aprobado", "rechazado"].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: "Estado inválido",
      });
    }

    const archivo = await Archivo.findByPk(id);

    if (!archivo) {
      return res.status(404).json({
        success: false,
        message: "Archivo no encontrado",
      });
    }

    if (estado) archivo.estado = estado;
    if (descripcion !== undefined) archivo.descripcion = descripcion;

    await archivo.save();

    res.status(200).json({
      success: true,
      message: "Archivo actualizado correctamente",
      data: archivo,
    });
  } catch (error) {
    console.error("Error al actualizar archivo:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el archivo",
      error: error.message,
    });
  }
});

// 🗑️ Eliminar un archivo
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const archivo = await Archivo.findByPk(id);

    if (!archivo) {
      return res.status(404).json({
        success: false,
        message: "Archivo no encontrado",
      });
    }

    await archivo.destroy();

    res.status(200).json({
      success: true,
      message: "Archivo eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar archivo:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el archivo",
      error: error.message,
    });
  }
});

export default router;
