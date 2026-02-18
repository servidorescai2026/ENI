# 📚 Gestión de Cursos por Área - Documentación API

## 🎯 Descripción General

El backend soporta la asignación de cursos a áreas específicas. **Cada usuario tiene un `areaId` asignado en su perfil y solo puede ver/acceder a los cursos de su área.**

**Flujo de Control:**
1. Usuario se loguea → Recibe su `areaId` en la respuesta
2. Frontend guarda el `areaId` del usuario
3. Frontend llama a `GET /api/cursos/area/:areaId` con ese areaId
4. Backend devuelve SOLO los cursos de esa área
5. Usuario ve solo esos cursos en su dashboard

---

## 📊 Estructura de Relaciones (Muchos a Muchos)

### Tabla: `cursos_usuarios`
Vincula automáticamente cada curso con todos los usuarios del área.

**Flujo automático:**
1. Admin crea curso con `areaId = 5`
2. Backend busca TODOS los usuarios con `areaId = 5`
3. Backend crea registros en `cursos_usuarios` para cada usuario
4. Resultado: Curso asignado a N usuarios del área 5

**Si se cambia el areaId del curso:**
1. Elimina vinculaciones antiguas
2. Crea nuevas vinculaciones con usuarios de la nueva área

**Estructura:**
```sql
CREATE TABLE cursos_usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cursoId INT NOT NULL,          -- FK → cursos.id
  usuarioId INT NOT NULL,        -- FK → usuarios.id
  created_at DATETIME,
  UNIQUE(cursoId, usuarioId),   -- No duplicados
  ON DELETE CASCADE              -- Si borro curso, elimina registros
);
```

---

## 👥 Regla de Acceso - MUY IMPORTANTE

| Rol | Endpoint | Resultado |
|-----|----------|-----------|
| **Usuario Normal** | `GET /api/cursos/area/5` | VE solo cursos del área 5 |
| **Usuario Normal** | `GET /api/cursos` | ⚠️ VE TODOS (no recomendado usar) |
| **Admin** | `GET /api/cursos` | VE todos los cursos de todas las áreas |
| **Admin** | `GET /api/cursos/area/5` | VE solo cursos del área 5 |

**⚠️ REGLA:** Un usuario normal debe SIEMPRE filtrar por su `areaId`. El endpoint `GET /api/cursos` sin filtro devuelve todo, pero el frontend debe ignorarlo y usar el filtrado.

---

## 📋 Campos del Modelo Curso

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | INTEGER | ✓ Auto | ID único del curso |
| `nombre` | STRING(255) | ✓ Requerido | Nombre del curso |
| `descripcion` | TEXT | ✓ Requerido | Descripción detallada |
| `duracion` | INTEGER | ✓ Requerido | Duración en horas (> 0) |
| `categoria` | ENUM | ✓ Requerido | Una de: `Programación`, `Idiomas`, `Matemáticas`, `Ciencias`, `Negocios`, `Arte`, `Otro` |
| `nivel` | ENUM | ✓ Requerido | Una de: `Básico`, `Intermedio`, `Avanzado` |
| `areaId` | INTEGER | ✓ Requerido | **ID del área (referencia a tabla `areas`)** - **Define qué usuarios ven este curso** |
| `created_at` | DATETIME | - Auto | Fecha de creación |
| `updated_at` | DATETIME | - Auto | Fecha de última actualización |

---

## 📋 Campos del Modelo Usuario

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER | ID único del usuario |
| `nombre` | STRING | Nombre completo |
| `email` | STRING | Email único |
| `password` | STRING | Contraseña encriptada |
| `areaId` | INTEGER | **ID del área del usuario - Define qué cursos puede ver** |
| `rol` | ENUM | `usuario` o `admin` |
| `created_at` | DATETIME | Fecha de creación |

---

## 🔌 Endpoints Disponibles

### 1️⃣ Obtener todos los cursos (Solo Admin)
```http
GET /api/cursos
```

**Descripción:** Obtiene la lista de TODOS los cursos (de todas las áreas). **Solo para administradores.**

**Uso:** Panel de administración para ver catálogo completo.

