# Cambios Requeridos en Backend - Gestión de Cursos por Área

## Resumen
El frontend ahora permite asignar cada curso a un **área/red específica**. El backend debe guardar este `areaId` en la tabla de cursos.

## Cambios en la Base de Datos

### Tabla: `cursos`
Se agregó una nueva columna:
```sql
ALTER TABLE cursos ADD COLUMN areaId INT;
ALTER TABLE cursos ADD CONSTRAINT fk_cursos_areaId 
FOREIGN KEY (areaId) REFERENCES areas(id);
```

**Nota:** Si la columna `arealcls` existe, eliminarla:
```sql
ALTER TABLE cursos DROP COLUMN IF EXISTS arealcls;
```

---

## Cambios en la API

### Endpoint: `POST /api/cursos` (Crear Curso)

#### Petición recibida del Frontend:
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

#### Cambio requerido en el Backend:
El backend debe:
1. **Recibir el campo `areaId`** de la petición
2. **Validar que el `areaId` exista** en la tabla `areas`
3. **Guardar el `areaId`** en la tabla `cursos` junto con los otros datos

#### Ejemplo de INSERT SQL (actualmente):
```sql
INSERT INTO cursos (nombre, descripcion, duracion, categoria, nivel) 
VALUES ('JavaScript Avanzado', 'Curso de JavaScript nivel avanzado', 20, 'Programación', 'Avanzado');
```

#### INSERT SQL corregido (DEBE SER):
```sql
INSERT INTO cursos (nombre, descripcion, duracion, categoria, nivel, areaId) 
VALUES ('JavaScript Avanzado', 'Curso de JavaScript nivel avanzado', 20, 'Programación', 'Avanzado', 5);
```

---

### Endpoint: `PUT /api/cursos/:id` (Actualizar Curso)

#### Petición recibida del Frontend:
```json
{
  "nombre": "JavaScript Avanzado",
  "descripcion": "Curso de JavaScript nivel avanzado",
  "duracion": 20,
  "categoria": "Programación",
  "nivel": "Avanzado",
  "areaId": 7
}
```

#### Cambio requerido:
El backend debe actualizar también el campo `areaId`:

```sql
UPDATE cursos 
SET nombre = ?, descripcion = ?, duracion = ?, categoria = ?, nivel = ?, areaId = ?
WHERE id = ?;
```

---

### Endpoint: `GET /api/cursos` (Listar Cursos)

#### Cambio requerido:
Incluir el campo `areaId` en la respuesta:

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
    "created_at": "2026-02-07 18:07:47"
  }
]
```

---

## Validaciones Requeridas

1. ✅ **`areaId` es obligatorio** - Si no se envía, rechazar con error 400
2. ✅ **`areaId` debe existir** - Validar que exists en tabla `areas`
3. ✅ **Todos los campos previos siguen siendo obligatorios:**
   - `nombre` (string, requerido)
   - `descripcion` (string, requerido)
   - `duracion` (number > 0, requerido)
   - `categoria` (string, requerido)
   - `nivel` (string, requerido)

---

## Ejemplo de Respuesta de Error (si areaId es inválido)

```json
{
  "error": "El área especificada no existe",
  "status": 400
}
```

---

## Checklist para el Backend

- [ ] Columna `areaId` existe en tabla `cursos`
- [ ] POST `/api/cursos` recibe `areaId`
- [ ] POST `/api/cursos` valida que `areaId` existe
- [ ] POST `/api/cursos` guarda `areaId` en la BD
- [ ] PUT `/api/cursos/:id` recibe y actualiza `areaId`
- [ ] GET `/api/cursos` devuelve `areaId` en la respuesta
- [ ] Las validaciones rechazan si `areaId` falta o es inválido

---

## Diferencia con Notificaciones

**Notificaciones:** Pueden ser para múltiples áreas (`areaIds` = array JSON)  
**Cursos:** Son para **UNA sola área** (`areaId` = número entero)

---

último Updated: 2026-02-07
