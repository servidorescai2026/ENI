-- ============================================================================
-- ALTER TABLE CURSOS - AGREGAR COLUMNA usuarioId
-- ============================================================================
-- Este script agrega la columna usuarioId a la tabla cursos
-- para vincular cada curso con el usuario admin que lo creó

-- 1. Agregar columna usuarioId si no existe
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS usuarioId INT;

-- 2. Agregar Foreign Key de usuarioId hacia usuarios
ALTER TABLE cursos
ADD CONSTRAINT IF NOT EXISTS fk_cursos_usuarioId
FOREIGN KEY (usuarioId) REFERENCES usuarios(id);

-- 3. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS `idx_cursos_usuarioId` ON `cursos` (`usuarioId`);
CREATE INDEX IF NOT EXISTS `idx_cursos_areaId` ON `cursos` (`areaId`);

-- 4. Verificación - Ver estructura de la tabla
-- Ejecutar esta query para confirmar:
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'cursos' AND TABLE_SCHEMA = DATABASE();

-- 5. Verificar datos - Ver cursos con usuarioId
-- SELECT id, nombre, areaId, usuarioId, created_at FROM cursos ORDER BY id DESC LIMIT 10;