**Response (200):**
```json
[
  {
    "id": 1,
    "nombre": "JavaScript Avanzado",
    "descripcion": "Curso de JavaScript nivel avanzado",
    "duracion": 20,
    "categoria": "Programación",
    "nivel": "Avanzado",
    "areaId": 5,
    "created_at": "2026-02-07T18:07:47Z",
    "updated_at": "2026-02-07T18:07:47Z"
  },
  {
    "id": 2,
    "nombre": "Inglés Básico",
    "descripcion": "Curso de inglés para principiantes",
    "duracion": 30,
    "categoria": "Idiomas",
    "nivel": "Básico",
    "areaId": 3,
    "created_at": "2026-02-06T10:30:00Z",
    "updated_at": "2026-02-06T10:30:00Z"
  },
  {
    "id": 3,
    "nombre": "Python Intermedio",
    "descripcion": "Curso de Python nivel intermedio",
    "duracion": 25,
    "categoria": "Programación",
    "nivel": "Intermedio",
    "areaId": 5,
    "created_at": "2026-02-05T14:20:00Z",
    "updated_at": "2026-02-05T14:20:00Z"
  }
]
```

---

### 2️⃣ Obtener cursos POR ÁREA (Usuario Normal + Admin)
```http
GET /api/cursos/area/:areaId
```

**Descripción:** Obtiene SOLO los cursos de un área específica. **Este es el endpoint que deben usar los usuarios normales.**

**⭐ IMPORTANTE:** 
- **Usuarios normales:** Llamar con su propio `areaId`
- **Admins:** Pueden llamar con cualquier `areaId` para ver ese área específica

**Parámetros:**
- `areaId` (path): ID del área (entero)

**Example Request (Usuario del área 5):**
```http
GET /api/cursos/area/5
```

**Response (200):**
```json
[
  {
    "id": 1,
    "nombre": "JavaScript Avanzado",
    "descripcion": "Curso de JavaScript nivel avanzado",
    "duracion": 20,
    "categoria": "Programación",
    "nivel": "Avanzado",
    "areaId": 5,
    "created_at": "2026-02-07T18:07:47Z",
    "updated_at": "2026-02-07T18:07:47Z"
  },
  {
    "id": 3,
    "nombre": "Python Intermedio",
    "descripcion": "Curso de Python nivel intermedio",
    "duracion": 25,
    "categoria": "Programación",
    "nivel": "Intermedio",
    "areaId": 5,
    "created_at": "2026-02-05T14:20:00Z",
    "updated_at": "2026-02-05T14:20:00Z"
  }
]
```

**Response (200 - Sin cursos en esa área):**
```json
[]
```

---

### 3️⃣ Crear nuevo curso (Solo Admin)
```http
POST /api/cursos
```

**Descripción:** Crea un nuevo curso asignado a un área específica.

**Autenticación:** ✓ Requiere token de admin

**Headers:**
```
Authorization: Bearer <token_admin>
Content-Type: application/json
```

**Request Body:**
```json
{
  "nombre": "JavaScript Avanzado",
  "descripcion": "Curso de JavaScript nivel avanzado",
  "duracion": 20,
  "categoria": "Programación",
  "nivel": "Avanzado",
  "areaId": 5
}
```

**Response (201 - Éxito):**
  "usuariosAsignados": 3,

**⚠️ IMPORTANTE:** El campo `usuariosAsignados` indica cuántos usuarios del área fueron vinculados automáticamente al curso.
```json
{
  "id": 1,
  "nombre": "JavaScript Avanzado",
  "descripcion": "Curso de JavaScript nivel avanzado",
  "duracion": 20,
  "categoria": "Programación",
  "nivel": "Avanzado",
  "areaId": 5,
  "created_at": "2026-02-07T18:07:47Z",
  "updated_at": "2026-02-07T18:07:47Z"
}
```

**Error (400 - Campo faltante):**
```json
{
  "error": "Todos los campos son requeridos",
  "code": "MISSING_FIELDS"
}
```

**Error (400 - Área no existe):**
```json
{
  "error": "El área especificada no existe",
  "code": "INVALID_AREA"
}
```

**Validaciones:**
- ✓ Todos los campos son **obligatorios** (incluyendo `areaId`)
- ✓ `duracion` debe ser número > 0
- ✓ `nombre` máximo 255 caracteres
- ✓ `categoria` debe ser una de las opciones válidas
- ✓ `nivel` debe ser una de las opciones válidas
- ✓ `areaId` debe existir en la tabla `areas` y ser asignado al curso

