import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import usuarioRoutes from "./routes/usuarios.js";
import cursoRoutes from "./routes/cursos.js";
import inscripcionRoutes from "./routes/inscripciones.js";
import archivoRoutes from "./routes/archivos.js";
import { conectarDB, sequelize } from "./database/config.js";
import areaRoutes from "./routes/areas.js";
import evidenciasRoutes from "./routes/evidencias.js";
import inscripcionesCapacitacionRoutes from "./routes/inscripciones_capacitacion.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

const app = express();
app.use(express.json());



app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}));

app.use("/uploads", express.static("uploads")); // para que puedas ver las imágenes subidas en la carpeta "uploads"

// Conectar a BD
conectarDB();

const ensureCourseColumns = async () => {
  const tableDefinition = await sequelize.getQueryInterface().describeTable("cursos");
  const columnDefinitions = {
    centro_formacion: "VARCHAR(255) NULL",
    red_conocimiento: "VARCHAR(255) NULL",
    area_tematica: "VARCHAR(255) NULL",
    competencia_pic: "TEXT NULL",
    modalidad: "ENUM('Presencial', 'Mixta') NULL",
    estrategia: "VARCHAR(255) NULL",
    tipo_capacitacion: "VARCHAR(255) NULL",
    clase_capacitacion: "VARCHAR(255) NULL",
    entidad_capacitadora: "ENUM('SIEMENS', 'SENA') NULL",
    codigo_programa: "VARCHAR(255) NULL",
    codigo_capacitacion: "VARCHAR(255) NULL",
    nombre_formador: "VARCHAR(255) NULL",
    fecha_inicio_presencial: "DATE NULL",
    fecha_fin_presencial: "DATE NULL",
    horario: "VARCHAR(100) NULL",
    lugar_capacitacion: "VARCHAR(255) NULL",
  };

  for (const [columnName, sqlDefinition] of Object.entries(columnDefinitions)) {
    if (!tableDefinition[columnName]) {
      await sequelize.query(`ALTER TABLE cursos ADD COLUMN ${columnName} ${sqlDefinition};`);
    }
  }
};

// Sincronizar modelos y crear tabla de relación cursos_usuarios
sequelize.sync().then(async () => {
  console.log("🗂️ Modelos sincronizados con MySQL");
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS cursos_usuarios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        cursoId INT NOT NULL,
        usuarioId INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cursoId) REFERENCES cursos(id) ON DELETE CASCADE,
        FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE,
        UNIQUE KEY unique_curso_usuario (cursoId, usuarioId),
        INDEX idx_cursoId (cursoId),
        INDEX idx_usuarioId (usuarioId)
      );
    `);
    console.log('✅ Tabla cursos_usuarios creada/verificada');

    await ensureCourseColumns();
    console.log('✅ Columnas extendidas de cursos verificadas');

    await sequelize.query(`
      ALTER TABLE cursos
      MODIFY COLUMN duracion VARCHAR(50) NOT NULL,
      MODIFY COLUMN tipo_capacitacion VARCHAR(255) NULL,
      MODIFY COLUMN clase_capacitacion VARCHAR(255) NULL,
      MODIFY COLUMN codigo_programa VARCHAR(255) NULL,
      MODIFY COLUMN codigo_capacitacion VARCHAR(255) NULL;
    `);
    console.log('✅ Longitudes de columnas de cursos ajustadas');
  } catch (err) {
    console.error('Error creando/verificando estructura adicional:', err);
  }
});
// Rutas
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/cursos", cursoRoutes);
app.use("/api/inscripciones", inscripcionRoutes);
app.use("/api/inscripciones-capacitacion", inscripcionesCapacitacionRoutes);
app.use("/api/archivos", archivoRoutes);
app.use("/api/evidencias", evidenciasRoutes);
app.get("/", (req, res) => {
  res.json({ mensaje: "API ENI lista 🚀 con MySQL" });
});

const server = app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ El puerto ${PORT} ya está en uso.`);
    console.error("Actualiza PORT en Backend-ENI/.env o cierra el proceso que ocupa ese puerto.");
    process.exit(1);
  }

  console.error("Error al iniciar el servidor:", error);
  process.exit(1);
});
