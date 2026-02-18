import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { Usuario } from "../database/models/usuarios.js";
import { Area } from "../database/models/area.js";
import verifyToken from "../middleware/verifyToken.js";
import verifyCaptcha from "../middleware/verifyCaptcha.js";
import nodemailer from "nodemailer";
import { Notificacion } from "../database/models/notificacion.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { Op } from "sequelize";

dotenv.config();
const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads", "notificaciones");
const uploadDirEvidencias = path.join(process.cwd(), "uploads", "evidencias");

// Crear carpetas si no existen
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(uploadDirEvidencias)) {
  fs.mkdirSync(uploadDirEvidencias, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // 👈 usamos ruta absoluta ya comprobada
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});

const storageEvidencias = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirEvidencias);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Solo se permiten archivos PDF"));
    }
    cb(null, true);
  },
});

const uploadEvidencias = multer({
  storage: storageEvidencias,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Solo se permiten archivos PDF"));
    }
    cb(null, true);
  },
});



router.post("/register", verifyCaptcha, async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol = "Formador", codigoArea, } = req.body;
    if (!nombre || !apellido || !email || !password || !codigoArea)
      return res.status(400).json({ mensaje: "Nombre, apellido, email, contraseña y el area son requeridos" });

    const existe = await Usuario.findOne({ where: { email } });
    if (existe)
      return res.status(400).json({ mensaje: "Ya existe un usuario con ese correo" });

    const area = await Area.findOne({ where: { codigo: codigoArea } });

    if (!area)
      return res.status(404).json({ mensaje: "No existe un área con ese código" });
    // Hashear la contraseña antes de guardarla
    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await Usuario.create({
      nombre,
      apellido,
      email,
      password: passwordHash,
      rol,
      areaId: area.id
    });

    res.status(201).json({
      mensaje: "Usuario registrado exitosamente",
      usuario: {
        id: nuevoUsuario.id,
        nombre,
        apellido,
        email,
        rol,
        areaId: area.id
      },
    });

  } catch (err) {
    res.status(500).json({ mensaje: "Error al registrar usuario", error: err.message });
  }
});


router.post("/login", verifyCaptcha, async (req, res) => {
  try {
    console.log("BODY LOGIN:", req.body);
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ mensaje: "Email y contraseña son requeridos" });

    const user = await Usuario.findOne({ where: { email } });
    if (!user) return res.status(401).json({ mensaje: "Usuario no encontrado" });
    // Verificar contraseña 
    let passwordMatch = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      // Contraseña hasheada con bcrypt
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      // Contraseña en texto plano 
      passwordMatch = password === user.password;
    }

    if (!passwordMatch)
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: user.id, email: user.email, nombre: user.nombre, apellido: user.apellido, rol: user.rol, areaId: user.areaId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    res.json({
      mensaje: "Login exitoso",
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol,
        areaId: user.areaId,
        categoria: user.categoria
      }
    });
  } catch (err) {
    console.error("Error en /login:", err);
    res.status(500).json({ mensaje: "Error al iniciar sesión", error: err.message });
  }
});


router.get("/perfil", verifyToken, async (req, res) => {
  const usuario = await Usuario.findByPk(req.usuario.id, {
    attributes: ["id", "nombre", "apellido", "email", "rol", "areaId"],
  });
  res.json({ mensaje: "Acceso autorizado", usuario });
});

router.get("/", verifyToken, async (req, res) => {
  try {
    if (req.usuario.rol !== "Administrador") {
      return res.status(403).json({ mensaje: "No tienes permiso para ver usuarios" });
    }

    const usuarios = await Usuario.findAll({
      attributes: ["id", "nombre", "apellido", "email", "rol", "areaId"],
      order: [["nombre", "ASC"], ["apellido", "ASC"]],
    });

    return res.json(usuarios);
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    return res.status(500).json({ mensaje: "Error al obtener usuarios", error: error.message });
  }
});

router.delete("/eliminar/:id", verifyToken, async (req, res) => {
  try {
    if (req.usuario.rol !== "Administrador")
      return res.status(403).json({ mensaje: "No tienes permiso para eliminar usuarios" });

    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario)
      return res.status(404).json({ mensaje: "Usuario no encontrado" });

    await usuario.destroy();
    res.json({ mensaje: `Usuario con ID ${req.params.id} eliminado correctamente ✅` });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar usuario", error: error.message });
  }
});

router.post("/cambiar-password", async (req, res) => {
  try {
    const { email, nuevaPassword } = req.body;

    if (!email || !nuevaPassword) {
      return res.status(400).json({
        mensaje: "El email y la nueva contraseña son requeridos"
      });
    }

    if (nuevaPassword.length < 6) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener al menos 6 caracteres"
      });
    }

    // Buscar el usuario
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(404).json({
        mensaje: "No existe un usuario con ese correo electrónico"
      });
    }
    // Hashear la nueva contraseña
    const passwordHash = await bcrypt.hash(nuevaPassword, 10);
    // Actualizar la contraseña
    await usuario.update({ password: passwordHash });

    res.status(200).json({
      mensaje: "Contraseña actualizada correctamente"
    });
  } catch (error) {
    console.error("Error en cambiar-password:", error);
    res.status(500).json({
      mensaje: "Error del servidor al cambiar la contraseña",
      error: error.message
    });
  }
});

