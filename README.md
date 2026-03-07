# 📚 ENI-360Re - Sistema de Gestión de Capacitaciones

Una aplicación web completa para la gestión integral de capacitaciones, cursos y usuarios en la institución ENI.

---

## 🎯 Descripción General

**ENI-360Re** es una plataforma educativa que permite:
- ✅ Registro y autenticación de usuarios con roles diferenciados
- ✅ Administración de cursos y áreas temáticas
- ✅ Inscripciones en capacitaciones y seguimiento
- ✅ Gestión de evidencias mediante Google Drive
- ✅ Notificaciones automáticas a usuarios y administradores
- ✅ Importación masiva de usuarios desde Excel
- ✅ Planes de multiplicación y validación de capacitaciones

---

## 🏗️ Arquitectura del Proyecto

```
ENI-360Re/
├── Backend-ENI/              # API REST en Node.js + Express
│   ├── src/
│   │   ├── server.js         # Punto de entrada
│   │   ├── database/         # Configuración y modelos ORM
│   │   ├── routes/           # Endpoints de la API
│   │   ├── controllers/      # Lógica de negocio
│   │   ├── middleware/       # Autenticación y validación
│   │   └── services/         # Utilidades (Google Drive, etc)
│   ├── uploads/              # Almacenamiento local de archivos
│   ├── package.json
│   └── credenciales.json     # Acceso a Google Drive
│
├── Front_ENI/                # Cliente React + Vite
│   ├── src/
│   │   ├── main.jsx          # Punto de entrada React
│   │   ├── App.jsx
│   │   ├── components/       # Componentes reutilizables
│   │   ├── services/         # Clientes HTTP a la API
│   │   ├── utils/            # Funciones auxiliares
│   │   ├── css/              # Estilos globales
│   │   └── config/           # Configuración (ReCAPTCHA, etc)
│   ├── vite.config.js
│   ├── index.html
│   └── package.json
│
├── PROJECT_ANALYSIS.md       # Análisis técnico detallado
├── BATCH_UPLOAD.md           # Guía de importación masiva
├── INSCRIPCIONES_CAPACITACION.md  # Documentación de capacitaciones
└── README.md                 # Este archivo
```

**Arquitectura**: Frontend y Backend **completamente desacoplados** para flexibilidad y escalabilidad.

---

## 🔧 Backend (Node.js + Express + MySQL)

### Tecnologías Principales
```json
{
  "runtime": "Node.js (ES Modules)",
  "framework": "Express.js",
  "database": "MySQL + Sequelize ORM",
  "auth": "JWT (JSON Web Tokens)",
  "password": "bcryptjs",
  "storage": "Google Drive API + Almacenamiento local",
  "file_upload": "Multer"
}
```

### Características Principales

#### 1️⃣ Autenticación y Autorización
- Login/Registro con contraseña hasheada
- JWT con expiración configurable
- Roles: **Administrador**, **Formador**, **Estudiante**
- Middleware `verifyToken` y `verifyAdmin` en rutas protegidas
- ReCAPTCHA en registro y login para evitar bots

#### 2️⃣ Gestión de Usuarios
```
POST   /api/usuarios/register          Registro de nuevo usuario
POST   /api/usuarios/login             Autenticación
GET    /api/usuarios/perfil            Perfil del usuario autenticado
GET    /api/usuarios                   Listar todos (solo admin)
POST   /api/usuarios/upload-bulk       Importar desde Excel
DELETE /api/usuarios/eliminar/:id      Eliminar usuario (admin)
POST   /api/usuarios/cambiar-password  Cambiar contraseña (requiere token)
```

**Bulk Upload**: El sistema soporta **múltiples variantes de nombres de columnas** en Excel:
- `nombre` / `Nombre` / `NOMBRE INSTRUCTOR`
- `apellido` / `Apellido` 
- `email` / `Email` / `CORREO` / `correo`
- `codigoArea` / `codigo` / `codigo_area`
- **Contraseña por defecto**: `ENI2024*` (hasheada)
- **Rol por defecto**: `Formador`

#### 3️⃣ Cursos y Áreas
```
GET    /api/cursos                     Obtener cursos
GET    /api/cursos/area/:areaId        Obtener cursos por área
GET    /api/cursos/:id/usuarios        Obtener inscritos por curso
POST   /api/cursos                     Crear curso
PUT    /api/cursos/:id                 Actualizar
DELETE /api/cursos/:id                 Eliminar

GET    /api/areas                      Listar áreas
```

