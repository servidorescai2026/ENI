import { Usuario } from "../database/models/usuarios.js";
import { Archivo } from "../database/models/archivos.js";
import { Curso } from "../database/models/cursos.js";
import { Area } from "../database/models/area.js";
import { sequelize } from "../database/config.js";
import { QueryTypes } from "sequelize";
import ExcelJS from "exceljs";

/**
 * Parsea una fecha asegurándose de que sea a medianoche local.
 */
export const parseDateOnlyAsLocal = (value) => {
    if (!value) return null;

    let date;
    if (value instanceof Date) {
        date = new Date(value);
    } else {
        date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) return null;
    
    date.setHours(0, 0, 0, 0);
    return date;
};

/**
 * Calcula el estado de monitoría para un instructor basado en sus cursos y evidencias.
 */
export const buildMonitoriaStatus = (cursosAsignados = [], evidencias = [], fechaActual, primerDiaMes) => {
    const fechasFinCursos = cursosAsignados
        .map((curso) => parseDateOnlyAsLocal(curso?.fechaFin))
        .filter(Boolean);

    const fechaFinMasReciente = fechasFinCursos.length > 0
        ? new Date(Math.max(...fechasFinCursos.map((fecha) => fecha.getTime())))
        : null;

    const evidenciasEsteMes = evidencias.filter((evidencia) => {
        const fechaCarga = parseDateOnlyAsLocal(evidencia.fechaCarga);
        return fechaCarga && fechaCarga >= primerDiaMes;
    });

    const evidenciasPendientes = evidencias.filter((evidencia) => String(evidencia.estado || "").toLowerCase() === "pendiente").length;
    const evidenciasRechazadas = evidencias.filter((evidencia) => String(evidencia.estado || "").toLowerCase() === "rechazado").length;

    let estado = "al-dia";
    if (cursosAsignados.length === 0) {
        estado = "al-dia";
    } else if (evidenciasPendientes > 0) {
        estado = "pendiente-revision";
    } else if (evidenciasRechazadas > 0) {
        estado = "rechazado";
    } else if (fechaFinMasReciente && fechaFinMasReciente <= fechaActual) {
        const tieneEvidenciaPosterior = evidencias.some((evidencia) => {
            const fechaCarga = parseDateOnlyAsLocal(evidencia.fechaCarga);
            return fechaCarga && fechaCarga >= fechaFinMasReciente;
        });

        if (!tieneEvidenciaPosterior) {
            estado = "pendiente";
        }
    }

    const diasEnDeuda = (estado === "pendiente" || estado === "pendiente-revision") && fechaFinMasReciente
        ? Math.max(0, Math.floor((fechaActual - fechaFinMasReciente) / (1000 * 60 * 60 * 24)))
        : null;

    return {
        estado,
        diasEnDeuda,
        totalEvidencias: evidencias.length,
        evidenciasEsteMes: evidenciasEsteMes.length,
        evidenciasPendientes,
        evidenciasRechazadas
    };
};

/**
 * Genera la data necesaria para la monitoría de todos los formadores.
 */
