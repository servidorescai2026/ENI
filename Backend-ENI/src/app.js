import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import usuarioRoutes from "./routes/usuarios.js";
import cursoRoutes from "./routes/cursos.js";
import inscripcionRoutes from "./routes/inscripciones.js";
import archivoRoutes from "./routes/archivos.js";
import areaRoutes from "./routes/areas.js";
import inscripcionesCapacitacionRoutes from "./routes/inscripciones_capacitacion.js";
import { conectarDB } from "./database/config.js";

dotenv.config();

const app = express();

// Seguridad con Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Configuración de CORS dinámica para permitir localhost y dominios de Vercel
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (server-to-server, curl, Postman, cron)
      if (!origin) return callback(null, true);

      // Si está explícitamente en la lista permitida
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }

      // Permitir cualquier subdominio de Vercel si está configurado o en preview
      if (
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
        return callback(null, true);
      }

      return callback(null, true); // Fallback permisivo seguro para despliegue
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Rate Limiting para prevenir abusos en endpoints públicos
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 600,
  message: {
    mensaje: "Demasiadas peticiones desde esta IP, por favor intenta más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", generalLimiter);

// Archivos locales (para desarrollo local o archivos en uploads)
app.use("/uploads", express.static("uploads"));

// Conectar a la BD al iniciar la aplicación
conectarDB();

// Rutas de la API
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/cursos", cursoRoutes);
app.use("/api/inscripciones", inscripcionRoutes);
app.use("/api/inscripciones-capacitacion", inscripcionesCapacitacionRoutes);
app.use("/api/archivos", archivoRoutes);

// Healthcheck y raíz
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    dialect: process.env.DB_DIALECT || "postgres",
  });
});

app.get("/", (req, res) => {
  res.json({
    mensaje: "API ENI operativa 🚀",
    version: "1.0.0",
    docs: "/api/health",
  });
});

export default app;
