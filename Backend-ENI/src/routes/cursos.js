import express from "express";
import { Curso } from "../database/models/cursos.js";
import { Area } from "../database/models/area.js";
import { Usuario } from "../database/models/usuarios.js";
import { Inscripcion } from "../database/models/inscripciones.js";
import { Archivo } from "../database/models/archivos.js";
import { Notificacion } from "../database/models/notificacion.js";
import { sequelize } from "../database/config.js";
import { Op, QueryTypes } from "sequelize";
import verifyToken from "../middleware/verifyToken.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import multer from "multer";
import ExcelJS from "exceljs";
import * as monitoriaService from "../services/monitoriaService.js";

const router = express.Router();
const uploadExcel = multer({ storage: multer.memoryStorage() });

const courseAttributes = [
  "id",
  "nombre",
  "descripcion",
  "duracion",
  "categoria",
  "nivel",
  "areaId",
  "usuarioId",
  "fechaInicio",
  "fechaFin",
  "tipoLanzamiento",
  "maxPersonas",
  "fechaCierreInscripcion",
  "centroFormacion",
  "redConocimiento",
  "areaTematica",
  "competenciaPic",
  "modalidad",
  "estrategia",
  "tipoCapacitacion",
  "claseCapacitacion",
  "entidadCapacitadora",
  "codigoPrograma",
  "codigoCapacitacion",
  "nombreFormador",
  "fechaInicioPresencial",
  "fechaFinPresencial",
  "horario",
  "lugarCapacitacion",
  "created_at",
  "updated_at",
];

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

const normalizeEnumValue = (value, allowedValues) => {
  const text = String(value || "").trim();
  if (!text) return null;

  const normalized = normalizeText(text);
  return allowedValues.find((item) => normalizeText(item) === normalized) || null;
};

const inferDescription = (payload) => {
  const parts = [
    payload.nombre,
    payload.tipoCapacitacion,
    payload.modalidad,
    payload.lugarCapacitacion,
  ].filter(Boolean);
  return parts.join(" | ");
};

const buildAreaIndex = (areas) =>
  areas.map((area) => ({
    area,
    codigo: normalizeText(area.codigo),
    nombre: normalizeText(area.nombre),
  }));

const resolveAreaByRed = (redConocimiento, indexedAreas) => {
  const normalizedHint = normalizeText(redConocimiento);
  if (!normalizedHint) return null;

  const compactHint = normalizedHint
    .replace(/^red de /, "")
    .replace(/^red /, "")
    .replace(/^area de /, "")
    .replace(/^area /, "");

  const exactMatch = indexedAreas.find(
    ({ codigo, nombre }) =>
      codigo === normalizedHint ||
      nombre === normalizedHint ||
      nombre === `red de ${compactHint}` ||
      nombre.endsWith(compactHint)
  );
  if (exactMatch) return exactMatch.area;

  const fuzzyMatch = indexedAreas.find(
    ({ codigo, nombre }) =>
      codigo.includes(compactHint) ||
      nombre.includes(compactHint) ||
      compactHint.includes(nombre.replace(/^red de /, ""))
  );

  return fuzzyMatch ? fuzzyMatch.area : null;
};

