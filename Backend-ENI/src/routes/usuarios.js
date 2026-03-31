import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { Usuario } from "../database/models/usuarios.js";
import { Area } from "../database/models/area.js";
import { InscripcionCapacitacion } from "../database/models/inscripciones_capacitacion.js";
import verifyToken from "../middleware/verifyToken.js";
import verifyCaptcha from "../middleware/verifyCaptcha.js";
import { Notificacion } from "../database/models/notificacion.js";
import { Archivo } from "../database/models/archivos.js";
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import { Op } from "sequelize";
import { sequelize } from "../database/config.js";
import { uploadEvidenciasToDrive } from "../services/googleDrive.js";

dotenv.config();
const router = express.Router();
const TEMP_PASSWORD = "ENI2024*";

const isBcryptHash = (value = "") => value.startsWith("$2a$") || value.startsWith("$2b$");

const hasTemporaryPassword = async (user) => {
  // Ahora siempre retorna false porque la contraseña debe ser el documento
  return false;
};

const buildAuthPayload = async (user, forzarCambioPassword = false) => {
  // Si forzarCambioPassword es true, siempre requiere cambio
  const requiereCambioPassword = forzarCambioPassword || await hasTemporaryPassword(user);

  return {
    tokenPayload: {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      rol: user.rol,
      areaId: user.areaId,
      requiereCambioPassword,
    },
    responseBody: {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      rol: user.rol,
      areaId: user.areaId,
      categoria: user.categoria,
      requiereCambioPassword,
    },
    requiereCambioPassword,
  };
};

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
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Solo se permiten archivos PDF"));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Multer configuration para archivos Excel/CSV (importación en lote)
const uploadExcel = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Solo se permiten archivos Excel o CSV"));
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
      return res.status(400).json({ mensaje: "Correo y contraseña son requeridos" });

    // Buscar usuario por correo electrónico O por documento
    const user = await Usuario.findOne({
      attributes: ['id', 'documento', 'email', 'password', 'nombre', 'apellido', 'rol', 'areaId'],
      where: {
        [Op.or]: [
          { email: email.toLowerCase().trim() },
          { documento: email.trim() }
        ]
      }
    });
    if (!user) return res.status(401).json({ mensaje: "Usuario no encontrado" });

    // Debug: mostrar documento del usuario y password ingresada
    console.log("Usuario encontrado:", user.email);
    console.log("Documento del usuario:", user.documento);
    console.log("Password ingresada:", password);

    // Verificar contraseña: debe coincidir con el documento del usuario
    // NO hacer trim() en la contraseña para mantener exactitud
    const documentoUsuario = (user.documento || "").trim();
    const passwordIngresada = password; // Mantener la contraseña sin trim
    const passwordMatch = documentoUsuario !== "" && passwordIngresada === documentoUsuario;

    // Si no coincide con el documento, verificar contra la password guardada (para usuarios legacy)
    if (!passwordMatch) {
      if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
        // Contraseña hasheada con bcrypt - comparar sin trim
        const matchLegacy = await bcrypt.compare(password, user.password);
        if (!matchLegacy) {
          console.log("Password match (legacy):", false);
          return res.status(401).json({ mensaje: "Contraseña incorrecta" });
        }
        console.log("Password match (legacy):", true);
      } else {
        // Contraseña en texto plano - comparar sin trim
        const matchLegacy = password === user.password;
        if (!matchLegacy) {
          console.log("Password match (legacy):", false);
          return res.status(401).json({ mensaje: "Contraseña incorrecta" });
        }
        console.log("Password match (legacy):", true);
      }
    } else {
      console.log("Password match (documento):", true);
    }

    // Determinar si requiere cambio de contraseña
    // Si la contraseña coincidió con el documento, obligar al cambio
    const requiereCambioPassword = passwordMatch;

    const authData = await buildAuthPayload(user, requiereCambioPassword);

    const token = jwt.sign(
      authData.tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    res.json({
      mensaje: "Login exitoso",
      token,
      requiereCambioPassword: authData.requiereCambioPassword,
      usuario: authData.responseBody,
    });
  } catch (err) {
    console.error("Error en /login:", err);
    res.status(500).json({ mensaje: "Error al iniciar sesión", error: err.message });
  }
});

