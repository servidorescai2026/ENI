-- Migration: create cursos_usuarios intermediate table
-- Run this in your MySQL database to create mapping between cursos and usuarios

CREATE TABLE IF NOT EXISTS cursos_usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cursoId INT NOT NULL,
  usuarioId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_curso
    FOREIGN KEY (cursoId) REFERENCES cursos(id) ON DELETE CASCADE,
  CONSTRAINT fk_usuario
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY unique_curso_usuario (cursoId, usuarioId)
);
