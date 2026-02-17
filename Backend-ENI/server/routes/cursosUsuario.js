const express = require ('express');
const router = express.Router();
const { getCursosForUser } = require('../controllers/cursosUsuarioController');
const { verifyToken } = require('../middlewares/auth');

router.get('/usuario/:usuarioId', /* verifyToken, */ getCursosForUser);

module.exports = router;
