import { Usuario } from "./usuarios.js";
import { Area } from "./area.js";
import { Curso } from "./cursos.js";
import { Inscripcion } from "./inscripciones.js";
import { Archivo } from "./archivos.js";

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

export { Usuario, Area, Curso, Inscripcion, Archivo };
