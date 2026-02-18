# 📁 API de Archivos - Documentación

## Descripción
API RESTful para gestionar la carga, obtención y eliminación de archivos de usuarios en el sistema ENI-360.

## Tabla de Base de Datos: `archivos`

```sql
CREATE TABLE archivos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuarioId INT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  ruta VARCHAR(500) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  tamaño BIGINT,
  descripcion TEXT,
  estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
  fechaCarga DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuarioId) REFERENCES usuarios(id)
);
```

## Campos del Modelo

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER | ID único del archivo (autoincremento) |
| `usuarioId` | INTEGER | ID del usuario propietario del archivo |
| `nombre` | STRING(255) | Nombre del archivo |
| `ruta` | STRING(500) | Ruta de almacenamiento del archivo |
| `tipo` | STRING(50) | Tipo de archivo (pdf, imagen, documento, etc.) |
| `tamaño` | BIGINT | Tamaño del archivo en bytes |
| `descripcion` | TEXT | Descripción o comentarios sobre el archivo |
| `estado` | ENUM | Estado del archivo: `pendiente`, `aprobado`, `rechazado` |
| `fechaCarga` | DATE | Fecha de carga del archivo |

## Relaciones

- **Usuario ↔ Archivo**: 1 a Muchos
  - Un usuario puede tener múltiples archivos
  - Los archivos pertenecen a un usuario específico

## Endpoints

### 1️⃣ Obtener archivos de un usuario
```
GET /api/archivos/usuario/:usuarioId
```
**Headers requeridos:**
- `Authorization: Bearer <token>`

**Response exitoso (200):**
```json
{
  "success": true,
  "message": "Archivos obtenidos correctamente",
  "data": [
    {
      "id": 1,
      "usuarioId": 5,
      "nombre": "Evidencia_Proyecto.pdf",
      "ruta": "/uploads/notificaciones/evidencia_123.pdf",
      "tipo": "pdf",
      "tamaño": 2048000,
      "descripcion": "Evidencia del proyecto final",
      "estado": "pendiente",
      "fechaCarga": "2026-02-03T10:30:00.000Z",
      "usuario": {
        "id": 5,
        "nombre": "Juan Pérez",
        "email": "juan@eni.edu.co"
      }
    }
  ]
}
```

---

### 2️⃣ Obtener todos los archivos (Admin)
```
GET /api/archivos
```
**Headers requeridos:**
- `Authorization: Bearer <token>`

**Response exitoso (200):**
```json
{
  "success": true,
  "message": "Todos los archivos obtenidos correctamente",
  "data": [...]
}
```

---

### 3️⃣ Obtener un archivo por ID
```
GET /api/archivos/:id
```
**Headers requeridos:**
- `Authorization: Bearer <token>`

**Response exitoso (200):**
```json
{
  "success": true,
  "message": "Archivo obtenido correctamente",
  "data": {
    "id": 1,
    "usuarioId": 5,
    "nombre": "Evidencia_Proyecto.pdf",
    "ruta": "/uploads/notificaciones/evidencia_123.pdf",
    "tipo": "pdf",
    "tamaño": 2048000,
    "descripcion": "Evidencia del proyecto final",
    "estado": "pendiente",
    "fechaCarga": "2026-02-03T10:30:00.000Z",
    "usuario": {
      "id": 5,
      "nombre": "Juan Pérez",
      "email": "juan@eni.edu.co"
    }
  }
}
```

**Response error (404):**
```json
{
  "success": false,
  "message": "Archivo no encontrado"
}
```

---

### 4️⃣ Actualizar estado de un archivo
```
PUT /api/archivos/:id
```
**Headers requeridos:**
- `Authorization: Bearer <token>`

**Body (JSON):**
```json
{
  "estado": "aprobado",
  "descripcion": "Archivo revisado y aprobado correctamente"
}
```

**Estados válidos:** `pendiente`, `aprobado`, `rechazado`

**Response exitoso (200):**
```json
{
  "success": true,
  "message": "Archivo actualizado correctamente",
  "data": {
    "id": 1,
    "usuarioId": 5,
    "nombre": "Evidencia_Proyecto.pdf",
    "ruta": "/uploads/notificaciones/evidencia_123.pdf",
    "tipo": "pdf",
    "tamaño": 2048000,
    "descripcion": "Archivo revisado y aprobado correctamente",
    "estado": "aprobado",
    "fechaCarga": "2026-02-03T10:30:00.000Z"
  }
}
```

**Response error (400):**
```json
{
  "success": false,
  "message": "Estado inválido. Debe ser: pendiente, aprobado o rechazado"
}
```

---

### 5️⃣ Eliminar un archivo
```
DELETE /api/archivos/:id
```
**Headers requeridos:**
- `Authorization: Bearer <token>`

**Response exitoso (200):**
```json
{
  "success": true,
  "message": "Archivo eliminado correctamente"
}
```

**Response error (404):**
```json
{
  "success": false,
  "message": "Archivo no encontrado"
}
```

---

### 6️⃣ Obtener estadísticas de archivos
```
GET /api/archivos/stats/resumen
```
**Headers requeridos:**
- `Authorization: Bearer <token>`

**Response exitoso (200):**
```json
{
  "success": true,
  "message": "Estadísticas obtenidas correctamente",
  "data": [
    {
      "estado": "pendiente",
      "cantidad": 5
    },
    {
      "estado": "aprobado",
      "cantidad": 12
    },
    {
      "estado": "rechazado",
      "cantidad": 2
    }
  ]
}
```

---

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | Solicitud exitosa |
| 400 | Solicitud inválida (datos malformados) |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

---

## Ejemplos de Uso

### Obtener archivos de un usuario específico
```bash
curl -X GET http://localhost:3000/api/archivos/usuario/5 \
  -H "Authorization: Bearer tu_token_aqui"
```

### Aprobar un archivo
```bash
curl -X PUT http://localhost:3000/api/archivos/1 \
  -H "Authorization: Bearer tu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "aprobado",
    "descripcion": "Archivo aprobado"
  }'
```

### Eliminar un archivo
```bash
curl -X DELETE http://localhost:3000/api/archivos/1 \
  -H "Authorization: Bearer tu_token_aqui"
```

---

## Notas Importantes

1. **Autenticación**: Todos los endpoints requieren un token JWT válido
2. **Estados**: Solo se aceptan los estados: `pendiente`, `aprobado`, `rechazado`
3. **Almacenamiento**: Los archivos se guardan en la carpeta `/uploads/notificaciones/`
4. **Relación con Usuarios**: Cada archivo está vinculado a un usuario específico mediante `usuarioId`
5. **Timestamps**: Los archivos se crean con `fechaCarga` automática