Los cursos se organizan por áreas temáticas y pueden tener múltiples usuarios inscritos.

#### 4️⃣ Inscripciones de Capacitación [NUEVO]
```
GET    /api/inscripciones-capacitacion              Todas (admin)
GET    /api/inscripciones-capacitacion/:id          Por ID
GET    /api/inscripciones-capacitacion/usuario/:id  Por usuario
POST   /api/inscripciones-capacitacion              Crear (admin)
PUT    /api/inscripciones-capacitacion/:id          Actualizar (admin)
DELETE /api/inscripciones-capacitacion/:id          Eliminar (admin)
```

**Campos almacenados**:
- Denominación de la capacitación
- Fechas de inicio/fin
- Plan de multiplicación
- Acta de compromiso
- Validación del plan ejecutado
- Nombre del delegado de seguimiento
- Descripción del plan
- Links de evidencias

#### 5️⃣ Notificaciones
```
POST   /api/usuarios/notificar-por-area   Enviar notificación a usuarios de áreas
GET    /api/usuarios/mis-notificaciones   Obtener notificaciones del usuario
POST   /api/usuarios/notificaciones/:id/marcar-leida  Marcar como leída
```

Las notificaciones pueden incluir archivos adjuntos (PDFs).

#### 6️⃣ Evidencias y Almacenamiento
```
POST   /api/usuarios/subir-evidencia    Subir evidencias en PDF
POST   /api/archivos                    Subir archivo individual autenticado
GET    /api/archivos                    Listar archivos (admin)
GET    /api/archivos/usuario/:usuarioId Listar archivos del usuario o admin
PUT    /api/archivos/:id                Actualizar estado (admin)
```

- **Almacenamiento dual**: Google Drive + Local
- Organización por carpetas por usuario
- Links para consulta de documentos
- Validación de PDFs

### Base de Datos (MySQL)

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Usuarios con roles (id, nombre, apellido, email, password, rol, areaId) |
| `areas` | Áreas temáticas/regionales (id, nombre, codigo, regional, centroFormacion) |
| `cursos` | Catálogo de cursos (id, nombre, descripcion, areaid, usuarioId) |
| `inscripciones` | Relación M:M usuarios-cursos con fechas |
| `inscripciones_capacitacion` | Detalles de capacitaciones cursadas [NUEVO] |
| `notificaciones` | Mensajes enviados (id, usuarioId, asunto, mensaje, leida, archivos) |
| `archivos` | Documentos almacenados (id, nombre, ruta, usuarioId) |
| `cursos_usuarios` | Tabla de relación usuarios-cursos |

### Modelos y Relaciones

```javascript
// Relaciones principales
Usuario → Area (1:N)              // Cada usuario en un área
Usuario → Curso (1:N)             // Usuario crea cursos
Usuario → Inscripcion (1:N)       // Usuario inscrito en cursos
Usuario → InscripcionCapacitacion (1:N)  // Capacitaciones del usuario [NUEVO]
Usuario → Notificacion (1:N)      // Notificaciones recibidas
Curso → Area (1:N)                // Cursos por área
```

### Variables de Entorno (.env)

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=eni_db

# JWT
JWT_SECRET=tu_clave_secreta
JWT_EXPIRES_IN=1h

# Google Drive
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_REFRESH_TOKEN=tu_refresh_token
GOOGLE_DRIVE_FOLDER_ID=id_de_carpeta
GOOGLE_DRIVE_REQUIRED=false

# ReCAPTCHA
CAPTCHA_SECRET=tu_secret_key
CAPTCHA_DISABLED=false

