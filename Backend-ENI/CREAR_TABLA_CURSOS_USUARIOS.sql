-- ============================================================================
-- CREAR TABLA DE RELACIÓN: cursos_usuarios (Muchos a Muchos)
-- ============================================================================
-- Esta tabla vincula cada curso con los usuarios de su área
-- Cuando se crea un curso en un área, automáticamente se asigna a todos los
-- usuarios que pertenecen a esa área

-- 1. Crear tabla cursos_usuarios
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

-- 2. (OPCIONAL) Eliminar columna usuarioId de cursos si existe
-- ALTER TABLE cursos DROP COLUMN IF EXISTS usuarioId;

-- 3. Verificación - Estructura de la tabla
-- DESCRIBE cursos_usuarios;

-- 4. Verificación - Ver relaciones
-- SELECT c.id, c.nombre, c.areaId, COUNT(cu.usuarioId) as usuarios_asignados
-- FROM cursos c
-- LEFT JOIN cursos_usuarios cu ON c.id = cu.cursoId
-- GROUP BY c.id;

-- 5. Verificación - Ver usuarios de un curso específico
-- SELECT u.id, u.nombre, u.email, u.areaId
-- FROM usuarios u
-- INNER JOIN cursos_usuarios cu ON u.id = cu.usuarioId
-- WHERE cu.cursoId = 1
-- ORDER BY u.nombre;
