const express = require('express');
const router = express.Router();
const { getCursosForUser } = require('../controllers/cursosUsuarioController');
// If your project uses an auth middleware, require it and use it here.
// Example: const { verifyToken } = require('../middlewares/auth');

// route: GET /api/cursos/usuario/:usuarioId
// attach auth middleware as appropriate (e.g., verifyToken)
router.get('/usuario/:usuarioId', /* verifyToken, */ getCursosForUser);

module.exports = router;