# Servidor
PORT=3000
```

### Scripts NPM

```bash
npm run dev              # Inicia con nodemon (desarrollo)
npm run start            # Producción
npm install              # Instalar dependencias
npm run oauth:drive-token  # Obtener/renovar token Google Drive
```

### Iniciar el Backend

```bash
cd Backend-ENI
npm install
npm run dev
# El servidor estará en http://localhost:3000
```

---

## 🎨 Frontend (React + Vite)

### Tecnologías Principales
```json
{
  "framework": "React 19",
  "bundler": "Vite",
  "styling": "Tailwind CSS / Bulma",
  "http_client": "Fetch API",
  "forms": "Nativa HTML",
  "captcha": "Google ReCAPTCHA v3"
}
```

### Componentes Principales

| Componente | Funcionalidad |
|-----------|--------------|
| `Login.jsx` | Autenticación |
| `Register.jsx` | Registro de usuarios |
| `Admin.jsx` | Panel administrativo |
| `Gestion_Usuarios.jsx` | CRUD de usuarios + bulk upload |
| `GestionCursos.jsx` | Gestión de cursos |
| `CursosDisponibles.jsx` | Catálogo para estudiantes |
| `VerificarMisCursos.jsx` | Cursos inscritos del usuario |
| `SubirEvidencias.jsx` | Subida de PDFs de evidencia |
| `MisNotificaciones.jsx` | Centro de notificaciones |
| `Reportes.jsx` | Reportes administrativos |
| `BulkUpload.jsx` | Importación masiva de usuarios |

### Servicios HTTP

Bajo `src/services/` organizados por recurso:

```
Usuarios/
  ├─ CreateUsers.jsx
  ├─ DeleteUsers.jsx
  ├─ GetAllUsers.jsx
  ├─ UpdateUsers.jsx
  └─ BulkUploadUsers.jsx

Cursos/
  ├─ CreateCourse.jsx
  ├─ DeleteCourse.jsx
  ├─ GetAllCourses.jsx
  ├─ UpdateCourse.jsx
  └─ GetMyCourses.jsx

Inscripciones/
  ├─ EnrollCourse.jsx
  ├─ CancelEnrollment.jsx
  ├─ GetUserEnrollments.jsx
  └─ GetCourseEnrollments.jsx

Areas/
  └─ GetAllAreas.jsx

Archivos/
  └─ GetAllArchivos.jsx
```

### Autenticación en Frontend

**`utils/authFetch.js`**: Wrapper que automáticamente:
- Adjunta JWT en headers
- Maneja errores de autenticación
- Redirige a login si el token expira

```javascript
const response = await authFetch('/api/usuarios', { 
  method: 'POST', 
  body: JSON.stringify(data) 
});
```

### Rutas disponibles

```javascript
/                    // Página principal
/login              // Inicio de sesión
/register           // Registro de usuarios
/usuario            // Dashboard de usuario/formador
/admin              // Panel administrativo
/administrador      // Alias que redirige a /admin
/gestion-usuarios   // Gestión CRUD de usuarios
/upload-usuarios    // Importación masiva
/gestion-cursos     // Gestión de cursos
/cursos-disponibles // Catálogo de cursos
/verificar-mis-cursos // Cursos del formador por área
/mis-notificaciones // Bandeja de notificaciones recibidas
/notificaciones     // Envío de notificaciones por área
/subir-evidencias   // Subida de documentos
/reportes           // Reportes administrativos
/configuracion      // Ajustes de perfil
/monitoria          // Seguimiento de evidencias
```

### Iniciar el Frontend

```bash
cd Front_ENI
npm install
npm run dev
# El cliente estará en http://localhost:5173
```

---

## 🚀 Flujo de Uso

### 1. Registro e Inicio de Sesión
1. Usuario accede a `/login`, `/register` o `/`
2. Se valida ReCAPTCHA
3. Contraseña se hashea en backend
4. Login devuelve JWT que se almacena localmente

### 2. Importación Masiva de Usuarios (Admin)
1. Admin accede a `/gestion-usuarios` → "Carga masiva"
2. Sube archivo Excel con estructura esperada
3. Sistema valida columnas y crea usuarios con contraseña `ENI2024*`
4. Usuarios pueden cambiar contraseña en sus perfiles

### 3. Gestión de Cursos
1. Admin crea cursos en `/gestion-cursos`
2. Asigna a áreas temáticas
3. Estudiantes ven cursos en `/cursos-disponibles`
4. Se inscriben y reciben confirmaciones

### 4. Registro de Capacitaciones
1. Admin registra nueva capacitación para un usuario
2. Incluye plan de multiplicación y detalles
3. Usuario sube evidencias en `/subir-evidencias`
4. Admin valida y actualiza estado

### 5. Notificaciones
1. Admin envía notificación a usuarios de un área
2. Usuarios reciben en `/mis-notificaciones`
3. Se marcan como leídas

---

## 📊 Campos Especiales de Inscripción de Capacitación

| Campo | Tipo | Ejemplo |
|-------|------|---------|
| `denominacion_capacitacion` | VARCHAR(255) | "Formación en Desarrollo Web" |
| `fecha_inicio_cap` | DATE | "2024-01-15" |
| `fecha_fin_cap` | DATE | "2024-02-15" |
| `fecha_diligenciamiento` | DATE | "2024-02-20" |
| `opcion_plan_multiplicacion` | VARCHAR(255) | "Opción A", "Acta Compromiso" |
| `acta_compromiso` | VARCHAR(100) | "SI", "NO" |
| `fecha_multiplicacion` | DATE | "2024-03-01" |
| `validacion_plan` | TEXT | "Plan validado correctamente..." |
| `nombre_delegado_seguimiento` | VARCHAR(150) | "John Doe" |
| `descripcion_plan` | TEXT | "Descripción detallada del plan..." |
| `link_evidencias` | VARCHAR(255) | "https://drive.google.com/..." |

---

## 🔐 Seguridad

✅ **Contraseñas**: Hasheadas con bcryptjs (salt rounds: 10)  
✅ **Autenticación**: JWT con expiración  
✅ **Autorización**: Middleware por rol  
✅ **Validación de entrada**: Middleware y validación en servicios  
✅ **CORS**: Configurado para origen específico  
✅ **ReCAPTCHA**: Protección en formularios públicos  
✅ **Uploads**: Validación de tipos MIME  

---

## 🛠️ Configuración Inicial

### Requisitos
- Node.js v18+
- MySQL 8.0+
- Git

### Pasos de Instalación

```bash
# 1. Clonar repositorio
git clone <url-repo>
cd ENI-360Re

