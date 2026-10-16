# Plan de Despliegue y Correcciones para ENI-360Re en Vercel

> **Nota:** Este documento está pensado para migrar el proyecto tal como está hacia un despliegue funcional en Vercel. El backend actual es una API Express con MySQL + Sequelize, subida de archivos con Multer, Google Drive y archivos locales. Vercel es ideal para el **frontend (Front_ENI)**, pero requiere ajustes estructurales para el **backend**.

## 1. Diagnóstico Actual

El repositorio presenta la siguiente estructura:

`	ext
ENI-360Re/
+-- Backend-ENI/      # API REST Node.js + Express + Sequelize + MySQL
+-- Front_ENI/        # Cliente React 19 + Vite + Tailwind/Bulma
+-- node_modules/
+-- README.md
+-- *.md
`

**Puntos críticos para Vercel:**

- **Backend con pp.listen()**: Vercel ejecuta funciones serverless con tiempo de ejecución limitado. Un server.listen(PORT) no es adecuado para funciones serverless.
- **MySQL local**: Actualmente apunta a localhost. En Vercel se requiere una base de datos externa (PlanetScale, Neon, Supabase, Railway, Render, Aiven, TiDB, etc.).
- **Almacenamiento local (/uploads)**: El sistema guarda archivos físicamente con Multer. El filesystem de Vercel es **efímero** (se borra entre despliegues/requests). No es viable mantener evidencias ahí.
- **credenciales.json**: Existe Backend-ENI/credenciales.json. **Nunca debe subirse a un repositorio**. Debe migrarse a variables de entorno.
- **Frontend y backend desacoplados**: Correcto conceptualmente, pero se debe definir VITE_API_URL apuntando al backend desplegado.
- **CORS**: Actualmente debe permitir el dominio *.vercel.app + dominio propio.
- **Variables sensibles**: JWT_SECRET, CAPTCHA_SECRET, tokens de Google, credenciales DB sin gestión vía Vercel Env.

## 2. Cambios Estructurales Requeridos

### 2.1 Opción A: Backend en Vercel (Serverless) – Recomendado si se mantiene monorepo

Vercel permite ejecutar Express como función serverless. Se debe reorganizar el backend para exponerlo vía /api.

**Acciones:**

1. Crear carpeta pi/ en la raíz del proyecto.
2. Mover la lógica de Backend-ENI/src/server.js a pi/index.js.
3. Adaptar pi/index.js para **exportar** la app Express en lugar de hacer pp.listen().
4. Mantener Backend-ENI/src/ intacto (rutas, controladores, middlewares, modelos, servicios).
5. Añadir ercel.json en raíz.

**Ejemplo mínimo pi/index.js:**

`js
import app from "../Backend-ENI/src/app.js";
// o importar desde donde definas app

export default app;
`

> Si server.js instancia todo junto con listen, conviene extraer la definición de pp a pp.js (sin listen) para poder reutilizarla tanto local como serverless.

### 2.2 Opción B: Backend externo (Railway/Render/Render+Neon) + Frontend en Vercel – Más estable

Más recomendable para:

- Conexiones persistentes a MySQL
- Subidas con mayor tamaño
- Google OAuth/Drive tokens con menos restricciones
- Logs persistentes
- Rate limiting efectivo

**Acciones:**

- Desplegar Backend-ENI/ completo en Railway/Render (Node.js build + start).
- Mantener Front_ENI/ en Vercel apuntando a https://tu-backend.up.railway.app.

### 2.3 Frontend (Front_ENI)

**Cambios obligatorios:**

1. Sustituir URLs hardcodeadas http://localhost:3000 por import.meta.env.VITE_API_URL.
2. Revisar ite.config.js:
   - Asegurar uild.outDir correcto (dist/)
   - Eliminar proxies innecesarios en producción
   - Configurar ase: '/' si no hay subpath
3. Crear .env.example con VITE_API_URL=https://api-tu-proyecto.vercel.app o URL externa.
4. Verificar que uthFetch.js use la variable centralizada.
## 4. Implementación de Seguridad

### 4.1 Eliminar secretos del repo

**Acciones inmediatas:**

1. Añadir al .gitignore raíz:

`gitignore
Backend-ENI/credenciales.json
Backend-ENI/.env
Front_ENI/.env
.env
uploads/
`

