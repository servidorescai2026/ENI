-- ============================================================================
-- SCRIPT SQL PARA LA TABLA DE ARCHIVOS
-- ============================================================================
-- Nota: Esta tabla se crea automáticamente con sequelize.sync()
-- Este archivo es solo para referencia y documentación

-- ============================================================================
-- TABLA: archivos
-- ============================================================================

-- ============================================================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ============================================================================

-- Índice para buscar archivos por usuario
CREATE INDEX `idx_usuarioId` ON `archivos` (`usuarioId`);

-- Índice para filtrar por estado
CREATE INDEX `idx_estado` ON `archivos` (`estado`);

-- Índice compuesto para búsquedas comunes
CREATE INDEX `idx_usuarioId_estado` ON `archivos` (`usuarioId`, `estado`);

-- Índice para ordenar por fecha
CREATE INDEX `idx_fechaCarga` ON `archivos` (`fechaCarga`);

-- ============================================================================
-- CONSULTAS ÚTILES DE REFERENCIA
-- ============================================================================

-- 1. Obtener todos los archivos de un usuario
-- SELECT * FROM archivos WHERE usuarioId = 5 ORDER BY fechaCarga DESC;

-- 2. Contar archivos por estado
-- SELECT estado, COUNT(*) as cantidad FROM archivos GROUP BY estado;

-- 3. Obtener archivos pendientes
-- SELECT * FROM archivos WHERE estado = 'pendiente' ORDER BY fechaCarga ASC;

-- 4. Obtener archivos de un usuario con información del usuario
-- SELECT a.*, u.nombre, u.email 
-- FROM archivos a 
-- JOIN usuarios u ON a.usuarioId = u.id 
-- WHERE a.usuarioId = 5;

-- 5. Obtener estadísticas completas
-- SELECT 
--   u.nombre, 
--   COUNT(a.id) as total_archivos,
--   SUM(CASE WHEN a.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
--   SUM(CASE WHEN a.estado = 'aprobado' THEN 1 ELSE 0 END) as aprobados,
--   SUM(CASE WHEN a.estado = 'rechazado' THEN 1 ELSE 0 END) as rechazados
-- FROM usuarios u 
-- LEFT JOIN archivos a ON u.id = a.usuarioId
-- GROUP BY u.id, u.nombre;

-- 6. Eliminar archivos por usuario (cascada)
-- DELETE FROM archivos WHERE usuarioId = 5;

-- 7. Actualizar estado de un archivo
-- UPDATE archivos SET estado = 'aprobado' WHERE id = 1;

-- 8. Obtener archivos de los últimos 7 días
-- SELECT * FROM archivos WHERE fechaCarga >= DATE_SUB(NOW(), INTERVAL 7 DAY);

-- 9. Obtener archivos por tipo
-- SELECT tipo, COUNT(*) as cantidad FROM archivos GROUP BY tipo;

-- 10. Obtener archivos ordenados por tamaño
-- SELECT * FROM archivos ORDER BY tamaño DESC LIMIT 10;

-- ============================================================================
-- VISTA ÚTIL: ARCHIVOS CON INFORMACIÓN DEL USUARIO
-- ============================================================================

-- CREATE VIEW archivos_con_usuario AS
-- SELECT 
--   a.id,
--   a.nombre,
--   a.tipo,
--   a.tamaño,
--   a.estado,
--   a.descripcion,
--   a.fechaCarga,
--   u.id as usuario_id,
--   u.nombre as usuario_nombre,
--   u.email as usuario_email,
--   u.rol as usuario_rol
-- FROM archivos a
-- JOIN usuarios u ON a.usuarioId = u.id
-- ORDER BY a.fechaCarga DESC;

-- ============================================================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ============================================================================

-- INSERT INTO archivos (usuarioId, nombre, ruta, tipo, tamaño, descripcion, estado)
-- VALUES 
--   (1, 'Proyecto_Final.pdf', '/uploads/notificaciones/proyecto_1.pdf', 'pdf', 2048000, 'Proyecto final del curso', 'pendiente'),
--   (2, 'Evidencia_Lab.pdf', '/uploads/notificaciones/evidencia_2.pdf', 'pdf', 1536000, 'Evidencia de laboratorio', 'aprobado'),
--   (3, 'Presentacion.pdf', '/uploads/notificaciones/presentacion_3.pdf', 'pdf', 3072000, 'Presentación de resultados', 'rechazado'),
--   (1, 'Imagen_Prueba.jpg', '/uploads/notificaciones/imagen_4.jpg', 'imagen', 512000, 'Imagen de prueba', 'pendiente');

-- ============================================================================
-- TRANSACCIONES SEGURAS
-- ============================================================================

-- Ejemplo de transacción para actualizar un archivo de forma segura:
/*
START TRANSACTION;

-- Obtener el archivo
SELECT * FROM archivos WHERE id = 1 FOR UPDATE;

-- Actualizar el estado
UPDATE archivos SET estado = 'aprobado' WHERE id = 1;

-- Verificar
SELECT * FROM archivos WHERE id = 1;

COMMIT;
*/

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