---

### 4️⃣ Actualizar curso (Solo Admin)
```http
PUT /api/cursos/:id
```

**Descripción:** Actualiza los datos de un curso (incluyendo su área).

**Autenticación:** ✓ Requiere token de admin

**Parámetros:**
- `id` (path): ID del curso (entero)

**Headers:**
```
Authorization: Bearer <token_admin>
Content-Type: application/json
```

**Request Body (Todos los campos son opcionales):**
```json
{
  "nombre": "JavaScript Pro",
  "areaId": 7
}
```

**Response (200):**
```json
{
  "id": 1,
  "nombre": "JavaScript Pro",
  "descripcion": "Curso de JavaScript nivel avanzado",
  "duracion": 20,
  "categoria": "Programación",
  "nivel": "Avanzado",
  "areaId": 7,
  "updated_at": "2026-02-07T19:30:00Z"
}
```

**Error (404 - Curso no existe):**
```json
{
  "error": "Curso no encontrado",
  "code": "COURSE_NOT_FOUND"
}
```

**Error (400 - Área inválida):**
```json
{
  "error": "El área especificada no existe",
  "code": "INVALID_AREA"
}
```

---

### 5️⃣ Eliminar curso (Solo Admin)
### 5️⃣ Obtener usuarios de un curso
```http
GET /api/cursos/:id/usuarios
```

**Descripción:** Obtiene la lista de usuarios vinculados a un curso específico.

**Parámetros:**
- `id` (path): ID del curso

**Example Request:**
```http
GET /api/cursos/1/usuarios
```

**Response (200):**
```json
[
  {
    "id": 5,
    "nombre": "Juan Pérez",
    "email": "juan@gmail.com",
    "areaId": 5
  },
  {
    "id": 8,
    "nombre": "María García",
    "email": "maria@gmail.com",
    "areaId": 5
  },
  {
    "id": 12,
    "nombre": "Carlos López",
    "email": "carlos@gmail.com",
    "areaId": 5
  }
]
```

**Response (200 - Sin usuarios):**
```json
[]
```

---

### 6️⃣ Eliminar curso (Solo Admin)
```http
DELETE /api/cursos/:id
```

**Descripción:** Elimina un curso de la base de datos.

**Autenticación:** ✓ Requiere token de admin

**Parámetros:**
- `id` (path): ID del curso (entero)

**Headers:**
```
Authorization: Bearer <token_admin>
```

**Response (200):**
```json
{
  "message": "Curso eliminado exitosamente",
  "id": 1
}
```

**Error (404):**

**⚠️ IMPORTANTE:** Al eliminar un curso, se eliminan automáticamente TODOS sus registros en `cursos_usuarios` (por CASCADE).
```json
{
  "error": "Curso no encontrado",
  "code": "COURSE_NOT_FOUND"
}
```

---

## 📌 Casos de Uso en Frontend

### ⭐ CASO 1: USUARIO NORMAL - Ve SOLO sus cursos (FILTRADO POR SU ÁREA)
```javascript
// Después de loguear, el usuario recibe:
const usuarioLogueado = {
  id: 1,
  nombre: "Carlos",
  email: "carlos@gmail.com",
  areaId: 5,  // ← El usuario pertenece al área 5
  rol: "usuario",
  token: "eyJhbGc..."
};

// Guardar en localStorage
localStorage.setItem('user', JSON.stringify(usuarioLogueado));

// Al cargar dashboard, hacer esta llamada:
const usuarioActual = JSON.parse(localStorage.getItem('user'));

fetch(`/api/cursos/area/${usuarioActual.areaId}`)
  .then(res => res.json())
  .then(cursos => {
    // cursos = [
    //   { id: 1, nombre: "JavaScript", areaId: 5 },
    //   { id: 3, nombre: "Python", areaId: 5 }
    // ]
    // Solo ve cursos donde areaId = 5
    console.log(cursos);
    // Renderizar los cursos del usuario
  });
```

**⚠️ IMPORTANTE:** Un usuario del área 5 NUNCA debe llamar a `/api/cursos/area/3`. El frontend valida esto.

---