2. Eliminar archivo rastreado (ya existe): git rm --cached Backend-ENI/credenciales.json
3. Rotar GOOGLE_REFRESH_TOKEN, JWT_SECRET, claves DB si ya fueron expuestas.
4. Crear Backend-ENI/.env.example con todas las claves necesarias (sin valores reales).
### 4.3 JWT y Auth

- Cambiar JWT_EXPIRES_IN a 2h o 1h (actual 1h aceptable con refresh si se implementa). Evitar 7d sin justificación.
- Usar httpOnly + secure + SameSite si se pasan tokens vía cookie. **Actualmente** parece enviarse por Authorization: Bearer. Mantenerlo pero reforzar CORS.
- Validar eq.user siempre en middlewares.
- Bloquear acceso a rutas /api/usuarios/* sensibles solo con erifyAdmin donde corresponda.
- Mantener la lógica de **forzar cambio de contraseña** ENI2024* pero **eliminar ese valor por defecto en producción**. Mejor generar contraseña aleatoria o enviar invitación.

### 4.4 Validación de entrada

Revisar rutas con datos provenientes de:

- POST /api/usuarios/upload-bulk (Excel) – sanitizar nombres, validar email, evitar inyección
- POST /api/archivos, subir-evidencia – validar MIME estrictamente (solo PDF según uso)
- inscripciones-capacitacion – validar fechas echa_inicio <= fecha_fin
- Queries con :id – asegurar parseInt + validación
### 4.5 Google Drive

- Migrar credenciales.json a GOOGLE_APPLICATION_CREDENTIALS vía JSON stringificada o usar google-auth-library con client_email/private_key desde env.
- Si GOOGLE_DRIVE_REQUIRED=false, **no** fallar el arranque del servidor.
- Centralizar lógica en services/googleDrive.js con try/catch.
- Evitar loguear tokens completos.

### 4.6 Archivos subidos

**Crítico:** Reemplazar almacenamiento 100% local por una alternativa persistente:

| Alternativa | Gratis | Persistente | Sencillo | Notas |
|---|---|---|---|---|
| **Cloudinary** | Sí | Sí | Muy bueno | Ideal PDFs/imágenes. Permite transform + URLs públicas/privadas |
| **UploadThing** | Sí (créditos) | Sí | Muy bueno | Integración moderna |
| **Supabase Storage** | Sí | Sí | Bueno | Usa buckets con políticas RLS |
| **Google Drive** (ya usado) | Sí | Sí | Parcial | Funciona pero requiere refresh token estable |
| **Vercel Blob** | Sí (hobby) | Sí | Bueno | Pensado para Vercel |

**Recomendado:** Migrar multer.diskStorage a multer.memoryStorage + uploader a Supabase/Cloudinary/Vercel Blob. Así elimina dependencia de /uploads.

Si **debe** mantenerse Google Drive: mantener GOOGLE_DRIVE_REQUIRED=false como fallback controlado y validar carpetas existentes.
## 5. Correcciones Específicas para que Funcione Correctamente

### 5.1 Backend

**Backend-ENI/src/server.js**

- Extraer pp a pp.js. server.js solo para pp.listen() en desarrollo.
- No ejecutar sequelize.sync() sin validación. Añadir lter: false.
- Capturar errores no manejados: process.on('uncaughtException'), unhandledRejection (útil fuera serverless).
- Cargar .env solo en desarrollo (dotenv).

**Rutas con prefijo /api**

Verificar consistencia: pp.use('/api/usuarios', ...), pp.use('/api/cursos', ...), etc. Coincidir con frontend.

**Modelos inscripciones_capacitacion**

Revisar relaciones con Usuario (elongsTo/hasMany). Asegurar oreignKey correcto y onDelete coherente.

**Bulk Upload**

- Validar extensión .xlsx, .xls
- Limitar tamaño de archivo
- Normalizar columnas case-insensitive (ya parece tener variantes)
- **No** permitir crear admins vía bulk
- Forzar ol: 'Formador' explícito
- Registrar logs de errores fila por fila

### 5.2 Frontend

**Variables**

Cambiar todas las llamadas etch:

`js
const API = import.meta.env.VITE_API_URL;
const res = await fetch(${API}/api/usuarios/login, {...})
`

**ReCAPTCHA**

- En desarrollo puede usar localhost. En producción **obligatorio** registrar dominio 	u-frontend.vercel.app en Google reCAPTCHA v3.
- Si CAPTCHA_DISABLED=true en backend, sincronizar comportamiento.

**authFetch**

Verificar que gestione 401 limpiando localStorage y redirigiendo a /login.

**Rutas protegidas**

Comprobar guards por ol (Admin/Formador/Estudiante). Evitar acceso por URL directa.

**Vite build**

Probar 
pm run build && npm run preview localmente antes de Vercel.

### 5.3 Archivos a revisar con atención

| Archivo | Acción |
|---|---|
| Backend-ENI/src/server.js | Separar pp para serverless |
| Backend-ENI/src/app.js | Añadir helmet/cors/rateLimit + CORS dinámico |
| Backend-ENI/src/database/config/config.js | Añadir SSL producción |
| Backend-ENI/src/services/googleDrive.js | Leer credenciales desde env |
| Backend-ENI/src/middleware/auth.js | Revisar expiración + validación token |
| Backend-ENI/src/controllers/usuario.controller.js | Revisar bulk + cambio obligatorio contraseña |
| Front_ENI/src/services/**/*.jsx | Reemplazar localhost por VITE_API_URL |
| Front_ENI/src/utils/authFetch.js | Verificar manejo 401/403 |
| Front_ENI/vite.config.js | Limpiar proxy prod |
## 6. Recomendaciones Antes del Primer Despliegue