// Ruta para importación masiva de usuarios mediante archivo Excel/CSV
router.post(
  "/upload-bulk",
  verifyToken,
  uploadExcel.single("file"),
  async (req, res) => {
    try {
      const normalizeText = (value) =>
        String(value ?? "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toLowerCase();

      const getNormalizedRow = (row) =>
        Object.entries(row).reduce((acc, [key, value]) => {
          acc[normalizeText(String(key).replace(/\s+/g, " "))] = value;
          return acc;
        }, {});

      const getField = (row, keys) => {
        const normalizedRow = getNormalizedRow(row);

        for (const key of keys) {
          if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
            return row[key];
          }

          const normalizedKey = normalizeText(String(key).replace(/\s+/g, " "));
          const normalizedValue = normalizedRow[normalizedKey];
          if (normalizedValue !== undefined && normalizedValue !== null && String(normalizedValue).trim() !== "") {
            return normalizedValue;
          }
        }
        return null;
      };

      const parseDateValue = (value) => {
        if (!value) return null;
        if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
        if (typeof value === "number") {
          const parsed = xlsx.SSF.parse_date_code(value);
          if (!parsed) return null;
          return new Date(parsed.y, parsed.m - 1, parsed.d);
        }

        const text = String(value).trim();
        if (!text) return null;

        const directDate = new Date(text);
        if (!Number.isNaN(directDate.getTime())) return directDate;

        const match = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
        if (!match) return null;

        const day = Number(match[1]);
        const month = Number(match[2]) - 1;
        const rawYear = Number(match[3]);
        const year = rawYear < 100 ? 2000 + rawYear : rawYear;
        const parsed = new Date(year, month, day);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      };

      const splitFullName = (fullName) => {
        const cleanName = String(fullName || "").trim().replace(/\s+/g, " ");
        if (!cleanName) return { nombre: null, apellido: "" };

        const parts = cleanName.split(" ");
        if (parts.length === 1) {
          return { nombre: parts[0], apellido: "" };
        }

        return {
          nombre: parts.slice(0, 2).join(" "),
          apellido: parts.slice(2).join(" ") || parts[parts.length - 1],
        };
      };

      const parsePlanMultiplicacion = (value) => {
        const text = String(value || "").trim();
        if (!text) {
          return { opcion: null, acta: null };
        }

        const normalized = normalizeText(text);
        const acta = normalized.includes("sin acta") || normalized === "no"
            ? "NO"
          : normalized.includes("acta")
            ? "SI"
            : null;

        return {
          opcion: text,
          acta,
        };
      };

      const buscarArea = async (areaHints, transaction) => {
        const cleanHints = areaHints
          .map((value) => String(value || "").trim())
          .filter(Boolean);

        if (!cleanHints.length) return null;

        const areas = await Area.findAll({ transaction });
        const indexed = areas.map((area) => ({
          area,
          codigo: normalizeText(area.codigo),
          nombre: normalizeText(area.nombre),
        }));

        for (const hint of cleanHints) {
          const normalizedHint = normalizeText(hint);
          const compactHint = normalizedHint
            .replace(/^red de /, "")
            .replace(/^red /, "")
            .replace(/^area de /, "")
            .replace(/^area /, "");

          const exactMatch = indexed.find(
            ({ codigo, nombre }) =>
              codigo === normalizedHint ||
              nombre === normalizedHint ||
              nombre === `red de ${compactHint}` ||
              nombre.endsWith(compactHint)
          );
          if (exactMatch) return exactMatch.area;

          const prefixedHint = normalizedHint.startsWith("red de") ? normalizedHint : `red de ${normalizedHint}`;
          const fuzzyMatch = indexed.find(
            ({ nombre }) =>
              nombre.includes(normalizedHint) ||
              nombre.includes(compactHint) ||
              nombre.includes(prefixedHint) ||
              prefixedHint.includes(nombre) ||
              compactHint.includes(nombre.replace(/^red de /, ""))
          );
          if (fuzzyMatch) return fuzzyMatch.area;
        }

        return null;
      };

      // sólo administradores pueden ejecutar esta operación
      if (req.usuario.rol !== "Administrador") {
        return res.status(403).json({ mensaje: "No tienes permiso para importar usuarios" });
      }

      if (!req.file) {
        return res.status(400).json({ mensaje: "Debes adjuntar un archivo" });
      }

      // leer workbook desde buffer
      const workbook = xlsx.read(req.file.buffer, { type: "buffer", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const matrix = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: 1,
        defval: "",
        blankrows: false,
      });

      const expectedHeaders = [
        "documento",
        "correo",
        "email",
        "nombre instructor",
        "red de conocimiento",
        "area tematica",
        "denominacion de la capacitacion",
      ];

      const headerRowIndex = matrix.findIndex((row) => {
        const normalizedCells = row.map((cell) => normalizeText(cell));
        const matches = expectedHeaders.filter((header) => normalizedCells.includes(header)).length;
        return matches >= 3;
      });

      if (headerRowIndex === -1) {
        return res.status(400).json({
          mensaje: "No se encontró una fila de encabezados válida en el Excel",
          detalles: {
            encabezadosDetectados: matrix.slice(0, 5),
          },
        });
      }

      const rawHeaders = matrix[headerRowIndex].map((cell, index) => {
        const value = String(cell || "").trim();
        return value || `columna_${index + 1}`;
      });

      const rows = matrix
        .slice(headerRowIndex + 1)
        .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))
        .map((row) => {
          const mappedRow = {};
          rawHeaders.forEach((header, index) => {
            mappedRow[header] = row[index] ?? "";
          });
          return mappedRow;
        });

      if (!rows || rows.length === 0) {
        return res.status(400).json({ mensaje: "El archivo está vacío" });
      }

      const resultado = await sequelize.transaction(async (transaction) => {
        const filasProcesadas = new Set();
        const detalles = {
          usuariosCreados: 0,
          usuariosReutilizados: 0,
          inscripcionesCreadas: 0,
          filasOmitidas: 0,
          errores: [],
          encabezadosDetectados: rawHeaders,
          filaEncabezados: headerRowIndex + 1,
        };

        const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 10);

        for (let index = 0; index < rows.length; index += 1) {
          const row = rows[index];
          const numeroFila = index + 2;

          const documento = String(getField(row, ["documento", "DOCUMENTO", "id", "ID"]) || "").trim();
          const nombreDirecto = getField(row, ["nombre", "Nombre"]);
          const apellidoDirecto = getField(row, ["apellido", "Apellido"]);
          const nombreCompleto = getField(row, ["NOMBRE INSTRUCTOR", "Nombre Instructor", "nombre_instructor"]);

          let nombre = nombreDirecto ? String(nombreDirecto).trim() : null;
          let apellido = apellidoDirecto ? String(apellidoDirecto).trim() : "";

          if ((!nombre || !apellido) && nombreCompleto) {
            const splitName = splitFullName(nombreCompleto);
            nombre = nombre || splitName.nombre;
            apellido = apellido || splitName.apellido;
          }

          let email = String(
            getField(row, ["email", "Email", "CORREO", "correo", "Mail", "MAIL"]) || ""
          ).trim().toLowerCase();

          if (!email && documento) {
            email = `usuario${documento}@example.com`;
          }

          const redConocimiento = String(
            getField(row, ["RED DE CONOCIMIENTO", "redConocimiento", "red_conocimiento"]) || ""
          ).trim();
          const areaTematica = String(
            getField(row, ["ÁREA TEMÁTICA", "AREA TEMATICA", "area_tematica", "areaTematica"]) || ""
          ).trim();
          const codigoArea = String(
            getField(row, ["codigoArea", "codigo", "codigo_area", "CODIGO_AREA"]) || ""
          ).trim();

          const area = await buscarArea([codigoArea, redConocimiento, areaTematica], transaction);

          if (!nombre || !email || !area) {
            const normalizedRow = getNormalizedRow(row);
            detalles.filasOmitidas += 1;
            detalles.errores.push(
              `Fila ${numeroFila}: faltan datos base o no se encontró el área/red (${redConocimiento || areaTematica || codigoArea || "sin referencia"}). Encabezados: ${Object.keys(normalizedRow).join(", ")}`
            );
            continue;
          }

          const filaKey = [
            email,
            documento,
            String(getField(row, ["DENOMINACIÓN DE LA CAPACITACIÓN", "DENOMINACION DE LA CAPACITACION", "denominacion_capacitacion"]) || "").trim(),
            String(getField(row, ["FECHA INICIO CAPACITACIÓN", "FECHA INICIO CAPACITACION", "fecha_inicio_cap"]) || "").trim(),
          ].join("|");

          if (filasProcesadas.has(filaKey)) {
            detalles.filasOmitidas += 1;
            detalles.errores.push(`Fila ${numeroFila}: registro duplicado dentro del archivo (${email})`);
            continue;
          }

          filasProcesadas.add(filaKey);

          let usuario = await Usuario.findOne({
            where: documento ? { [Op.or]: [{ email }, { documento }] } : { email },
            transaction,
          });

          if (!usuario) {
            usuario = await Usuario.create(
              {
                documento: documento || null,
                nombre,
                apellido: apellido || "",
                email,
                password: passwordHash,
                rol: String(getField(row, ["rol", "Rol"]) || "Formador").trim() || "Formador",
                areaId: area.id,
                regionalId: getField(row, ["regionalId", "COD_REGIONAL"]) || null,
                regionalNombre: getField(row, ["regionalNombre", "REGIONAL"]) || null,
                centroFormacionId: getField(row, ["centroFormacionId", "COD_CF"]) || null,
                centroNombre: getField(row, ["centroNombre", "CENTRO DE FORMACIÓN", "CENTRO DE FORMACION"]) || null,
                redConocimiento: redConocimiento || area.nombre,
              },
              { transaction }
            );
            detalles.usuariosCreados += 1;
          } else {
            await usuario.update(
              {
                documento: usuario.documento || documento || null,
                nombre: usuario.nombre || nombre,
                apellido: usuario.apellido || apellido || "",
                areaId: usuario.areaId || area.id,
                regionalId: usuario.regionalId || getField(row, ["regionalId", "COD_REGIONAL"]) || null,
                regionalNombre: usuario.regionalNombre || getField(row, ["regionalNombre", "REGIONAL"]) || null,
                centroFormacionId: usuario.centroFormacionId || getField(row, ["centroFormacionId", "COD_CF"]) || null,
                centroNombre: usuario.centroNombre || getField(row, ["centroNombre", "CENTRO DE FORMACIÓN", "CENTRO DE FORMACION"]) || null,
                redConocimiento: usuario.redConocimiento || redConocimiento || area.nombre,
              },
              { transaction }
            );
            detalles.usuariosReutilizados += 1;
          }

          const planInfo = parsePlanMultiplicacion(
            getField(row, [
              'OPCIÓN PLAN DE MULTIPLICACIÓN \nACTA DE COMPROMISO',
              'OPCIÓN PLAN DE MULTIPLICACIÓN ACTA DE COMPROMISO',
              'OPCION PLAN DE MULTIPLICACION ACTA DE COMPROMISO',
              'opcion_plan_multiplicacion',
            ])
          );

          const payloadCapacitacion = {
            usuarioId: usuario.id,
            denominacion_capacitacion: getField(row, ["DENOMINACIÓN DE LA CAPACITACIÓN", "DENOMINACION DE LA CAPACITACION", "denominacion_capacitacion"]),
            fecha_inicio_cap: parseDateValue(getField(row, ["FECHA INICIO CAPACITACIÓN", "FECHA INICIO CAPACITACION", "fecha_inicio_cap"])),
            fecha_fin_cap: parseDateValue(getField(row, ["FECHA FIN CAPACITACIÓN", "FECHA FIN CAPACITACION", "fecha_fin_cap"])),
            fecha_diligenciamiento: parseDateValue(getField(row, ["FECHA DILIGENCIAMIENTO DEL REPORTE PLAN DE MULTIPLICACIÓN", "FECHA DILIGENCIAMIENTO DEL REPORTE PLAN DE MULTIPLICACION", "fecha_diligenciamiento"])),
            opcion_plan_multiplicacion: planInfo.opcion,
            acta_compromiso: planInfo.acta,
            fecha_multiplicacion: parseDateValue(getField(row, ["FECHA EN LA QUE REALIZÓ LA MULTIPLICACIÓN", "FECHA EN LA QUE REALIZO LA MULTIPLICACION", "fecha_multiplicacion"])),
            validacion_plan: getField(row, ["VALIDACIÓN DEL PLAN DE MULTIPLICACIÓN EJECUTADO POR EL  INSTRUCTOR", "VALIDACION DEL PLAN DE MULTIPLICACION EJECUTADO POR EL INSTRUCTOR", "validacion_plan"]),
            nombre_delegado_seguimiento: getField(row, ["NOMBRE SUBDIRECTOR O DELEGADO QUE HACE EL SEGUIMIENTO AL PLAN DE MULTIPLICACIÓN", "NOMBRE SUBDIRECTOR O DELEGADO QUE HACE EL SEGUIMIENTO AL PLAN DE MULTIPLICACION", "nombre_delegado_seguimiento"]),
            descripcion_plan: getField(row, ["DESCRIBA BREVEMENTE PLAN DE MULTIPLICACIÓN", "DESCRIBA BREVEMENTE PLAN DE MULTIPLICACION", "descripcion_plan"]),
            link_evidencias: getField(row, ["LINK EVIDENCIAS PARA CONSULTA", "link_evidencias"]),
          };

          const tieneDatosCapacitacion = Object.entries(payloadCapacitacion)
            .some(([key, value]) => key !== "usuarioId" && value !== null && value !== undefined && String(value).trim() !== "");

          if (!tieneDatosCapacitacion) {
            continue;
          }

          const inscripcionExistente = await InscripcionCapacitacion.findOne({
            where: {
              usuarioId: usuario.id,
              denominacion_capacitacion: payloadCapacitacion.denominacion_capacitacion || null,
              fecha_inicio_cap: payloadCapacitacion.fecha_inicio_cap || null,
            },
            transaction,
          });

          if (!inscripcionExistente) {
            await InscripcionCapacitacion.create(payloadCapacitacion, { transaction });
            detalles.inscripcionesCreadas += 1;
          }
        }

        return detalles;
      });

      if (resultado.usuariosCreados === 0 && resultado.inscripcionesCreadas === 0) {
        return res.status(400).json({
          mensaje: "No se encontraron usuarios válidos para importar",
          detalles: resultado,
        });
      }

      res.json({
        mensaje: `Importación completada: ${resultado.usuariosCreados} usuarios nuevos, ${resultado.usuariosReutilizados} existentes, ${resultado.inscripcionesCreadas} inscripciones de capacitación`,
        detalles: resultado,
      });
    } catch (err) {
      console.error("Error al procesar importación masiva:", err);
      res.status(500).json({ mensaje: "Error al importar usuarios", error: err.message });
    }
  }
);


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

    const usuariosConEstadoPassword = await Promise.all(
      usuarios.map(async (usuario) => ({
        ...usuario.toJSON(),
        requiereCambioPassword: await hasTemporaryPassword(usuario),
      }))
    );

    return res.json(usuariosConEstadoPassword);
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

