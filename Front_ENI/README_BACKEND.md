# 🏗️ API Backend - Sistema de Gestión de Cursos ENI-360

Este documento especifica los endpoints que debe implementar el backend para el sistema de gestión de cursos del frontend de ENI-360.

## 🚀 Configuración del Servidor

- **Puerto:** 3000
- **Base URL:** `http://localhost:3000`
- **CORS:** Debe permitir peticiones desde `http://localhost:5173` (puerto del frontend)

## 🔐 Autenticación

Los endpoints marcados con 🔒 requieren autenticación JWT en el header:
```
Authorization: Bearer <token>
```

## 📚 ENDPOINTS DE CURSOS

### 1. Obtener Todos los Cursos
**GET** `/api/cursos`

**Autenticación:** ❌ No requerida

**Respuesta Exitosa (200):**
```json
[
  {
    "id": 1,
    "nombre": "Introducción a JavaScript",
    "descripcion": "Aprende los fundamentos de JavaScript",
    "duracion": 40,
    "categoria": "Programación",
    "nivel": "Básico",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  },
  {
    "id": 2,
    "nombre": "React Avanzado",
    "descripcion": "Técnicas avanzadas con React",
    "duracion": 60,
    "categoria": "Programación",
    "nivel": "Avanzado",
    "created_at": "2024-01-16T10:00:00Z",
    "updated_at": "2024-01-16T10:00:00Z"
  }
]
```

**Respuesta Vacía (200):**
```json
[]
```

### 2. Crear Nuevo Curso 🔒
**POST** `/api/cursos`

**Autenticación:** ✅ Requerida (Solo Administradores)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body:**
```json
{
  "nombre": "Nombre del Curso",
  "descripcion": "Descripción detallada del curso",
  "duracion": 30,
  "categoria": "Programación",
  "nivel": "Intermedio"
}
```

**Validaciones:**
- `nombre`: string, requerido, máximo 255 caracteres
- `descripcion`: string, requerido
- `duracion`: number, requerido, mínimo 1
- `categoria`: string, requerido (Programación, Idiomas, Matemáticas, Ciencias, Negocios, Arte, Otro)
- `nivel`: string, requerido (Básico, Intermedio, Avanzado)

**Respuesta Exitosa (201):**
```json
{
  "id": 3,
  "nombre": "Nuevo Curso",
  "descripcion": "Descripción del curso",
  "duracion": 30,
  "categoria": "Programación",
  "nivel": "Intermedio",
  "created_at": "2024-01-17T10:00:00Z",
  "updated_at": "2024-01-17T10:00:00Z"
}
```

**Errores Posibles:**
- `400 Bad Request`: Datos inválidos
- `401 Unauthorized`: Token inválido o expirado
- `403 Forbidden`: Usuario no es administrador

### 3. Actualizar Curso 🔒
**PUT** `/api/cursos/{id}`

**Autenticación:** ✅ Requerida (Solo Administradores)

**Parámetros URL:**
- `id`: ID del curso a actualizar

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body:** (mismos campos que creación, todos opcionales)
```json
{
  "nombre": "Nombre Actualizado",
  "duracion": 40
}
```

**Respuesta Exitosa (200):**
```json
{
  "id": 1,
  "nombre": "Nombre Actualizado",
  "descripcion": "Descripción original",
  "duracion": 40,
  "categoria": "Programación",
  "nivel": "Básico",
  "updated_at": "2024-01-17T11:00:00Z"
}
```

**Errores Posibles:**
- `400 Bad Request`: Datos inválidos
- `401 Unauthorized`: Token inválido
- `403 Forbidden`: Usuario no es administrador
- `404 Not Found`: Curso no existe

### 4. Eliminar Curso 🔒
**DELETE** `/api/cursos/{id}`

**Autenticación:** ✅ Requerida (Solo Administradores)