### ⭐ CASO 2: ADMIN - Ve TODOS los cursos (sin filtro)
```javascript
// Admin quiere ver el catálogo completo
const adminLogueado = {
  id: 10,
  nombre: "Admin",
  email: "admin@gmail.com",
  areaId: 1,  // Los admins pueden tener un areaId también
  rol: "admin",
  token: "eyJhbGc..."
};

// Admin llama a endpoint sin filtro:
fetch('/api/cursos')
  .then(res => res.json())
  .then(cursos => {
    // cursos = TODOS los cursos de todas las áreas
    // [
    //   { id: 1, nombre: "JavaScript", areaId: 5 },
    //   { id: 2, nombre: "Inglés", areaId: 3 },
    //   { id: 3, nombre: "Python", areaId: 5 }
    // ]
    console.log(cursos);
    // Admin ve TODO sin limitación
  });
```

---

### Caso 3: Admin crea nuevo curso en un área específica
```javascript
const nuevoFormulario = {
  nombre: "JavaScript Avanzado",
  descripcion": "Curso de JavaScript nivel avanzado",
  duracion: 20,
  categoria: "Programación",
  nivel": "Avanzado",
  areaId: 5  // ← Este curso será para usuarios del área 5
};

fetch('/api/cursos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify(nuevoFormulario)
})
.then(res => res.json())
.then(data => console.log(data));
```

---

### Caso 4: Admin mueve curso a otra área
```javascript
const cursoActualizado = {
  areaId: 7  // Cambiar de área 5 → área 7
};

fetch('/api/cursos/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify(cursoActualizado)
})
.then(res => res.json())
.then(data => console.log(data));

// Ahora el curso ID 1 es para usuarios del área 7
```

---

## ✅ Checklist para integración Frontend

### Usuarios Normales:
- [ ] Al loguear, guardar **`areaId` del usuario**
- [ ] En dashboard, llamar a `GET /api/cursos/area/${usuarioLogueado.areaId}`
- [ ] **Mostrar SOLO esos cursos** en la interfaz
- [ ] **NO permitir** que usuario del área 5 vea ni acceda a cursos del área 3
- [ ] Si intenta acceder a otra área, rechazar en el frontend

### Admins:
- [ ] En panel de administración, llamar a `GET /api/cursos`
- [ ] Ver todos los cursos de todas las áreas
- [ ] Al crear curso, pedir `areaId` en dropdown
- [ ] Al editar curso, permitir cambiar el `areaId`
- [ ] Ver usuarios agrupados por área
 
---

## ✅ Checklist Backend (Implementado)

- [x] Tabla `cursos_usuarios` creada
- [x] POST `/api/cursos` vincula usuarios automáticamente
- [x] PUT `/api/cursos/:id` re-vincula si cambia `areaId`
- [x] GET `/api/cursos/:id/usuarios` devuelve usuarios del curso
- [x] DELETE funciona con CASCADE (elimina vinculaciones)
- [x] Campo `usuariosAsignados` en respuesta de POST
- [x] Validaciones de `areaId` en POST y PUT

---

## 🔐 Control de Acceso (Frontend)

```javascript
// Validar acceso a cursos de una área
function puedeVerArea(usuarioActual, areaIdSolicitado) {
  // Si es admin, puede ver cualquier área
  if (usuarioActual.rol === 'admin') {
    return true;
  }
  
  // Si es usuario normal, solo puede ver su área
  if (usuarioActual.areaId === areaIdSolicitado) {
    return true;
  }
  
  // Rechazar acceso
  return false;
}

// Uso:
const usuarioPide = { areaId: 5, rol: 'usuario' };
if (puedeVerArea(usuarioPide, 3)) {
  // Llamar a /api/cursos/area/3
} else {
  console.error("No tienes acceso a esa área");
}
```

---

## 🔍 Relación con la Tabla de Áreas

```http
GET /api/areas
```

**Response:**
```json
[
  { "id": 1, "codigo": "PROG", "nombre": "Programación" },
  { "id": 2, "codigo": "LANG", "nombre": "Idiomas" },
  { "id": 3, "codigo": "MATH", "nombre": "Matemáticas" },
  { "id": 4, "codigo": "SCI", "nombre": "Ciencias" },
  { "id": 5, "codigo": "BUS", "nombre": "Negocios" }
]
```

---

## 🚨 Códigos de Error

