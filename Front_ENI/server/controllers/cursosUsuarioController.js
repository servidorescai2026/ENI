const { sequelize } = require('../../server/models') || require('../models');

// GET /api/cursos/usuario/:usuarioId
// Returns the list of cursos linked to a usuario via cursos_usuarios
// IMPORTANTE: Filtra solo los cursos que pertenecen al área del usuario
exports.getCursosForUser = async (req, res) => {
  const usuarioId = parseInt(req.params.usuarioId, 10);
  if (isNaN(usuarioId)) return res.status(400).json({ error: 'usuarioId inválido' });

  // Allow users to request their own cursos, or admins to request any
  if (req.usuario && req.usuario.id !== usuarioId && req.usuario.rol !== 'administrador') {
    return res.status(403).json({ error: 'No autorizado' });
  }

  try {
    // Obtener cursos del usuario a través de la tabla de relación cursos_usuarios.
    // IMPORTANTE: ya no filtramos por c.areaId para permitir cursos con múltiples áreas.
    const cursos = await sequelize.query(
      `SELECT c.*
       FROM cursos c
       JOIN cursos_usuarios cu ON cu.cursoId = c.id
       WHERE cu.usuarioId = :usuarioId`,
      {
        replacements: { usuarioId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return res.json(cursos);
  } catch (err) {
    console.error('getCursosForUser error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
