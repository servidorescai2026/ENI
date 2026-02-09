import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import usuarioRoutes from "./routes/usuarios.js";
import cursoRoutes from "./routes/cursos.js";
import inscripcionRoutes from "./routes/inscripciones.js";
import archivoRoutes from "./routes/archivos.js";
import { conectarDB, sequelize } from "./database/config.js";
import { Usuario } from "./database/models/usuarios.js";
import areaRoutes from "./routes/areas.js";


dotenv.config();

const app = express();
app.use(express.json());



app.use(cors({
  origin: "http://localhost:5173", // puerto típico de Vite
  credentials: true
}));

app.use("/uploads", express.static("uploads")); // para que puedas ver las imágenes subidas en la carpeta "uploads"

// Conectar a BD
conectarDB();

// Sincronizar modelos con tabla (crea si no existe)
sequelize.sync().then(() => {
  console.log("🗂️ Modelos sincronizados con MySQL");
});

// Asegurar existencia de tabla de relación cursos_usuarios (evita ER_NO_SUCH_TABLE)
sequelize.sync().then(async () => {
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
app.use("/api/archivos", archivoRoutes);

app.get("/", (req, res) => {
  res.json({ mensaje: "API ENI lista 🚀 con MySQL" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));
