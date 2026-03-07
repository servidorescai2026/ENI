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
  } catch (err) {
    console.error('Error creando/verificando tabla cursos_usuarios:', err);
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