# 2. Backend
cd Backend-ENI
npm install
# Configurar .env con credenciales MySQL
node src/server.js

# 3. Frontend (nueva terminal)
cd ../Front_ENI
npm install
npm run dev
```

### Base de Datos

```sql
-- Crear base de datos
CREATE DATABASE eni_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Sequelize sincroniza automáticamente las tablas al iniciar
-- Los modelos están definidos en Backend-ENI/src/database/models/
```

---

## 📚 Documentación Adicional

- **[PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md)** - Análisis técnico completo
- **[BATCH_UPLOAD.md](BATCH_UPLOAD.md)** - Guía de importación masiva
- **[INSCRIPCIONES_CAPACITACION.md](INSCRIPCIONES_CAPACITACION.md)** - API de capacitaciones

---

## 🐛 Troubleshooting

### Puerto 3000 en uso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Errores de conexión MySQL
- Verifica credenciales en `.env`
- Asegúrate de que MySQL está corriendo
- Revisa logs de Sequelize: `logging: console.log`

### Token expirado
- El frontend automáticamente redirige a login
- JWT_EXPIRES_IN configurable en `.env`

### Google Drive no disponible
- Configura `GOOGLE_DRIVE_REQUIRED=false` para usar almacenamiento local
- Obtén nuevo token: `npm run oauth:drive-token`

---

## 📈 Estadísticas del Proyecto

- **Backend**: ~800 líneas de código
- **Frontend**: ~2000 líneas de código
- **Modelos de BD**: 7 tablas principales + relaciones
- **Endpoints API**: 40+ rutas

---

## 👨‍💻 Stack Tecnológico Resumido

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 19, Vite, Tailwind CSS |
| **Backend** | Node.js, Express, Sequelize |
| **Base de datos** | MySQL 8.0 |
| **Autenticación** | JWT, bcryptjs |
| **Almacenamiento** | Google Drive API, Multer |
| **Validación** | ReCAPTCHA v3 |
| **Herramientas** | npm, nodemon, Git |

---

## 📞 Soporte

Para consultas o reportar bugs:
1. Revisar documentación en [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md)
2. Verificar logs del servidor: `npm run dev`
3. Revisar Network tab en DevTools del navegador

---

## 📄 Licencia

Proyecto desarrollado para ENI. Todos los derechos reservados.

---

**Última actualización**: Marzo 7, 2026  
**Versión**: 1.0.0