1. **Eliminar credenciales**: Borrar credenciales.json del historial si aplica (git filter-repo o git rm --cached).
2. **.env.example**: Crear ambos (Backend-ENI/.env.example, Front_ENI/.env.example).
3. **Probar build local**: cd Front_ENI && npm run build sin errores.
4. **Smoke test backend local**: 
pm run dev + curl http://localhost:3000/api/areas (o ruta existente).
5. **DB migraciones**: Preferir sequelize-cli db:migrate sobre sync en producción.
6. **Tamaño uploads**: Añadir limits: { fileSize: 10*1024*1024 } con Multer para evitar abusos.
7. **Logs**: Desactivar sequelize.logging en producción.
8. **Healthcheck**: Crear GET /api/health simple para validar despliegue.
9. **Dominio**: Añadir dominio Vercel a ReCAPTCHA + CORS.

## 7. Checklist Final para Vercel

### Estructura
- [ ] pi/index.js creado y exportando app
- [ ] ercel.json configurado (si monorepo)
- [ ] pp.js sin listen
- [ ] .gitignore actualizado

### Configuración
- [ ] Todas las variables en Vercel (Front + Back)
- [ ] DB externa con SSL habilitado
- [ ] VITE_API_URL correcto
- [ ] CORS_ORIGIN incluye *.vercel.app

### Seguridad
- [ ] credenciales.json fuera de repo
- [ ] helmet, cors, express-rate-limit añadidos
- [ ] JWT_SECRET fuerte y único
- [ ] Validación MIME para PDFs
- [ ] Límites Multer configurados

### Pruebas post-despliegue
- [ ] GET /api/health responde 200
- [ ] Login/Register funcional
- [ ] Carga masiva Excel
- [ ] Subida de evidencias (PDF)
- [ ] Notificaciones
- [ ] Google Drive opcional con alse funciona
- [ ] ReCAPTCHA pasa con dominio correcto
- [ ] Redirección por expiración de token OK

## 8. Conclusión

**Recomendación práctica:** Desplegar **Frontend_ENI** en Vercel y **Backend-ENI** en **Railway/Render**. Esto evita las limitaciones serverless (filesystem efímero + conexiones MySQL cortas) y resulta mucho más directo sin reestructurar todo a pi/.

Si **obligatoriamente** debe ir todo a Vercel (monorepo), aplicar obligatoriamente los puntos de: pi/index.js, ercel.json, migración de uploads a almacenamiento persistente, DB externa con SSL, y eliminación total de credenciales.json del control de versiones.

**Prioridad absoluta:** Sustituir almacenamiento local, externalizar secretos, usar DB gestionada y configurar VITE_API_URL + CORS correctamente.
