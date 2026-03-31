# MANUAL TECNICO ENI-360Re

## 1. Objetivo
Este manual tecnico documenta la aplicacion ENI-360Re de forma integral para:
- Operacion y soporte.
- Desarrollo evolutivo.
- Onboarding tecnico.
- Diagnostico y mantenimiento.

El sistema esta dividido en 2 aplicaciones desacopladas:
- Frontend SPA en React + Vite.
- Backend API REST en Node.js + Express + Sequelize + MySQL.

## 2. Alcance funcional
La app cubre:
- Autenticacion y autorizacion por rol.
- Gestion de usuarios.
- Gestion de cursos y areas.
- Inscripciones (regla: un curso activo por usuario).
- Carga de evidencias (Google Drive y fallback local).
- Notificaciones por area, notificaciones personales y marcacion de lectura.
- Monitoria de estado de formadores.
- Inscripciones de capacitacion.
- Carga masiva de usuarios desde Excel.

## 3. Arquitectura general
## 3.1 Frontend
- Stack: React 19, React Router, Vite.
- Archivo de entrada: Front_ENI/src/main.jsx
- Config API: Front_ENI/src/config/api.js
- Wrapper de seguridad HTTP: Front_ENI/src/utils/authFetch.js
- Estilos principales: Front_ENI/src/css/global.css

## 3.2 Backend
- Stack: Node.js (ESM), Express, Sequelize, MySQL.
- Archivo de entrada: Backend-ENI/src/server.js
- Conexion DB: Backend-ENI/src/database/config.js
- Rutas REST: Backend-ENI/src/routes
- Middleware auth: verifyToken, verifyAdmin, verifyCaptcha
- Servicios de almacenamiento: Google Drive + local

