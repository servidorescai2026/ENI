Integración backend: endpoint y tabla `cursos_usuarios`
---------------------------------------------------

Archivos añadidos (ejemplo):
- `server/routes/cursosUsuario.js` : ruta GET `/api/cursos/usuario/:usuarioId`
- `server/controllers/cursosUsuarioController.js` : controlador que ejecuta una consulta JOIN sobre `cursos_usuarios` y `cursos`
- `server/sql/create_cursos_usuarios.sql` : script SQL para crear la tabla intermedia

Qué integrar en el servidor existente:
1. Ejecutar el SQL en la base de datos para crear `cursos_usuarios` (o añadir como migration).
2. Importar la nueva ruta en el router principal del servidor. Ejemplo en `app.js` o `routes/index.js`:

```js
const cursosUsuarioRouter = require('./server/routes/cursosUsuario');
app.use('/api/cursos', cursosUsuarioRouter);
```

3. Proteger la ruta con su middleware de autenticación si corresponde (ej: `verifyToken`). El controlador ya valida que
   solo el mismo usuario o un admin puedan consultar los cursos de un usuario distinto.

4. Al crear o actualizar un curso (`POST /api/cursos`, `PUT /api/cursos/:id`) deben ejecutarse pasos adicionales:
   - Recuperar todos los usuarios pertenecientes al `areaId` del curso.
   - Insertar (o actualizar) filas en `cursos_usuarios` para vincular cada `usuarioId` con el `cursoId` (use UPSERT o borre e inserte).

Ejemplo (pseudocódigo Sequelize) para POST /api/cursos:

```js
// after creating curso
const usuarios = await Usuario.findAll({ where: { areaId: nuevoCurso.areaId } });
const binds = usuarios.map(u => ({ cursoId: nuevoCurso.id, usuarioId: u.id }));
// bulkCreate with ignoreDuplicates or use transaction to delete old and bulk insert
await CursosUsuarios.bulkCreate(binds, { ignoreDuplicates: true });
```

Notas:
- Si su backend usa Sequelize, exporten `sequelize` desde `models/index.js` para que el controlador pueda ejecutar la consulta raw.
- El script SQL incluye constraints `ON DELETE CASCADE` para mantener consistencia si se borra un curso o usuario.