router.post("/notificar-por-area", verifyToken, upload.array("archivos", 5), async (req, res) => {
  try {
    // Solo admin puede usar esta ruta
    if (req.usuario.rol !== "Administrador") {
      return res
        .status(403)
        .json({ mensaje: "Solo un administrador puede enviar notificaciones" });
    }
    const { areaIds, asunto, mensaje } = req.body;


    // 1) Parsear areaIds que viene como string JSON del FormData
    let parsedAreaIds = [];
    try {
      parsedAreaIds = JSON.parse(areaIds);
    } catch {
      parsedAreaIds = [];
    }

    parsedAreaIds = parsedAreaIds.map((id) => Number(id)).filter(Boolean);

    console.log("BODY areaIds:", areaIds);
    console.log("parsedAreaIds:", parsedAreaIds);

    const usuarios = await Usuario.findAll({
      where: {
        areaId: {
          [Op.in]: parsedAreaIds,
        },
      },
      attributes: ["id", "email", "nombre", "apellido", "areaId"],
      logging: console.log,
    });
    const archivos = (req.files || []).map((f) => f.path); // rutas en disco

    if (!usuarios.length) {
      console.log("DEBUG areaIds:", parsedAreaIds);
      return res
        .status(404)
        .json({ mensaje: "No hay usuarios registrados en esas áreas" });
    }

    // Crear notificación para cada usuario encontrado
    await Notificacion.bulkCreate(
      usuarios.map((u) => ({
        usuarioId: u.id,
        areaId: u.areaId, // guardas el área real del usuario
        asunto,
        mensaje,
        archivos: JSON.stringify(archivos),
      }))
    );
    return res.json({
      mensaje: `Notificación enviada a ${usuarios.length} usuarios de las áreas: ${parsedAreaIds.join(
        ", "
      )}`,
    });
  } catch (err) {
    console.error("Error al enviar notificación por área:", err);
    res.status(500).json({
      mensaje: "Error al enviar notificación",
      error: err.message,
    });
  }
});




router.get("/mis-notificaciones", verifyToken, async (req, res) => {
  try {
    const notificaciones = await Notificacion.findAll({
      where: { usuarioId: req.usuario.id },
      order: [["creadaEn", "DESC"]],
      attributes: ["id", "asunto", "mensaje", "leida", "creadaEn", "archivos", "archivo"],
    });

    // Normalizar: si existe archivo (legacy) o archivos, exponer como archivos
    const normalized = notificaciones.map((n) => {
      const data = n.toJSON();
      const archivosRaw = data.archivos || data.archivo;
      return { ...data, archivos: archivosRaw };
    });

    res.json({ notificaciones: normalized });
  } catch (err) {
    console.error("Error al obtener notificaciones:", err);
    res.status(500).json({ mensaje: "Error al obtener notificaciones" });
  }
});


// Subir evidencias (usuarios) -> crea notificación para cada administrador
router.post("/subir-evidencia", verifyToken, uploadEvidencias.array("archivos", 5), async (req, res) => {
  try {
    if (req.usuario.rol === "Administrador") {
      return res.status(400).json({
        mensaje: "Los administradores no pueden subir evidencias desde aquí",
      });
    }

    const { descripcion = "" } = req.body;
    const archivosSubidos = req.files || [];

    if (archivosSubidos.length === 0) {
      return res.status(400).json({
        mensaje: "Debes subir al menos un archivo PDF",
      });
    }

    const rutasWeb = archivosSubidos.map((f) => {
      const rel = path.relative(process.cwd(), f.path);
      return rel.replace(/\\/g, "/");
    });

    const admins = await Usuario.findAll({
      where: { rol: "Administrador" },
      attributes: ["id"],
    });

    if (admins.length === 0) {
      return res.status(500).json({
        mensaje: "No hay administradores en el sistema para notificar",
      });
    }

    const nombreUsuario = [req.usuario.nombre, req.usuario.apellido].filter(Boolean).join(" ") || "Usuario";
    const asunto = `📎 Nueva evidencia enviada por ${nombreUsuario}`;
    const mensaje =
      descripcion.trim() ||
      `El usuario ${nombreUsuario} ha subido ${archivosSubidos.length} archivo(s) como evidencia.`;

    await Notificacion.bulkCreate(
      admins.map((admin) => ({
        usuarioId: admin.id,
        areaId: null,
        asunto,
        mensaje,
        archivos: JSON.stringify(rutasWeb),
      }))
    );

    return res.json({
      mensaje: `Evidencia subida correctamente. Se ha notificado a ${admins.length} administrador(es).`,
    });
  } catch (err) {
    console.error("Error al subir evidencia:", err);
    res.status(500).json({
      mensaje: "Error al subir la evidencia",
      error: err.message,
    });
  }
});

// Marcar una notificación como leída
router.post("/notificaciones/:id/marcar-leida", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const notif = await Notificacion.findOne({
      where: { id, usuarioId: req.usuario.id },
    });

    if (!notif) {
      return res
        .status(404)
        .json({ mensaje: "Notificación no encontrada" });
    }

    await notif.update({ leida: 1 });

    res.json({ mensaje: "Notificación marcada como leída" });
  } catch (err) {
    console.error("Error al marcar notificación como leída:", err);
    res
      .status(500)
      .json({ mensaje: "Error al actualizar notificación" });
  }
});


export default router;