const buildEvidenceStatuses = (curso, usuarios, evidencias) => {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  const fechaFin = curso.fechaFin ? new Date(curso.fechaFin) : null;
  if (fechaFin) {
    fechaFin.setHours(0, 0, 0, 0);
  }

  const evidenciasPorUsuario = evidencias.reduce((acc, evidencia) => {
    const userId = Number(evidencia.usuarioId);
    if (!acc.has(userId)) {
      acc.set(userId, []);
    }
    acc.get(userId).push(evidencia);
    return acc;
  }, new Map());

  const usuariosEstado = usuarios.map((usuario) => {
    const archivosUsuario = evidenciasPorUsuario.get(Number(usuario.id)) || [];
    const evidenciasPosteriores = fechaFin
      ? archivosUsuario.filter((item) => {
        const fechaCarga = item.fechaCarga ? new Date(item.fechaCarga) : null;
        if (!fechaCarga || Number.isNaN(fechaCarga.getTime())) return false;
        fechaCarga.setHours(0, 0, 0, 0);
        return fechaCarga >= fechaFin;
      })
      : archivosUsuario;

    let estado = "curso_vigente";

    if (fechaFin && fechaFin <= now) {
      if (evidenciasPosteriores.some((item) => item.estado === "pendiente")) {
        estado = "pendiente_revision";
      } else if (evidenciasPosteriores.some((item) => item.estado === "rechazado")) {
        estado = "rechazada";
      } else if (evidenciasPosteriores.some((item) => item.estado === "aprobado" || item.estado === "pendiente" || item.estado === "rechazado")) {
        estado = "cumplio";
      } else {
        estado = "pendiente";
      }
    }

    const ultimaEvidencia = evidenciasPosteriores
      .slice()
      .sort((a, b) => new Date(b.fechaCarga) - new Date(a.fechaCarga))[0];

    return {
      usuarioId: usuario.id,
      nombre: [usuario.nombre, usuario.apellido].filter(Boolean).join(" ").trim(),
      email: usuario.email,
      estado,
      fechaFinCurso: curso.fechaFin,
      ultimaEvidencia: ultimaEvidencia
        ? {
          id: ultimaEvidencia.id,
          nombre: ultimaEvidencia.nombre,
          estado: ultimaEvidencia.estado,
          fechaCarga: ultimaEvidencia.fechaCarga,
        }
        : null,
    };
  });

  return {
    usuarios: usuariosEstado,
    resumen: {
      total: usuariosEstado.length,
      cursoVigente: usuariosEstado.filter((item) => item.estado === "curso_vigente").length,
      cumplio: usuariosEstado.filter((item) => item.estado === "cumplio").length,
      pendiente: usuariosEstado.filter((item) => item.estado === "pendiente").length,
      pendienteRevision: usuariosEstado.filter((item) => item.estado === "pendiente_revision").length,
      rechazada: usuariosEstado.filter((item) => item.estado === "rechazada").length,
    },
  };
};


const splitFullName = (fullName = "") => {
  const cleanName = String(fullName || "").trim().replace(/\s+/g, " ");
  if (!cleanName) {
    return { nombre: null, apellido: null };
  }

  const parts = cleanName.split(" ");
  if (parts.length === 1) {
    return { nombre: parts[0], apellido: null };
  }

  return {
    nombre: parts.slice(0, 2).join(" "),
    apellido: parts.slice(2).join(" ") || parts[parts.length - 1],
  };
};

const normalizeMonitoriaStatus = (value = "") => {
  const text = normalizeText(value);
  if (!text) return null;

  if (text.includes("rechaz")) return "rechazado";
  if (text.includes("pendient") && text.includes("revision")) return "pendiente_revision";
  if (text.includes("pendient")) return "pendiente";
  if (text.includes("aprob") || text.includes("cumpl") || text.includes("entreg")) return "al-dia";
  return null;
};

const isEvidenceAfterCourseEnd = (evidencias = [], fechaFinCurso) => {
  if (!fechaFinCurso) return false;

  return evidencias.some((item) => {
    const fechaCarga = parseDateOnlyAsLocal(item.fechaCarga);
    return fechaCarga && fechaCarga >= fechaFinCurso;
  });
};