export const getMonitoriaData = async () => {
    const usuarios = await Usuario.findAll();
    const evidencias = await Archivo.findAll();
    const cursos = await Curso.findAll();
    const areas = await Area.findAll();

    const relacionesCursos = await sequelize.query(
        "SELECT usuarioId, cursoId FROM cursos_usuarios",
        { type: QueryTypes.SELECT }
    );

    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);
    const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);

    const cursosPorId = new Map(cursos.map((c) => [Number(c.id), c.toJSON()]));
    const areasPorId = new Map(areas.map((a) => [Number(a.id), a.toJSON()]));

    const cursosPorUsuario = new Map();
    relacionesCursos.forEach((rel) => {
        const curso = cursosPorId.get(Number(rel.cursoId));
        if (!curso) return;
        if (!cursosPorUsuario.has(Number(rel.usuarioId))) {
            cursosPorUsuario.set(Number(rel.usuarioId), []);
        }
        cursosPorUsuario.get(Number(rel.usuarioId)).push(curso);
    });

    const evidenciasPorUsuario = new Map();
    evidencias.forEach((e) => {
        if (!evidenciasPorUsuario.has(Number(e.usuarioId))) {
            evidenciasPorUsuario.set(Number(e.usuarioId), []);
        }
        evidenciasPorUsuario.get(Number(e.usuarioId)).push(e.toJSON());
    });

    return usuarios
        .map((usuario) => {
            const u = usuario.toJSON();
            if (!String(u.rol || "").toLowerCase().includes("formador")) return null;

            const cursosAsignados = cursosPorUsuario.get(Number(u.id)) || [];
            const evidenciasUsuario = evidenciasPorUsuario.get(Number(u.id)) || [];
            const area = areasPorId.get(Number(u.areaId));

            const monitoria = buildMonitoriaStatus(cursosAsignados, evidenciasUsuario, fechaActual, primerDiaMes);

            return {
                id: u.id,
                documento: u.documento,
                nombre: u.nombre,
                apellido: u.apellido,
                email: u.email,
                areaId: u.areaId,
                areaNombre: area ? area.nombre : "N/A",
                cursosAsignados: cursosAsignados.length,
                ...monitoria
            };
        })
        .filter(Boolean);
};

/**
 * Genera un buffer de Excel con el reporte de monitoría.
 */
export const generateMonitoriaExcel = async () => {
    const data = await getMonitoriaData();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Monitoria de Formadores");

    // Estilos
    const headerStyle = {
        font: { bold: true, color: { argb: "FFFFFF" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "2F5597" } },
        alignment: { horizontal: "center", vertical: "middle" },
        border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }
    };

    const cellStyle = {
        alignment: { vertical: "middle" },
        border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }
    };

    // Título
    sheet.mergeCells("A1:J1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "REPORTE DE MONITORÍA DE FORMADORES";
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: "center" };
    sheet.getRow(1).height = 30;

    // Encabezados
    const headers = ["DOCUMENTO", "INSTRUCTOR", "EMAIL", "ÁREA", "EVIDENCIAS", "MES", "DÍAS DEUDA", "PENDIENTES", "RECHAZADAS", "ESTADO"];
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => { cell.style = headerStyle; });
    headerRow.height = 25;

    // Configuración de columnas
    sheet.columns = [
        { key: "documento", width: 15 },
        { key: "instructor", width: 30 },
        { key: "email", width: 25 },
        { key: "area", width: 25 },
        { key: "evidencias", width: 12 },
        { key: "mes", width: 8 },
        { key: "deuda", width: 12 },
        { key: "pendientes", width: 12 },
        { key: "rechazadas", width: 12 },
        { key: "estado", width: 15 }
    ];

    // Filas de datos
    data.forEach((f) => {
        const rowData = [
            f.documento || "N/A",
            `${f.nombre} ${f.apellido}`,
            f.email,
            f.areaNombre,
            f.totalEvidencias,
            f.evidenciasEsteMes,
            f.diasEnDeuda || 0,
            f.evidenciasPendientes,
            f.evidenciasRechazadas || 0,
            f.estado === 'pendiente' ? 'Pendiente' : f.estado === 'pendiente-revision' ? 'En Revisión' : f.estado === 'rechazado' ? 'Rechazado' : 'Al día'
        ];
        const row = sheet.addRow(rowData);
        row.eachCell((cell) => {
            cell.border = cellStyle.border;
            cell.alignment = cellStyle.alignment;
        });

        if (f.diasEnDeuda > 0) {
            row.getCell(7).font = { color: { argb: "FF0000" }, bold: true };
        }
    });

    sheet.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: headers.length } };

    return await workbook.xlsx.writeBuffer();
};