**Parámetros URL:**
- `id`: ID del curso a eliminar

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Curso eliminado exitosamente",
  "id": 1
}
```

**Errores Posibles:**
- `401 Unauthorized`: Token inválido
- `403 Forbidden`: Usuario no es administrador
- `404 Not Found`: Curso no existe

## 📝 ENDPOINTS DE INSCRIPCIONES

### 5. Inscribirse a un Curso 🔒
**POST** `/api/inscripciones`

**Autenticación:** ✅ Requerida (Estudiantes)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body:**
```json
{
  "curso_id": 1
}
```

**Validaciones:**
- `curso_id`: number, requerido, debe existir en la tabla de cursos

**Respuesta Exitosa (201):**
```json
{
  "id": 1,
  "usuario_id": 123,
  "curso_id": 1,
  "fecha_inscripcion": "2024-01-17T12:00:00Z",
  "estado": "activo"
}
```

**Errores Posibles:**
- `400 Bad Request`: curso_id inválido o faltante
- `401 Unauthorized`: Token inválido
- `404 Not Found`: Curso no existe
- `409 Conflict`: Usuario ya inscrito en este curso

### 6. Obtener Inscripciones del Usuario 🔒
**GET** `/api/inscripciones/usuario`

**Autenticación:** ✅ Requerida (Estudiantes)

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta Exitosa (200):**
```json
[
  {
    "id": 1,
    "usuario_id": 123,
    "curso_id": 1,
    "fecha_inscripcion": "2024-01-17T12:00:00Z",
    "estado": "activo",
    "curso": {
      "id": 1,
      "nombre": "Introducción a JavaScript",
      "descripcion": "Aprende los fundamentos de JavaScript",
      "duracion": 40,
      "precio": 99.99,
      "categoria": "Programación",
      "nivel": "Básico"
    }
  }
]
```

**Respuesta Vacía (200):**
```json
[]
```

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### Tabla: `cursos`
```sql
CREATE TABLE cursos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  duracion INTEGER NOT NULL CHECK (duracion > 0),
  categoria VARCHAR(50) NOT NULL,
  nivel VARCHAR(20) NOT NULL CHECK (nivel IN ('Básico', 'Intermedio', 'Avanzado')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: `inscripciones`
```sql
CREATE TABLE inscripciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'completado', 'cancelado')),
  UNIQUE(usuario_id, curso_id)
);
```

### Tabla: `usuarios` (referencia)
```sql
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('Administrador', 'Estudiante')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🛡️ MIDDLEWARE DE AUTENTICACIÓN

Implementa un middleware que:
1. Verifique el header `Authorization: Bearer <token>`
2. Valide el JWT token
3. Extraiga la información del usuario del token
4. Verifique permisos de administrador cuando sea necesario
5. Adjunte la información del usuario al objeto `req.user`

## ⚠️ MANEJO DE ERRORES

Todos los endpoints deben retornar errores en formato JSON:

```json
{
  "error": "Mensaje descriptivo del error",
  "code": "ERROR_CODE"
}
```

## 🧪 PRUEBAS RECOMENDADAS

### 1. Crear un curso (Admin)
```bash
curl -X POST http://localhost:3000/api/cursos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "nombre": "Test Course",
    "descripcion": "Test Description",
    "duracion": 20,
    "categoria": "Programación",
    "nivel": "Básico"
  }'
```

### 2. Obtener cursos (sin auth)
```bash
curl http://localhost:3000/api/cursos
```

### 3. Inscribirse a un curso (Estudiante)
```bash
curl -X POST http://localhost:3000/api/inscripciones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -d '{"curso_id": 1}'
```

## 📋 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Puerto 3000 configurado
- [ ] CORS habilitado para localhost:5173
- [ ] Middleware de autenticación JWT implementado
- [ ] Validación de permisos de administrador
- [ ] Todas las rutas implementadas
- [ ] Validaciones de datos implementadas
- [ ] Manejo de errores consistente
- [ ] Base de datos creada con las tablas especificadas

¡Una vez implementados todos estos endpoints, el frontend funcionará completamente! 🎉