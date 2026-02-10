Guía: implementar endpoint GET /api/cursos/area/:areaId
=====================================================

Propósito
--------
Permitir que el frontend obtenga únicamente los cursos pertenecientes a un `areaId`.
Esto evita exponer cursos de otras áreas a formadores y facilita que la UI muestre solo los cursos relevantes.

Requisitos
---------
- Base de datos con la columna `areaId` (o `area_id`) en la tabla `cursos`.
- El servidor Express debe exponer rutas bajo `/api/cursos`.
- (Opcional) Middleware de autenticación para validar permisos.

Ruta sugerida
-------------
GET /api/cursos/area/:areaId

Ejemplo de implementación (Express + Sequelize)
---------------------------------------------
// server/routes/cursosArea.js
const express = require('express');
const router = express.Router();
const { getCursosByArea } = require('../controllers/cursosAreaController');

// Protege la ruta con el middleware de autenticación si aplica: router.get('/area/:areaId', verifyToken, getCursosByArea);
router.get('/area/:areaId', getCursosByArea);
module.exports = router;

// server/controllers/cursosAreaController.js
const { Curso } = require('../../server/models'); // o require('../models') según estructura

exports.getCursosByArea = async (req, res) => {
  const areaId = req.params.areaId;
  if (!areaId) return res.status(400).json({ error: 'areaId requerido' });

  try {
    const cursos = await Curso.findAll({ where: { areaId } });
    return res.json(cursos);
  } catch (err) {
    console.error('getCursosByArea error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

Notas y consideraciones
-----------------------
- Validar el tipo de `areaId` (number vs string) y normalizar si es necesario.
- Proteger la ruta para que usuarios no autorizados no la consulten (ej. solo admin o usuarios autenticados).
- Si la API debe devolver cursos junto a datos relacionados (área, instructor), usar `include` en Sequelize.
- Si el backend no implementa este endpoint, el frontend hará un fallback y filtrará localmente, pero lo ideal es filtrar en backend por eficiencia.

Cómo integrar
-------------
1. Crear los archivos de ruta y controlador según ejemplo.
2. En el archivo principal del servidor (p.ej. `app.js` o `index.js`) montar la ruta:

```js
const cursosAreaRouter = require('./server/routes/cursosArea');
app.use('/api/cursos', cursosAreaRouter);
```

3. Reiniciar el servidor y probar: `GET http://localhost:3000/api/cursos/area/3`

Ejemplo SQL simple
------------------
SELECT * FROM cursos WHERE areaId = 3;

Contacto
-------
Si quieres, implemento este endpoint en el directorio `server/` siguiendo tu convención actual. Dime si tu proyecto usa Sequelize u otro ORM y el nombre del modelo de cursos.
