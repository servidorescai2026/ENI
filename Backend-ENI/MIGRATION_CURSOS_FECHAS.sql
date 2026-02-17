-- Script de migración para agregar campos de fechas y lanzamiento a la tabla cursos
-- Ejecutar este script en la base de datos MySQL

-- Agregar campo fechaInicio
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS fechaInicio DATE NULL;

-- Agregar campo fechaFin
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS fechaFin DATE NULL;

-- Agregar campo tipoLanzamiento
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS tipoLanzamiento ENUM('fecha', 'cantidad', 'ambos') NOT NULL DEFAULT 'fecha';

-- Agregar campo maxPersonas
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS maxPersonas INT NULL DEFAULT 0;

-- Agregar campo fechaCierreInscripcion
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS fechaCierreInscripcion DATE NULL;

-- Si la columna tipoLanzamiento ya existe pero no tiene el valor por defecto correcto
ALTER TABLE cursos MODIFY COLUMN tipoLanzamiento ENUM('fecha', 'cantidad', 'ambos') NOT NULL DEFAULT 'fecha';

-- Verificar la estructura de la tabla
DESCRIBE cursos;

-- Nota: Si estás usando una versión de MySQL que no soporta "IF NOT EXISTS",
-- ejecuta los siguientes comandos individuales:

-- ALTER TABLE cursos ADD COLUMN fechaInicio DATE NULL;
-- ALTER TABLE cursos ADD COLUMN fechaFin DATE NULL;
-- ALTER TABLE cursos ADD COLUMN tipoLanzamiento ENUM('fecha', 'cantidad', 'ambos') NOT NULL DEFAULT 'fecha';
-- ALTER TABLE cursos ADD COLUMN maxPersonas INT NULL DEFAULT 0;
-- ALTER TABLE cursos ADD COLUMN fechaCierreInscripcion DATE NULL;