## 3.3 Flujo de comunicacion
1. El frontend consume la API en VITE_API_URL (por defecto http://localhost:3001).
2. authFetch adjunta Bearer token desde localStorage.
3. El backend valida token y rol en middleware.
4. Sequelize persiste/consulta en MySQL.
5. Los archivos se almacenan en Drive o disco segun disponibilidad/configuracion.

## 4. Estructura de carpetas (resumen)
- Backend-ENI/
  - src/server.js
  - src/database/
  - src/routes/
  - src/middleware/
  - src/services/
  - uploads/
- Front_ENI/
  - src/main.jsx
  - src/*.jsx (vistas)
  - src/services/
  - src/utils/
  - src/config/
  - src/css/global.css

## 5. Requisitos tecnicos
- Node.js 18+
- npm 9+
- MySQL 8+
- Acceso a Google Cloud (si se usa Drive)

## 6. Configuracion de entorno
## 6.1 Backend (.env)
Variables utilizadas por el backend:
- PORT
- DB_HOST
- DB_NAME
- DB_USER
- DB_PASS
- JWT_SECRET
- JWT_EXPIRES_IN
- FRONTEND_ORIGIN
- RECAPTCHA_SECRET_KEY o CAPTCHA_SECRET
- CAPTCHA_DISABLED
- GOOGLE_OAUTH_CLIENT_ID
- GOOGLE_OAUTH_CLIENT_SECRET
- GOOGLE_OAUTH_REFRESH_TOKEN
- GOOGLE_OAUTH_REDIRECT_URI
- GOOGLE_APPLICATION_CREDENTIALS
- GOOGLE_DRIVE_REQUIRED

Nota: no almacenar credenciales reales en documentacion ni en repositorio.

## 6.2 Frontend (.env)
Variables relevantes:
- VITE_API_URL

## 7. Ejecucion local
## 7.1 Backend
1. cd Backend-ENI
2. npm install
3. npm run dev

Servidor esperado: http://localhost:3001 (segun .env actual del proyecto).

## 7.2 Frontend
1. cd Front_ENI
2. npm install
3. npm run dev

Cliente esperado: http://localhost:5173

## 8. Scripts npm
## 8.1 Backend
- npm run dev: inicia con nodemon.
- npm start: inicia en modo normal.
- npm run oauth:drive-token: genera refresh token OAuth de Google Drive.

## 8.2 Frontend
- npm run dev
- npm run build
- npm run preview
- npm run lint

## 9. Modulos del Frontend
Rutas principales declaradas en Front_ENI/src/main.jsx:
- /
- /register
- /login
- /usuario
- /admin
- /administrador (redirect a /admin)
- /gestion-usuarios
- /gestion-cursos
- /upload-usuarios
- /cursos-disponibles
- /verificar-mis-cursos
- /notificaciones
- /mis-notificaciones
- /subir-evidencias
- /configuracion
- /monitoria
- /detalles-formador/:formadorId

Pantallas clave:
- Usuario.jsx: dashboard de formador, contador de notificaciones, toast de aprobacion de evidencias.
- MisNotificaciones.jsx: lectura/eliminacion de notificaciones.
- Monitoria.jsx: estado de formadores (al-dia, pendiente, pendiente-revision, rechazado).
- DetallesFormador.jsx: detalle de formador, cursos y evidencias.
- SubirEvidencias.jsx: envio de PDFs por formador.

## 10. API Backend (resumen operativo)
Base path: /api

## 10.1 Usuarios y auth (Backend-ENI/src/routes/usuarios.js)
- POST /api/usuarios/register
- POST /api/usuarios/login
- GET /api/usuarios/perfil
- GET /api/usuarios
- DELETE /api/usuarios/eliminar/:id
- POST /api/usuarios/cambiar-password
- POST /api/usuarios/notificar-por-area
- GET /api/usuarios/mis-notificaciones
- POST /api/usuarios/subir-evidencia
- POST /api/usuarios/notificaciones/:id/marcar-leida
- DELETE /api/usuarios/notificaciones/:id
- DELETE /api/usuarios/notificaciones/eliminar-todas

Comportamiento reciente importante:
- Al marcar como leida una notificacion de evidencia por parte del admin, se aprueban evidencias pendientes asociadas del formador y se genera notificacion al formador de evidencia aprobada.

## 10.2 Cursos (Backend-ENI/src/routes/cursos.js)
- GET /api/cursos
- GET /api/cursos/area/:areaId
- GET /api/cursos/:id/usuarios
- POST /api/cursos (admin)
- PUT /api/cursos/:id (admin)
- DELETE /api/cursos/:id (admin)

Incluye reglas de cupo, fecha de cierre e inscripciones abiertas.

## 10.3 Inscripciones (Backend-ENI/src/routes/inscripciones.js)
- POST /api/inscripciones
- GET /api/inscripciones/usuario
- PATCH /api/inscripciones/:id/cancelar
- GET /api/inscripciones/curso/:cursoId

Regla de negocio:
- Un usuario solo puede tener una inscripcion activa a la vez.

## 10.4 Areas (Backend-ENI/src/routes/areas.js)
- GET /api/areas

## 10.5 Archivos (Backend-ENI/src/routes/archivos.js)
- POST /api/archivos
- GET /api/archivos/stats/resumen
- GET /api/archivos/usuario/:usuarioId
- GET /api/archivos
- GET /api/archivos/:id
- PUT /api/archivos/:id
- DELETE /api/archivos/:id

Estados de archivo:
- pendiente
- aprobado
- rechazado

## 10.6 Evidencias Drive legacy/simple (Backend-ENI/src/routes/evidencias.js)
- POST /api/evidencias/subir

## 10.7 Inscripciones capacitacion (Backend-ENI/src/routes/inscripciones_capacitacion.js)
- GET /api/inscripciones-capacitacion
- GET /api/inscripciones-capacitacion/usuario/:usuarioId
- GET /api/inscripciones-capacitacion/:id
- POST /api/inscripciones-capacitacion
- PUT /api/inscripciones-capacitacion/:id
- DELETE /api/inscripciones-capacitacion/:id

## 11. Modelo de datos (alto nivel)
Tablas centrales:
- usuarios
- areas
- cursos
- inscripciones
- archivos
- notificaciones
- inscripciones_capacitacion
- cursos_usuarios

Relaciones clave:
- Area 1:N Usuario
- Area 1:N Curso
- Usuario 1:N Archivo
- Usuario 1:N Notificacion
- Usuario 1:N InscripcionCapacitacion
- Usuario N:M Curso (via inscripciones y/o cursos_usuarios segun caso funcional)

## 12. Seguridad
- JWT para autenticacion.
- verifyToken para endpoints privados.
- verifyAdmin para endpoints administrativos.
- verifyCaptcha en login/registro.
- authFetch en frontend maneja 401 y redireccion a login.

## 13. Almacenamiento de evidencias
Mecanismo principal:
- OAuth2 Google Drive.

Fallback:
- almacenamiento local en uploads/evidencias cuando Drive no esta disponible y GOOGLE_DRIVE_REQUIRED es false.

Token handling:
- soporte para refresco de token y cambio de cuenta por regeneracion de refresh token.

## 14. Monitoria y estados de formador
Monitoria calcula estado por formador usando evidencias:
- al-dia: evidencias del mes sin pendientes/rechazos.
- pendiente-revision: hay evidencias en pendiente.
- rechazado: hay evidencias rechazadas.
- pendiente: no hay evidencias del mes.

Flujo de aprobacion:
1. Formador sube evidencia.
2. Admin recibe notificacion.
3. Admin marca notificacion como leida.
4. Evidencias asociadas se marcan aprobadas.
5. Formador recibe notificacion de aprobacion.
6. Front del formador muestra toast emergente de aprobacion.

## 15. Manejo de errores y observabilidad
Backend:
- respuestas con mensaje y, en varios endpoints, code funcional.
- logging por consola en catch.

Frontend:
- authFetch centraliza expiracion de sesion.
- vistas muestran alertas/toasts segun modulo.

## 16. Problemas comunes y guia rapida
1. Puerto ocupado
- Error EADDRINUSE en backend.
- Solucion: liberar puerto o cambiar PORT.

2. Error 500 al eliminar usuario
- Causa frecuente: registros relacionados (FK) en otras tablas.
- Solucion: implementar borrado en cascada controlado o borrado logico.

3. Google Drive invalid_grant
- Causa: refresh token revocado/expirado.
- Solucion: npm run oauth:drive-token y reiniciar backend.

4. Front no conecta a backend
- Verificar VITE_API_URL y FRONTEND_ORIGIN.
- Verificar CORS y puerto real del backend.

## 17. Buenas practicas para evolucion
- Mantener validaciones de negocio en backend (no solo frontend).
- Estandarizar formato de errores y codigos.
- Agregar pruebas de integracion por modulo critico.
- Separar controladores grandes para mejorar mantenibilidad.
- Aplicar migraciones DB versionadas (en lugar de sync sin control en produccion).

## 18. Checklist de despliegue
1. Configurar .env de backend y frontend.
2. Verificar conexion MySQL.
3. Verificar CORS (FRONTEND_ORIGIN).
4. Validar JWT_SECRET robusto.
5. Configurar Google Drive (si aplica).
6. Ejecutar backend y frontend.
7. Probar login, cursos, inscripcion, notificaciones, monitoria.


---
Documento generado para soporte tecnico y continuidad del proyecto ENI-360Re.
