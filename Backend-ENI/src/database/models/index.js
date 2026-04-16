import { Usuario } from "./usuarios.js";
import { Area } from "./area.js";
import { Curso } from "./cursos.js";
import { Inscripcion } from "./inscripciones.js";
import { Archivo } from "./archivos.js";
import { InscripcionCapacitacion } from "./inscripciones_capacitacion.js";
import { Reporte } from "./reportes.js";

// --- RELACIÓN 1 (Área) a MUCHOS (Instructores/Usuarios) ---
Area.hasMany(Usuario, { foreignKey: "areaId", as: "instructores" });
Usuario.belongsTo(Area, { foreignKey: "areaId", as: "area" });

// --- RELACIÓN 1 (Área) a MUCHOS (Cursos) ---
Area.hasMany(Curso, { foreignKey: "areaId", as: "cursos" });
Curso.belongsTo(Area, { foreignKey: "areaId", as: "area" });

// --- RELACIÓN 1 (Usuario) a MUCHOS (Cursos) ---
Usuario.hasMany(Curso, { foreignKey: "usuarioId", as: "cursosCreados" });
Curso.belongsTo(Usuario, { foreignKey: "usuarioId", as: "creador" });

// --- RELACIÓN 1 (Usuario) a MUCHOS (Archivos) ---
Usuario.hasMany(Archivo, { foreignKey: "usuarioId", as: "archivos" });
Archivo.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });

// --- RELACIÓN 1 (Usuario) a MUCHOS (Inscripciones Capacitación) ---
Usuario.hasMany(InscripcionCapacitacion, { foreignKey: "usuarioId", as: "inscripcionesCapacitacion" });
InscripcionCapacitacion.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });

// --- RELACIÓN 1 (Usuario) a MUCHOS (Reportes) ---
Usuario.hasMany(Reporte, { foreignKey: "usuarioId", as: "reportes" });
Reporte.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });

export { Usuario, Area, Curso, Inscripcion, Archivo, InscripcionCapacitacion, Reporte };
