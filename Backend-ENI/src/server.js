import app from "./app.js";
import { configurarCronJobs } from "./services/cronJobs.js";

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor ENI corriendo en http://localhost:${PORT}`);
});

// Configurar cronjobs solo en modo standalone/desarrollo (no en serverless puro de Vercel)
if (process.env.DISABLE_CRON !== "true") {
  configurarCronJobs();
}

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ El puerto ${PORT} ya está en uso.`);
    console.error("Actualiza PORT en .env o cierra el proceso que ocupa ese puerto.");
    process.exit(1);
  }

  console.error("Error al iniciar el servidor:", error);
  process.exit(1);
});