const resolveUsuarioFromRow = async (row) => {
  const documento = String(getField(row, [
    "documento",
    "DOCUMENTO",
    "N° Documento del Participante",
    "N DOCUMENTO DEL PARTICIPANTE",
    "Documento del Participante",
    "id",
  ]) || "").trim();

  const email = String(getField(row, ["correo", "correo sena", "email", "mail"]) || "").trim().toLowerCase();
  const nombreCompleto = String(getField(row, [
    "Nombres y Apellidos del Participante",
    "NOMBRE INSTRUCTOR",
    "Nombre Instructor",
    "Nombre del Participante",
  ]) || "").trim();

  if (documento || email) {
    return Usuario.findOne({
      where: {
        [Op.or]: [
          ...(documento ? [{ documento }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
    });
  }

  if (nombreCompleto) {
    const { nombre, apellido } = splitFullName(nombreCompleto);
    return Usuario.findOne({
      where: apellido
        ? {
          [Op.and]: [
            { nombre: { [Op.like]: `%${nombre}%` } },
            { apellido: { [Op.like]: `%${apellido}%` } },
          ],
        }
        : {
          nombre: { [Op.like]: `%${nombre}%` },
        },
    });
  }

  return null;
};

const resolveCursoFromRow = async (row) => {
  const codigoCapacitacion = String(getField(row, [
    "Código de Capacitación",
    "Codigo de Capacitacion",
    "CODIGO CAPACITACION",
    "codigo_capacitacion",
  ]) || "").trim();

  const nombreCurso = String(getField(row, [
    "Denominación de la Capacitación",
    "DENOMINACIÓN DE LA CAPACITACIÓN",
    "DENOMINACION DE LA CAPACITACION",
    "Curso",
    "CURSO",
  ]) || "").trim();

  if (codigoCapacitacion) {
    const cursoPorCodigo = await Curso.findOne({ where: { codigoCapacitacion } });
    if (cursoPorCodigo) {
      return cursoPorCodigo;
    }
  }

  if (nombreCurso) {
    const cursoPorNombre = await Curso.findOne({ where: { nombre: nombreCurso } });
    if (cursoPorNombre) {
      return cursoPorNombre;
    }

    const cursoLike = await Curso.findOne({
      where: {
        nombre: {
          [Op.like]: `%${nombreCurso}%`,
        },
      },
    });

    if (cursoLike) {
      return cursoLike;
    }
  }

  return null;
};

// GET /api/cursos - Obtener todos los cursos (sin autenticación requerida)
router.get("/", async (req, res) => {
  try {
    const cursos = await Curso.findAll({
      order: [['created_at', 'DESC']],
      attributes: courseAttributes,
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
      attributes: courseAttributes,
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

router.post("/upload-bulk", verifyAdmin, uploadExcel.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: "Debes adjuntar un archivo Excel o CSV" });
    }

    const notifyUsers = String(req.body.notifyUsers || "false").toLowerCase() === "true";
    const notificationMessage = String(req.body.notificationMessage || "").trim();
    const workbook = xlsx.read(req.file.buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const matrix = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: "",
      blankrows: false,
    });

    const expectedHeaders = [
      "denominacion de la capacitacion",
      "red de conocimiento",
      "fecha inicio capacitacion",
      "fecha fin capacitacion",
      "codigo de capacitacion",
      "nombre formador",
    ];

    const headerRowIndex = matrix.findIndex((row) => {
      const normalizedCells = row.map((cell) => normalizeText(cell));
      const matches = expectedHeaders.filter((header) => normalizedCells.includes(header)).length;
      return matches >= 3;
    });

    if (headerRowIndex === -1) {
      return res.status(400).json({
        mensaje: "No se encontró una fila de encabezados válida en el Excel de cursos",
        detalles: { encabezadosDetectados: matrix.slice(0, 5) },
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

    if (!rows.length) {
      return res.status(400).json({ mensaje: "El archivo está vacío" });
    }

    const areas = await Area.findAll({ attributes: ["id", "codigo", "nombre"] });
    const indexedAreas = buildAreaIndex(areas);
    const usuarios = await Usuario.findAll({
      attributes: ["id", "nombre", "apellido", "email", "areaId", "redConocimiento"],
    });

    const usuariosIndexados = usuarios.map((usuario) => ({
      ...usuario.toJSON(),
      normalizedRed: normalizeText(usuario.redConocimiento),
    }));

    const detalles = {
      cursosCreados: 0,
      cursosActualizados: 0,
      filasOmitidas: 0,
      usuariosVinculados: 0,
      notificacionesEnviadas: 0,
      errores: [],
      advertencias: [],
      encabezadosDetectados: rawHeaders,
      filaEncabezados: headerRowIndex + 1,
      cursos: [],
    };

    await sequelize.transaction(async (transaction) => {
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const numeroFila = headerRowIndex + index + 2;

        const nombre = String(getField(row, ["Denominación de la Capacitación", "Denominacion de la Capacitacion", "nombre"]) || "").trim();
        const redConocimiento = String(getField(row, ["Red de Conocimiento", "red_conocimiento"]) || "").trim();
        const fechaInicio = parseDateValue(getField(row, ["Fecha Inicio Capacitación", "Fecha Inicio Capacitacion", "fecha_inicio"]));
        const fechaFin = parseDateValue(getField(row, ["Fecha Fin Capacitación", "Fecha Fin Capacitacion", "fecha_fin"]));

        if (!nombre || !redConocimiento || !fechaInicio || !fechaFin) {
          detalles.filasOmitidas += 1;
          detalles.errores.push(`Fila ${numeroFila}: nombre, red de conocimiento, fecha de inicio y fecha de fin son obligatorios.`);
          continue;
        }

        if (fechaFin < fechaInicio) {
          detalles.filasOmitidas += 1;
          detalles.errores.push(`Fila ${numeroFila}: la fecha de fin no puede ser menor a la fecha de inicio.`);
          continue;
        }

        const fechaInicioPresencial = parseDateValue(getField(row, ["Fecha Inicio Fase Presencial", "fecha_inicio_presencial"]));
        const fechaFinPresencial = parseDateValue(getField(row, ["Fecha Fin Fase Presencial", "fecha_fin_presencial"]));
        if (fechaInicioPresencial && fechaFinPresencial && fechaFinPresencial < fechaInicioPresencial) {
          detalles.filasOmitidas += 1;
          detalles.errores.push(`Fila ${numeroFila}: la fase presencial tiene fechas inconsistentes.`);
          continue;
        }

        const modalidad = normalizeEnumValue(getField(row, ["Modalidad", "modalidad"]), ["Presencial", "Mixta"]);
        if (getField(row, ["Modalidad", "modalidad"]) && !modalidad) {
          detalles.filasOmitidas += 1;
          detalles.errores.push(`Fila ${numeroFila}: la modalidad debe ser Presencial o Mixta.`);
          continue;
        }

        const entidadCapacitadora = normalizeEnumValue(getField(row, ["Entidad Capacitadora", "entidad_capacitadora"]), ["SIEMENS", "SENA"]);
        if (getField(row, ["Entidad Capacitadora", "entidad_capacitadora"]) && !entidadCapacitadora) {
          detalles.filasOmitidas += 1;
          detalles.errores.push(`Fila ${numeroFila}: la entidad capacitadora debe ser SIEMENS o SENA.`);
          continue;
        }

        const area = resolveAreaByRed(redConocimiento, indexedAreas);
        if (!area) {
          detalles.filasOmitidas += 1;
          detalles.errores.push(`Fila ${numeroFila}: no se encontró una red/área asociada a "${redConocimiento}".`);
          continue;
        }

        const normalizedRed = normalizeText(redConocimiento);
        const usuariosAsignables = usuariosIndexados.filter((usuario) => {
          if (Number(usuario.areaId) === Number(area.id)) return true;
          return usuario.normalizedRed && usuario.normalizedRed === normalizedRed;
        });

        if (!usuariosAsignables.length) {
          detalles.advertencias.push(`Fila ${numeroFila}: no hay usuarios vinculables para la red "${redConocimiento}".`);
        }

        const codigoCapacitacion = String(getField(row, ["Código de Capacitación", "Codigo de Capacitacion", "codigo_capacitacion"]) || "").trim() || null;
        const payload = {
          nombre,
          descripcion: inferDescription({
            nombre,
            tipoCapacitacion: getField(row, ["Tipo de Capacitación", "Tipo de Capacitacion", "tipo_capacitacion"]),
            modalidad,
            lugarCapacitacion: getField(row, ["Ciudad de la Capacitación", "Ciudad de la Capacitacion", "lugar_capacitacion"]),
          }) || nombre,
          duracion: String(getField(row, ["Intensidad horaria", "duracion"]) || "0").trim() || "0",
          categoria: "Otro",
          nivel: "Básico",
          areaId: area.id,
          usuarioId: req.usuario.id,
          fechaInicio,
          fechaFin,
          tipoLanzamiento: "fecha",
          maxPersonas: null,
          fechaCierreInscripcion: fechaInicio,
          centroFormacion: String(getField(row, ["Centro de Formación del Participante", "Centro de Formacion del Participante", "centro_formacion"]) || "").trim() || null,
          redConocimiento,
          areaTematica: String(getField(row, ["Área Temática", "Area Tematica", "area_tematica"]) || "").trim() || null,
          competenciaPic: String(getField(row, ["Competencia del PIC", "competencia_pic"]) || "").trim() || null,
          modalidad,
          estrategia: String(getField(row, ["Estrategia", "estrategia"]) || "").trim() || null,
          tipoCapacitacion: String(getField(row, ["Tipo de Capacitación", "Tipo de Capacitacion", "tipo_capacitacion"]) || "").trim() || null,
          claseCapacitacion: String(getField(row, ["Clase de la Capacitación", "Clase de la Capacitacion", "clase_capacitacion"]) || "").trim() || null,
          entidadCapacitadora,
          codigoPrograma: String(getField(row, ["Código del programa", "Codigo del programa", "codigo_programa"]) || "").trim() || null,
          codigoCapacitacion,
          nombreFormador: String(getField(row, ["Nombre Formador", "nombre_formador"]) || "").trim() || null,
          fechaInicioPresencial,
          fechaFinPresencial,
          horario: String(getField(row, ["Horario de Capacitación", "Horario de Capacitacion", "horario"]) || "").trim() || null,
          lugarCapacitacion: String(getField(row, ["Ciudad de la Capacitación", "Ciudad de la Capacitacion", "lugar_capacitacion"]) || "").trim() || null,
        };

        let curso = null;

        if (codigoCapacitacion) {
          curso = await Curso.findOne({ where: { codigoCapacitacion }, transaction });
        }

        if (!curso) {
          curso = await Curso.findOne({
            where: {
              nombre,
              fechaInicio,
              nombreFormador: payload.nombreFormador,
            },
            transaction,
          });
        }

        if (curso) {
          await curso.update(payload, { transaction });
          detalles.cursosActualizados += 1;
        } else {
          curso = await Curso.create(payload, { transaction });
          detalles.cursosCreados += 1;
        }

        await sequelize.query("DELETE FROM cursos_usuarios WHERE cursoId = ?", {
          replacements: [curso.id],
          transaction,
        });

        for (const usuario of usuariosAsignables) {
          await sequelize.query(
            "INSERT INTO cursos_usuarios (cursoId, usuarioId) VALUES (?, ?)",
            {
              replacements: [curso.id, usuario.id],
              transaction,
            }
          );
        }

        detalles.usuariosVinculados += usuariosAsignables.length;

        const evidenciasCurso = usuariosAsignables.length
          ? await Archivo.findAll({
            where: {
              usuarioId: { [Op.in]: usuariosAsignables.map((usuario) => usuario.id) },
            },
            attributes: ["id", "usuarioId", "nombre", "estado", "fechaCarga"],
            transaction,
          })
          : [];

        const estadoEvidencias = buildEvidenceStatuses(curso, usuariosAsignables, evidenciasCurso);

        if (notifyUsers && usuariosAsignables.length) {
          const asunto = `Nueva capacitacion asignada: ${curso.nombre}`;
          const mensaje = notificationMessage || `Se te ha asignado la capacitacion ${curso.nombre}. Revisa sus fechas y prepara tu evidencia una vez finalice.`;
          await Notificacion.bulkCreate(
            usuariosAsignables.map((usuario) => ({
              usuarioId: usuario.id,
              areaId: usuario.areaId || area.id,
              asunto,
              mensaje,
            })),
            { transaction }
          );
          detalles.notificacionesEnviadas += usuariosAsignables.length;
        }

        detalles.cursos.push({
          id: curso.id,
          nombre: curso.nombre,
          codigoCapacitacion: curso.codigoCapacitacion,
          redConocimiento: curso.redConocimiento,
          areaId: curso.areaId,
          usuariosAsignados: usuariosAsignables.length,
          evidencia: {
            resumen: estadoEvidencias.resumen,
            usuarios: estadoEvidencias.usuarios.slice(0, 20),
          },
        });
      }
    });

    return res.json({
      mensaje: notifyUsers
        ? "Cursos importados y notificaciones enviadas correctamente"
        : "Cursos importados correctamente",
      detalles,
    });
  } catch (error) {
    console.error("Error al importar cursos:", error);
    return res.status(500).json({
      mensaje: "Error al importar cursos",
      detalles: { errores: [error.message] },
    });
  }
});

router.post("/monitoria/validar-excel", verifyAdmin, uploadExcel.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: "Debes adjuntar un archivo Excel o CSV" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const matrix = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: "",
      blankrows: false,
    });

    const headerRowIndex = matrix.findIndex((row) => {
      const normalizedCells = row.map((cell) => normalizeText(cell));
      const tienePersona = normalizedCells.some((cell) =>
        [
          "documento",
          "n° documento del participante",
          "n documento del participante",
          "nombre",
          "nombres y apellidos del participante",
          "correo",
          "email",
        ].includes(cell)
      );
      const tieneCurso = normalizedCells.some((cell) =>
        [
          "codigo capacitacion",
          "codigo de capacitacion",
          "denominacion de la capacitacion",
          "curso",
          "fecha fin",
          "fecha fin de capacitacion",
          "fecha fin curso",
          "estado",
        ].includes(cell)
      );

      return tienePersona && tieneCurso;
    });

    if (headerRowIndex === -1) {
      return res.status(400).json({
        mensaje: "No se encontró una fila de encabezados válida en el Excel de monitoría",
        detalles: { encabezadosDetectados: matrix.slice(0, 5) },
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

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const resultado = {
      total: rows.length,
      alDia: 0,
      pendiente: 0,
      pendienteRevision: 0,
      rechazado: 0,
      sinUsuario: 0,
      sinCurso: 0,
      sinFechaFin: 0,
    };

    const detalles = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const fila = index + headerRowIndex + 2;

      const usuario = await resolveUsuarioFromRow(row);
      const curso = await resolveCursoFromRow(row);
      const estadoExcel = normalizeMonitoriaStatus(getField(row, ["estado", "estado evidencia", "evidencia", "status"]));
      const fechaFinFila = parseDateOnlyAsLocal(getField(row, [
        "fecha fin",
        "fecha fin curso",
        "fecha fin de capacitacion",
        "fecha fin capacitación",
        "fecha_fin",
      ]));

      const fechaFinCurso = fechaFinFila
        || parseDateOnlyAsLocal(curso?.fechaFin)
        || parseDateOnlyAsLocal(curso?.fechaCierreInscripcion);

      let estado = estadoExcel || "al-dia";
      let observacion = [];

      if (!usuario) {
        resultado.sinUsuario += 1;
        observacion.push("No se encontró usuario en la base de datos");
      }

      if (!curso) {
        resultado.sinCurso += 1;
        observacion.push("No se encontró curso asociado en la base de datos");
      }

      if (!fechaFinCurso) {
        resultado.sinFechaFin += 1;
        observacion.push("No hay fecha de fin para calcular deuda");
      }

      if (!estadoExcel && usuario && fechaFinCurso) {
        const evidenciasUsuario = await Archivo.findAll({
          where: { usuarioId: usuario.id },
          attributes: ["id", "estado", "fechaCarga"],
        });

        const hayEvidenciaPosterior = isEvidenceAfterCourseEnd(evidenciasUsuario, fechaFinCurso);
        const hayPendiente = evidenciasUsuario.some((item) => normalizeText(item.estado) === "pendiente");
        const hayRechazada = evidenciasUsuario.some((item) => normalizeText(item.estado) === "rechazado");

        if (hayPendiente) {
          estado = "pendiente_revision";
        } else if (hayRechazada) {
          estado = "rechazado";
        } else if (fechaFinCurso <= hoy && !hayEvidenciaPosterior) {
          estado = "pendiente";
        } else {
          estado = "al-dia";
        }
      }

      let diasEnDeuda = null;
      if ((estado === "pendiente" || estado === "pendiente_revision") && fechaFinCurso) {
        diasEnDeuda = Math.max(0, Math.floor((hoy - fechaFinCurso) / (1000 * 60 * 60 * 24)));
      }

      if (estado === "al-dia") resultado.alDia += 1;
      if (estado === "pendiente") resultado.pendiente += 1;
      if (estado === "pendiente_revision") resultado.pendienteRevision += 1;
      if (estado === "rechazado") resultado.rechazado += 1;

      detalles.push({
        fila,
        documento: String(getField(row, ["documento", "DOCUMENTO", "N° Documento del Participante", "Documento del Participante"]) || "").trim(),
        nombre: [
          getField(row, ["nombre", "Nombre"]),
          getField(row, ["apellido", "Apellido"]),
        ]
          .filter(Boolean)
          .join(" ")
          .trim() || String(getField(row, ["Nombres y Apellidos del Participante", "Nombre del Participante"]) || "").trim(),
        email: String(getField(row, ["correo", "correo sena", "email"]) || "").trim(),
        curso: curso?.nombre || String(getField(row, ["Denominación de la Capacitación", "Curso", "CURSO"]) || "").trim(),
        fechaFin: fechaFinCurso ? fechaFinCurso.toISOString().slice(0, 10) : null,
        estado,
        diasEnDeuda,
        observacion: observacion.length ? observacion.join(" | ") : null,
      });
    }

    return res.json({
      mensaje: "Validación de monitoría completada",
      resumen: resultado,
      filas: detalles,
      encabezadosDetectados: rawHeaders,
      filaEncabezados: headerRowIndex + 1,
    });
  } catch (error) {
    console.error("Error validando monitoría desde Excel:", error);
    return res.status(500).json({
      mensaje: "Error al validar monitoría desde Excel",
      error: error.message,
    });
  }
});

// GET /api/cursos/monitoria/data - Obtener datos procesados para monitoría
router.get("/monitoria/data", verifyAdmin, async (req, res) => {
  try {
    const data = await monitoriaService.getMonitoriaData();
    res.json(data);
  } catch (error) {
    console.error("Error al obtener datos de monitoría:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/monitoria/reporte-excel", async (req, res) => {
  try {
    const buffer = await monitoriaService.generateMonitoriaExcel();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reporte_monitoria_${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    res.send(buffer);
  } catch (error) {
    console.error("Error al generar reporte Excel:", error);
    res.status(500).json({ error: error.message });
  }
});


router.get("/:id/evidencia-resumen", verifyAdmin, async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id, { attributes: courseAttributes });
    if (!curso) {
      return res.status(404).json({ error: "Curso no encontrado", code: "COURSE_NOT_FOUND" });
    }

    const usuarios = await sequelize.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.areaId
       FROM usuarios u
       INNER JOIN cursos_usuarios cu ON u.id = cu.usuarioId
       WHERE cu.cursoId = ?
       ORDER BY u.nombre ASC`,
      { replacements: [req.params.id], type: QueryTypes.SELECT }
    );

    const evidencias = usuarios.length
      ? await Archivo.findAll({
        where: { usuarioId: { [Op.in]: usuarios.map((usuario) => usuario.id) } },
        attributes: ["id", "usuarioId", "nombre", "estado", "fechaCarga"],
      })
      : [];

    const estadoEvidencias = buildEvidenceStatuses(curso, usuarios, evidencias);
    return res.json({
      curso,
      evidencia: estadoEvidencias,
    });
  } catch (error) {
    console.error("Error al obtener resumen de evidencias del curso:", error);
    return res.status(500).json({ error: "Error interno del servidor", code: "INTERNAL_ERROR" });
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