router.post("/cambiar-password", verifyToken, async (req, res) => {
  try {
    const { email, userId, passwordActual, nuevaPassword } = req.body;

    if ((!email && !userId) || !nuevaPassword) {
      return res.status(400).json({
        mensaje: "Debes indicar el usuario (email o userId) y la nueva contraseña"
      });
    }

    if (nuevaPassword.length < 6) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener al menos 6 caracteres"
      });
    }

    // Ya no se bloquea TEMP_PASSWORD porque ya no se usa
    const usuario = userId
      ? await Usuario.findByPk(userId)
      : await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(404).json({
        mensaje: "No existe el usuario indicado"
      });
    }

    const esMismoUsuario = Number(req.usuario.id) === Number(usuario.id);
    const esAdmin = req.usuario.rol === "Administrador";

    if (!esMismoUsuario && !esAdmin) {
      return res.status(403).json({
        mensaje: "No tienes permisos para cambiar la contraseña de este usuario"
      });
    }

    if (!esAdmin) {
      if (!passwordActual) {
        return res.status(400).json({
          mensaje: "La contraseña actual es requerida"
        });
      }

      // Verificar contraseña actual: puede ser el documento o la contraseña guardada
      const documentoUsuario = usuario.documento || "";
      const passwordEsDocumento = passwordActual.trim() === documentoUsuario.trim();
      
      let passwordValida = false;
      if (passwordEsDocumento) {
        // Si ingresa su documento, es válido
        passwordValida = true;
      } else if (usuario.password.startsWith("$2a$") || usuario.password.startsWith("$2b$")) {
        // O verifica contra la contraseña hasheada existente
        passwordValida = await bcrypt.compare(passwordActual, usuario.password);
      } else {
        passwordValida = passwordActual === usuario.password;
      }

      if (!passwordValida) {
        return res.status(401).json({
          mensaje: "La contraseña actual es incorrecta"
        });
      }
    }

    const passwordHash = await bcrypt.hash(nuevaPassword, 10);

    await usuario.update({ password: passwordHash });

    if (!esMismoUsuario) {
      return res.status(200).json({
        mensaje: "Contraseña actualizada correctamente"
      });
    }

    const authData = await buildAuthPayload(usuario);
    const token = jwt.sign(authData.tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    res.status(200).json({
      mensaje: "Contraseña actualizada correctamente",
      token,
      requiereCambioPassword: authData.requiereCambioPassword,
      usuario: authData.responseBody,
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

    const {
      descripcion = "",
      nombreCarpeta = "",
      nombreCarpetaPrincipal = "",
    } = req.body;
    const archivosSubidos = req.files || [];

    if (archivosSubidos.length === 0) {
      return res.status(400).json({
        mensaje: "Debes subir al menos un archivo PDF",
      });
    }

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

    let enlacesArchivos = [];
    let evidenciasLink = null;
    let storageMode = "google-drive";
    const driveRequired = process.env.GOOGLE_DRIVE_REQUIRED === "true";

    try {
      const driveResult = await uploadEvidenciasToDrive(archivosSubidos, nombreUsuario, {
        userFolderName: nombreCarpeta,
        mainFolderName: nombreCarpetaPrincipal,
      });
      evidenciasLink = driveResult.folderLink;
      enlacesArchivos = (driveResult.files || []).map((item) => item.url).filter(Boolean);
    } catch (driveError) {
      if (driveRequired) {
        return res.status(503).json({
          mensaje:
            "No fue posible subir a Google Drive y el modo estricto está activo. Contacta al administrador para credenciales OAuth/Drive válidas.",
          error: driveError.message,
        });
      }

      console.warn("Google Drive no disponible. Se usa almacenamiento local:", driveError.message);
      storageMode = "local";

      enlacesArchivos = await Promise.all(
        archivosSubidos.map(async (file) => {
          const safeName = file.originalname.replace(/\s+/g, "-");
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
          const fullPath = path.join(uploadDirEvidencias, unique);

          await fs.promises.writeFile(fullPath, file.buffer);

          const relativePath = path.relative(process.cwd(), fullPath);
          return relativePath.replace(/\\/g, "/");
        })
      );
    }

    // Registrar cada evidencia en la tabla de archivos para su posterior revisión en Monitoría.
    const archivosDbPayload = archivosSubidos.map((file, index) => ({
      usuarioId: req.usuario.id,
      nombre: file.originalname,
      ruta: enlacesArchivos[index] || `uploads/evidencias/${file.originalname}`,
      tipo: file.mimetype || "application/pdf",
      tamaño: file.size || null,
      descripcion: descripcion || null,
      estado: "pendiente",
      fechaCarga: new Date(),
    }));

    await Archivo.bulkCreate(archivosDbPayload);

    const notificacionArchivosPayload = {
      sourceUserId: req.usuario.id,
      sourceUserName: nombreUsuario,
      folderLink: evidenciasLink || null,
      files: enlacesArchivos,
    };

    await Notificacion.bulkCreate(
      admins.map((admin) => ({
        usuarioId: admin.id,
        areaId: null,
        asunto,
        mensaje,
        archivos: JSON.stringify(notificacionArchivosPayload),
      }))
    );

    return res.json({
      mensaje:
        storageMode === "google-drive"
          ? `Evidencia subida correctamente a Google Drive. Se ha notificado a ${admins.length} administrador(es).`
          : `Evidencia subida correctamente en almacenamiento local (Google Drive no disponible). Se ha notificado a ${admins.length} administrador(es).`,
      storageMode,
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

    // Si la notificación corresponde a evidencias y quien la lee es admin,
    // marcar dichas evidencias como aprobadas para dejar al día al formador.
    if (req.usuario.rol === "Administrador") {
      let payload = null;
      try {
        payload = notif.archivos ? JSON.parse(notif.archivos) : null;
      } catch (e) {
        payload = null;
      }

      const sourceUserId = Number(payload?.sourceUserId);
      const files = Array.isArray(payload?.files) ? payload.files.filter(Boolean) : [];

      if (Number.isInteger(sourceUserId) && sourceUserId > 0) {
        const where = {
          usuarioId: sourceUserId,
          estado: "pendiente",
        };

        if (files.length > 0) {
          where.ruta = { [Op.in]: files };
        }

        await Archivo.update(
          { estado: "aprobado" },
          { where }
        );

        // Notificar al formador que su evidencia fue aprobada por el administrador.
        await Notificacion.create({
          usuarioId: sourceUserId,
          areaId: null,
          asunto: "✅ Evidencia aprobada",
          mensaje: "Su evidencia a sido aprobada por el administrador",
          leida: 0,
          creadaEn: new Date(),
        });
      }
    }

    res.json({ mensaje: "Notificación marcada como leída" });
  } catch (err) {
    console.error("Error al marcar notificación como leída:", err);
    res
      .status(500)
      .json({ mensaje: "Error al actualizar notificación" });
  }
});

// Eliminar una notificación del usuario autenticado
router.delete("/notificaciones/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const totalEliminadas = await Notificacion.destroy({
      where: {
        id,
        usuarioId: req.usuario.id,
      },
    });

    if (!totalEliminadas) {
      return res.status(404).json({ mensaje: "Notificación no encontrada" });
    }

    res.json({ mensaje: "Notificación eliminada correctamente" });
  } catch (err) {
    console.error("Error al eliminar notificación:", err);
    res.status(500).json({ mensaje: "Error al eliminar notificación" });
  }
});

// Eliminar todas las notificaciones del usuario autenticado
router.delete("/notificaciones/eliminar-todas", verifyToken, async (req, res) => {
  try {
    const totalEliminadas = await Notificacion.destroy({
      where: { usuarioId: req.usuario.id },
    });

    res.json({
      mensaje: "Notificaciones eliminadas correctamente",
      totalEliminadas,
    });
  } catch (err) {
    console.error("Error al eliminar todas las notificaciones:", err);
    res.status(500).json({ mensaje: "Error al eliminar notificaciones" });
  }
});


export default router;
