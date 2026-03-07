# Cambios aplicados en esta sesion

## Backend

- Se corrigio el orden de rutas en `Backend-ENI/src/routes/inscripciones_capacitacion.js` para evitar conflicto entre `/:id` y `/usuario/:usuarioId`.
- Se agregaron validaciones de acceso en `Backend-ENI/src/routes/inscripciones_capacitacion.js` para que solo admin o el mismo usuario consulten sus inscripciones.
- Se creo apoyo interno en `Backend-ENI/src/routes/capacitacionesController.js` para consultar una inscripcion por id y validar permisos.
- Se corrigio `req.user.id` por `req.usuario.id` en `Backend-ENI/src/routes/archivos.js`.
- Se restringieron endpoints sensibles de archivos en `Backend-ENI/src/routes/archivos.js`:
  - listado general solo admin
  - estadisticas solo admin
  - actualizar/eliminar solo admin
  - consulta por usuario o por id solo admin o propietario
- Se aseguro `POST /api/usuarios/cambiar-password` en `Backend-ENI/src/routes/usuarios.js`:
  - ahora requiere token
  - valida permisos
  - exige `passwordActual` para usuarios normales
  - permite a admin resetear contrasenas de terceros
- Se alineo `Backend-ENI/src/database/models/usuarios.js` con la tabla real `usuarios`:
  - `documento`
  - `regionalId`
  - `regionalNombre`
  - `centroFormacionId`
  - `centroNombre`
  - `redConocimiento`
  - `apellido` nullable
  - `email` de mayor longitud
  - roles `Administrador`, `Formador`, `Instructor`
- Se mejoro `Backend-ENI/src/server.js`:
  - usa `PORT` y `FRONTEND_ORIGIN` por entorno
  - mejor mensaje cuando el puerto esta ocupado (`EADDRINUSE`)

## Importacion masiva

- Se rehizo el flujo de `POST /api/usuarios/upload-bulk` en `Backend-ENI/src/routes/usuarios.js`.
- Ahora soporta importacion desde un solo Excel hacia:
  - tabla `usuarios`
  - tabla `inscripciones_capacitacion`
- Se agrego soporte para columnas del archivo institucional:
  - `DOCUMENTO`
  - `NOMBRE INSTRUCTOR`
  - `COD_REGIONAL`
  - `REGIONAL`
  - `COD_CF`
  - `CENTRO DE FORMACIÓN`
  - `CORREO`
  - `RED DE CONOCIMIENTO`
  - `ÁREA TEMÁTICA`
  - columnas de capacitacion y plan de multiplicacion
- Se agrego deteccion flexible de area por:
  - codigo
  - nombre de red
  - area tematica
- Se agrego parseo flexible de fechas de Excel.
- Se agrego reutilizacion de usuarios existentes por email/documento.
- Se evita duplicar inscripciones de capacitacion equivalentes.
- Se agrego diagnostico detallado en la respuesta:
  - `usuariosCreados`
  - `usuariosReutilizados`
  - `inscripcionesCreadas`
  - `filasOmitidas`
  - `errores`
  - `encabezadosDetectados`
  - `filaEncabezados`
- Se corrigio la lectura del Excel para detectar automaticamente la fila real de encabezados cuando el archivo trae titulos previos.

## Frontend

- Se centralizo la URL base de la API en `Front_ENI/src/config/api.js` con `VITE_API_URL`.
- Se creo `Front_ENI/.env` y `Front_ENI/.env.example` apuntando a `http://localhost:3001`.
- Se reemplazaron URLs hardcodeadas por `apiUrl(...)` en multiples pantallas y servicios.
- Se mejoro `Front_ENI/src/utils/authFetch.js` para no forzar `Content-Type: application/json` cuando el body es `FormData`.
- Se corrigio `Front_ENI/src/GestionArchivos.jsx` para enviar el objeto usuario correcto al cargar archivos.
- Se reescribio `Front_ENI/src/services/Archivos/GetAllArchivos.jsx` para usar `fetch/authFetch` en vez de `axios` no instalado.
- Se alinearon servicios de cursos:
  - `Front_ENI/src/services/Cursos/GetMyCourses.jsx`
  - `Front_ENI/src/services/Cursos/GetCourseAreas.jsx`
  - `Front_ENI/src/services/Cursos/GetAllCourses.jsx`
  - `Front_ENI/src/services/Cursos/GetCoursesByArea.jsx`
  - `Front_ENI/src/services/Cursos/CreateCourse.jsx`
  - `Front_ENI/src/services/Cursos/UpdateCourse.jsx`
  - `Front_ENI/src/services/Cursos/DeleteCourse.jsx`
- Se alinearon servicios de inscripciones:
  - `Front_ENI/src/services/Inscripciones/EnrollCourse.jsx`
  - `Front_ENI/src/services/Inscripciones/CancelEnrollment.jsx`
  - `Front_ENI/src/services/Inscripciones/GetUserEnrollments.jsx`
  - `Front_ENI/src/services/Inscripciones/GetCourseEnrollments.jsx`
- Se alinearon servicios de usuarios:
  - `Front_ENI/src/services/Usuarios/GetAllUsers.jsx`
  - `Front_ENI/src/services/Usuarios/GetOneUsers.jsx`
  - `Front_ENI/src/services/Usuarios/DeleteUsers.jsx`
  - `Front_ENI/src/services/Usuarios/BulkUploadUsers.jsx`
  - `Front_ENI/src/services/Usuarios/CreateUsers.jsx`
  - `Front_ENI/src/services/Usuarios/UpdateUsers.jsx` deja claro que la API actual no soporta update real
- Se conecto la eliminacion de usuarios al backend en `Front_ENI/src/Gestion_Usuarios.jsx`.
- Se mejoro `Front_ENI/src/BulkUpload.jsx` para mostrar detalles del resultado de la importacion:
  - usuarios creados
  - reutilizados
  - inscripciones creadas
  - filas omitidas
  - encabezados detectados
  - errores

## Documentacion

- Se actualizo `README.md` para reflejar rutas y endpoints reales.
- Se actualizo `BATCH_UPLOAD.md` para documentar el nuevo formato y la importacion combinada de usuarios + capacitaciones.

## Configuracion actual recomendada

- Backend: `Backend-ENI/.env`
  - `PORT=3001`
  - `FRONTEND_ORIGIN=http://localhost:5173`
- Frontend: `Front_ENI/.env`
  - `VITE_API_URL=http://localhost:3001`

## Nota importante para futuras pruebas

- Si una prueba parece usar comportamiento viejo, probablemente hay un proceso `node.exe` antiguo ocupando el puerto.
- Verificar puerto con:

```bat
netstat -ano | findstr :3001
```

- Matar proceso por PID con:

```bat
taskkill /PID <PID> /F
```
