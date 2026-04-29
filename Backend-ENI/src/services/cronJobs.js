import cron from "node-cron";
import { Curso } from "../database/models/cursos.js";
import { Usuario } from "../database/models/usuarios.js";
import { Notificacion } from "../database/models/notificacion.js";
import { Archivo } from "../database/models/archivos.js";
import { Op } from "sequelize";

/**
 * Configura tareas programadas (cron jobs)
 * 
 * HORARIOS CONFIGURABLES:
 * - "0 0 * * *" = 00:00 (medianoche) - ACTUAL
 * - "0 8 * * *" = 08:00 (8 AM)
 * - "0 12 * * *" = 12:00 (mediodía)
 * - Formato: "minuto hora día mes díaSemana"
 */
export function configurarCronJobs() {
  const horaNotificacion = "0 0"; // Cambiar aquí: "0 8" = 8:00 AM, "0 12" = 12:00 PM
  cron.schedule(`${horaNotificacion} * * *`, async () => {
    console.log("\n📅 [CRON] ⏰ Ejecutando: Notificar transferencia de conocimiento");

    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);

      // Buscar cursos que terminan hoy y no han sido notificados
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

      console.log(`📊 Cursos que terminan hoy: ${cursosTerminados.length}`);

      if (cursosTerminados.length > 0) {
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

              console.log(`✅ Notificación enviada al instructor ${curso.usuarioId} - ${curso.nombre}`);
            } catch (error) {
              console.error(`❌ Error notificando instructor ${curso.usuarioId}:`, error.message);
            }
          }
        }

        console.log(`\n✅ [CRON] Tarea completada: ${cursosNotificados} notificaciones enviadas`);
      } else {
        console.log("ℹ️ [CRON] No hay cursos que terminen hoy");
      }
    } catch (error) {
      console.error("❌ [CRON] Error en tarea de transferencia:", error);
    }
  });

  // ⏰ TAREA 2: Notificar a administradores sobre instructores sin evidencia
  // Se ejecuta TODOS LOS DÍAS a las 08:00 (8 AM)
  cron.schedule("0 8 * * *", async () => {
    console.log("\n📅 [CRON] 📋 Ejecutando: Verificar falta de evidencia después de 3 meses");

    try {
      // Calcular fecha hace 3 meses
      const hace3Meses = new Date();
      hace3Meses.setMonth(hace3Meses.getMonth() - 3);

      // Buscar cursos que terminaron hace 3+ meses sin notificación
      const cursosVencidos = await Curso.findAll({
        where: {
          fechaFin: {
            [Op.lte]: hace3Meses,
          },
          notificacionFaltaEvidenciaEnviada: false,
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

      console.log(`📊 Cursos con 3+ meses sin evidencia: ${cursosVencidos.length}`);

      if (cursosVencidos.length > 0) {
        // Obtener todos los administradores
        const administradores = await Usuario.findAll({
          where: { rol: "Administrador" },
        });

        console.log(`👨‍💼 Administradores a notificar: ${administradores.length}`);

        // Verificar evidencia para cada curso
        for (const curso of cursosVencidos) {
          try {
            // Buscar archivos del instructor después de que terminó el curso
            const evidencia = await Archivo.count({
              where: {
                usuarioId: curso.usuarioId,
                fechaCarga: {
                  [Op.gte]: curso.fechaFin,
                },
              },
            });

            // Si NO hay evidencia, notificar a administradores
            if (evidencia === 0) {
              // Construir URL para revisar evidencia del instructor
              const urlEvidencia = `https://drive.google.com/drive/u/0/folders/1Bx5FZ7aEECGqisCFeeNcozHSjJz5P-IV`;
              const mensajeNotificacion = `⚠️ FALTA DE EVIDENCIA\n\nEl instructor ${curso.creador.nombre} (${curso.creador.email}) no ha presentado evidencia 3 meses después de finalizar el curso "${curso.nombre}".\n\n📁 Revisa la carpeta de evidencias: ${urlEvidencia}\n\nBusca la carpeta con el nombre del instructor para verificar si subió la evidencia.`;

              for (const admin of administradores) {
                await Notificacion.create({
                  usuarioId: admin.id,
                  asunto: "⚠️ Falta de Evidencia - Transferencia de Conocimiento",
                  mensaje: mensajeNotificacion,
                  areaId: curso.areaId || null,
                  leida: false,
                });
              }

              // Marcar como notificado
              await curso.update({ notificacionFaltaEvidenciaEnviada: true });

              console.log(`✅ Admin notificado: Falta de evidencia del instructor ${curso.creador.nombre}`);
            } else {
              // Marcar como notificado aunque tiene evidencia (para no revisar nuevamente)
              await curso.update({ notificacionFaltaEvidenciaEnviada: true });
              console.log(`✅ ${curso.creador.nombre} ya presentó evidencia para "${curso.nombre}"`);
            }
          } catch (error) {
            console.error(`❌ Error procesando curso ${curso.id}:`, error.message);
          }
        }

        console.log(`\n✅ [CRON] Tarea completada: Verificación de evidencia finalizada`);
      } else {
        console.log("ℹ️ [CRON] No hay cursos vencidos por falta de evidencia");
      }
    } catch (error) {
      console.error("❌ [CRON] Error en tarea de verificación de evidencia:", error);
    }
  });
}
