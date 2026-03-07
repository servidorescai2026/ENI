# Análisis del Proyecto ENI

Este repositorio alberga una aplicación web completa llamada "ENI" con una arquitectura **frontend/backend** separada:

---

## 🧱 Estructura General

```
ENI-360Re/
├─ Backend-ENI/    # API REST en Node.js + Express
└─ Front_ENI/      # Cliente React con Vite
```

Ambos proyectos se encuentran en carpetas independientes para facilitar el desarrollo y despliegue.

---

## 🔧 Backend (`Backend-ENI`)

- **Lenguaje y entorno**: Node.js (ES Modules) con `package.json`.  
- **Dependencias principales**:
  - `express` para el servidor HTTP
  - `sequelize` + `mysql2` para ORM MySQL
  - `jsonwebtoken` para auth JWT
  - `bcryptjs` para hashing de contraseñas
  - `multer` para manejo de uploads
  - `googleapis` para la integración de Google Drive
  - `cors`, `dotenv`, `nodemon` (dev)

- **Carpeta `src`** contiene:
  - `server.js`: punto de entrada que configura Express, middleware y rutas.
  - `database/`: configuración de la conexión y modelos (`usuarios`, `cursos`, `areas`, etc.).
  - `routes/` y `controllers/`: lógica de endpoints REST (e.g. `cursos`, `usuarios`, `inscripciones`).
  - `middleware/`: validadores (`verifyToken`, `verifyAdmin`, `verifyCaptcha`) aplicados a rutas.
  - `services/`: utilidades como `googleDriveService.js` para subir/descargar archivos.

- **Scripts útiles**:
  - `npm run dev`: arranca con `nodemon`.
  - `npm run start`: producción.
  - `npm run oauth:drive-token`: obtiene/renueva el token de Google Drive.

- **Uploads**: en carpeta `uploads/` para almacenar evidencias y notificaciones.

---

## 🎨 Frontend (`Front_ENI`)

- **Framework**: React 19 / Vite + Tailwind/Bulma (Bootstrap) 
- **Rutas y componentes**: múltiples `.jsx` bajo `src/` (e.g. `Login`, `CursosDisponibles`, `Admin`, etc.)
- **Servicios HTTP**:
  - Carpetas bajo `src/services/*` hacen fetch a la API (usuarios, cursos, inscripciones, archivos).
  - `utils/authFetch.js` abstrae peticiones con token.

- **Configuración**:
  - `server/controllers` y `server/routes` replican la parte del backend para pruebas locales.
  - ReCAPTCHA configurado en `config/recaptcha.js`.
  - `vite.config.js` y ESLint/Tailwind se utilizan para build/estilo.

- **Envío**: `npm run dev` ejecuta Vite en modo desarrollo.

---

## 🚀 Flujo principal de la aplicación

1. **Registro / Login**: usuario se registra y recibe JWT.
2. **Autenticación**: middleware en backend protege rutas, el frontend guarda el token y usa `authFetch`.
3. **Administración**: roles y validaciones (`verifyAdmin`) restringen acceso.
4. **Inscripciones y cursos**: usuarios se inscriben, suben evidencias y reciben notificaciones.
5. **Integración Google Drive**: archivos se almacenan en una carpeta drive usando `googleDriveService`.

---

## 🗂️ Consideraciones técnicas

- Se usa MySQL con Sequelize, se recomienda revisar `src/database/config.js` para credenciales.
- Las rutas de backend y frontend están separadas; asegúrate de configurar CORS.
- La configuración de reCAPTCHA y credenciales Google se mantiene en `credenciales.json`.

---

## 📁 Archivos importantes

| Ruta                                   | Propósito                                 |
|----------------------------------------|-------------------------------------------|
| `Backend-ENI/src/server.js`            | Servidor Express                          |
| `Backend-ENI/src/database/models`      | Modelos Sequelize                         |
| `Backend-ENI/src/routes/*.js`          | Definición de endpoints                   |
| `Backend-ENI/src/middleware/*.js`      | Autenticación y validación                |
| `Front_ENI/src/*.jsx`                  | Vistas React principales                  |
| `Front_ENI/src/services/`              | Clientes HTTP hacia la API                |
| `Front_ENI/src/utils/authFetch.js`     | Encapsula fetch con JWT                   |

---

## ✅ Conclusión

El proyecto está bien organizado con separación clara entre frontend y backend. El backend ofrece una API REST con autenticación JWT y manejo de archivos vía Google Drive. El frontend es una SPA React que consume esa API y provee una interfaz administrativa y de usuario.

Puedes usar esta descripción para orientarte, documentar o desarrollar nuevas funcionalidades. ¡Éxito con el desarrollo! 🎉