| Code | HTTP | Significado |
|------|------|-------------|
| `MISSING_FIELDS` | 400 | Falta algún campo requerido |
| `INVALID_AREA` | 400 | El `areaId` no existe |
| `COURSE_NOT_FOUND` | 404 | Curso no existe |
| `INTERNAL_ERROR` | 500 | Error del servidor |

---

## 📊 Flujo Completo de Acceso

```
┌─────────────────────────┐
│  Usuario se loguea      │
└────────────┬────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  Backend devuelve:                      │
│  {                                      │
│    id: 1,                               │
│    nombre: "Carlos",                    │
│    areaId: 5  ← IMPORTANTE              │
│  }                                      │
└────────────┬────────────────────────────┘
             │
             ↓ Frontend guarda areaId
             │
    ┌────────┴─────────┐
    │                  │
    ↓                  ↓
┌─────────────┐  ┌──────────────┐
│ Usuario     │  │ Admin        │
│ Normal      │  │              │
└────┬────────┘  └──────┬───────┘
     │                  │
     ↓                  ↓
GET /api/cursos/    GET /api/cursos/
area/5              (sin filtro)
(su área)           (todas áreas)
     │                  │
     ↓                  ↓
 Solo 3 cursos      Todos los cursos
 de área 5          de todas las áreas
```

---

## 🔀 Flujo de Vinculación Automática (Muchos a Muchos)

```
┌──────────────────────────────────────┐
│  Admin crea nuevo curso              │
│  - nombre: "JavaScript"              │
│  - areaId: 5                         │
└───────────────┬──────────────────────┘
    │
    ↓
  ┌───────────────┐
  │ Backend:      │
  │ 1. Crea curso │
  │ 2. Busca      │
  │    usuarios   │
  │    areaId=5   │
  │ 3. Vincula    │
  │    c/usuario  │
  └───────┬───────┘
    │
    ↓
  ┌───────────────────┐
  │ Usuarios área 5:  │
  │ - usuario 5       │
  │ - usuario 8       │
  │ - usuario 12      │
  └───────┬───────────┘
    │
    ↓
  Tabla cursos_usuarios:
  (curso 1, usuario 5)
  (curso 1, usuario 8)
  (curso 1, usuario 12)
    │
    ↓
  Response: {
    cursoId: 1,
    usuariosAsignados: 3
  }
```

**Si cambias el área:**
```
Admin actualiza: cursoId 1, areaId: 5 → areaId: 3
  │
  ↓
1. Delete cursos_usuarios WHERE cursoId = 1
2. Select usuarios WHERE areaId = 3
3. Insert nuevos registros en cursos_usuarios
  │
  ↓
Curso ahora vinculado a usuarios del área 3
```

---

## 📝 Notas Importantes

- ⚠️ **Cada usuario tiene un `areaId` único** en su perfil
- ⚠️ **Un usuario solo puede ver cursos de su área** - El frontend debe validar esto
- ⚠️ **`areaId` es obligatorio** para cursos (Admin crea con areaId)
- ✅ **Un curso pertenece a UNA sola área**
- ✅ **Admins ven TODO sin limitación**
- ✅ **El filtrado de usuario se hace en FRONTEND** por seguridad
- ✅ **Un curso puede ser movido de área** (solo Admin)

---

## 🔗 Relación de Tablas

```
┌──────────────┐              ┌───────────┐
│   usuarios   │ (1)      (N) │  cursos   │
├──────────────┤◄──areaId─────┤───────────┤
│ id (PK)      │              │ id (PK)   │
│ nombre       │              │ nombre    │
│ email        │              │ areaId(FK)│
│ areaId(FK)───┼──────────────┤ (de áreas)│
│ rol          │   belongs    │           │
└──────────────┘              └───────────┘
       │                            │
       │ belongs                    │ belongs
       │                            │
       └────────────┬───────────────┘
                    │
                    ↓
            ┌──────────────┐
            │    areas     │
            ├──────────────┤
            │ id (PK)      │
            │ nombre       │
            │ codigo       │
            └──────────────┘
```

**Lectura:**
- Un **usuario** pertenece a **una área**
- Un **usuario** solo ve cursos de su **área**
- Un **curso** pertenece a **una área**
- Un **área** tiene muchos **usuarios** y muchos **cursos**
