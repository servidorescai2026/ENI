# 🔄 CAMBIO REQUERIDO - Eliminación del Campo Precio

## 📋 Resumen

El campo `precio` ha sido eliminado del sistema de gestión de cursos. El backend debe ser actualizado para **remover completamente** este campo de los endpoints de cursos.

---

## 🚨 Cambios Requeridos en el Backend

### 1. Endpoint: `POST /api/cursos` (Crear Curso)

#### ❌ Body Actual (ANTES):
```json
{
  "nombre": "Nombre del Curso",
  "descripcion": "Descripción detallada del curso",
  "duracion": 30,
  "precio": 79.99,
  "categoria": "Programación",
  "nivel": "Intermedio"
}
```

#### ✅ Body Nuevo (DESPUÉS):
```json
{
  "nombre": "Nombre del Curso",
  "descripcion": "Descripción detallada del curso",
  "duracion": 30,
  "categoria": "Programación",
  "nivel": "Intermedio"
}
```

**Cambios:**
- ❌ Eliminar campo `precio` del body
- ❌ Eliminar validación de `precio`
- ❌ Eliminar campo `precio` de la respuesta

---

### 2. Endpoint: `PUT /api/cursos/{id}` (Actualizar Curso)

#### ❌ Body Actual (ANTES):
```json
{
  "nombre": "Nombre Actualizado",
  "precio": 89.99
}
```

#### ✅ Body Nuevo (DESPUÉS):
```json
{
  "nombre": "Nombre Actualizado",
  "descripcion": "Nueva descripción",
  "duracion": 40,
  "categoria": "Programación",
  "nivel": "Básico"
}
```

**Cambios:**
- ❌ Eliminar campo `precio` del body
- ❌ Eliminar validación de `precio`
- ❌ Ignorar si se envía `precio` (puede ignorarse sin error, pero preferible rechazarlo)

---

### 3. Endpoint: `GET /api/cursos` (Obtener Cursos)

#### ❌ Respuesta Actual (ANTES):
```json
[
  {
    "id": 1,
    "nombre": "Introducción a JavaScript",
    "descripcion": "Aprende los fundamentos de JavaScript",
    "duracion": 40,
    "precio": 99.99,
    "categoria": "Programación",
    "nivel": "Básico",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
]
```

#### ✅ Respuesta Nueva (DESPUÉS):
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
  }
]
```

**Cambios:**
- ❌ Eliminar campo `precio` de la respuesta JSON
- ❌ No incluir `precio` en la consulta a la base de datos

---

### 4. Endpoint: `GET /api/inscripciones/usuario` (Obtener Inscripciones)

Si este endpoint incluye información del curso en la respuesta:

#### ❌ Respuesta Actual (ANTES):
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
      "descripcion": "Aprende los fundamentos",
      "duracion": 40,
      "precio": 99.99,
      "categoria": "Programación",
      "nivel": "Básico"
    }
  }
]
```

#### ✅ Respuesta Nueva (DESPUÉS):
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
      "descripcion": "Aprende los fundamentos",
      "duracion": 40,
      "categoria": "Programación",
      "nivel": "Básico"
    }
  }
]
```

**Cambios:**
- ❌ Eliminar campo `precio` del objeto `curso` dentro de la respuesta

---

## 🗄️ Cambios en la Base de Datos

### Opción 1: Eliminar Columna (Recomendado)

Si es posible hacer migración, eliminar la columna `precio` de la tabla `cursos`:

```sql
-- PostgreSQL
ALTER TABLE cursos DROP COLUMN precio;

-- MySQL
ALTER TABLE cursos DROP COLUMN precio;

-- SQLite
-- SQLite no soporta DROP COLUMN directamente, requiere recrear tabla
```

### Opción 2: Mantener Columna pero No Usarla

Si no se puede eliminar la columna inmediatamente:

1. ✅ No incluir `precio` en los SELECT
2. ✅ No incluir `precio` en los INSERT
3. ✅ No incluir `precio` en los UPDATE
4. ✅ Ignorar el campo si existe en la tabla

**Ejemplo de consulta (sin precio):**
```sql
-- En lugar de:
SELECT id, nombre, descripcion, duracion, precio, categoria, nivel FROM cursos;

-- Usar:
SELECT id, nombre, descripcion, duracion, categoria, nivel FROM cursos;
```

---

## 📝 Validaciones Actualizadas

### Validaciones Requeridas (Sin Precio):

```javascript
// Validaciones que DEBEN permanecer:
- nombre: string, requerido, máximo 255 caracteres
- descripcion: string, requerido
- duracion: number, requerido, mínimo 1
- categoria: string, requerido (Programación, Idiomas, Matemáticas, Ciencias, Negocios, Arte, Otro)
- nivel: string, requerido (Básico, Intermedio, Avanzado)

// Validaciones que DEBEN eliminarse:
- precio: (ELIMINAR COMPLETAMENTE)
```

---

## 🔧 Ejemplos de Código

### Node.js/Express

```javascript
// models/Curso.js - Schema actualizado
const cursoSchema = {
  nombre: { type: String, required: true, maxlength: 255 },
  descripcion: { type: String, required: true },
  duracion: { type: Number, required: true, min: 1 },
  // precio: { ELIMINAR ESTA LÍNEA }
  categoria: { type: String, required: true },
  nivel: { type: String, required: true, enum: ['Básico', 'Intermedio', 'Avanzado'] }
};

// controllers/cursosController.js
exports.crearCurso = async (req, res) => {
  try {
    const { nombre, descripcion, duracion, categoria, nivel } = req.body;
    
    // Validaciones (sin precio)
    if (!nombre || !descripcion || !duracion || !categoria || !nivel) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    
    if (duracion <= 0) {
      return res.status(400).json({ error: 'La duración debe ser mayor a 0' });
    }
    
    const nuevoCurso = await Curso.create({
      nombre,
      descripcion,
      duracion,
      // precio, // ELIMINAR
      categoria,
      nivel
    });
    
    res.status(201).json(nuevoCurso);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Python/Django

```python
# models.py
class Curso(models.Model):
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField()
    duracion = models.IntegerField()
    # precio = models.DecimalField(...)  # ELIMINAR
    categoria = models.CharField(max_length=50)
    nivel = models.CharField(max_length=20)
    
    class Meta:
        db_table = 'cursos'

# serializers.py
class CursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curso
        fields = ['id', 'nombre', 'descripcion', 'duracion', 'categoria', 'nivel', 'created_at', 'updated_at']
        # 'precio' ELIMINADO de fields

# views.py
class CursoViewSet(viewsets.ModelViewSet):
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer
    
    def get_queryset(self):
        return Curso.objects.all().values('id', 'nombre', 'descripcion', 'duracion', 'categoria', 'nivel', 'created_at', 'updated_at')
        # 'precio' ELIMINADO del values()
```

### PHP/Laravel

```php
// Curso.php - Model
class Curso extends Model {
    protected $fillable = [
        'nombre',
        'descripcion',
        'duracion',
        // 'precio', // ELIMINAR
        'categoria',
        'nivel'
    ];
    
    protected $hidden = [
        // 'precio' // ELIMINAR si estaba oculto
    ];
}

// CursoController.php
public function store(Request $request) {
    $validated = $request->validate([
        'nombre' => 'required|string|max:255',
        'descripcion' => 'required|string',
        'duracion' => 'required|integer|min:1',
        // 'precio' => 'required|numeric|min:0', // ELIMINAR
        'categoria' => 'required|string',
        'nivel' => 'required|in:Básico,Intermedio,Avanzado'
    ]);
    
    $curso = Curso::create($validated);
    
    return response()->json($curso, 201);
}
```

---

## ⚠️ Manejo de Errores

Si el frontend envía `precio` por error:

**Opción 1 (Recomendada):** Ignorar silenciosamente el campo
```javascript
// Extraer solo los campos válidos
const { precio, ...cursoData } = req.body;
// Usar cursoData sin precio
```

**Opción 2:** Rechazar con error
```javascript
if (req.body.precio !== undefined) {
  return res.status(400).json({ 
    error: 'El campo precio no está permitido',
    code: 'FIELD_NOT_ALLOWED'
  });
}
```

---

## 🧪 Casos de Prueba

### ✅ Crear curso sin precio:
```bash
curl -X POST http://localhost:3000/api/cursos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "nombre": "Curso de Prueba",
    "descripcion": "Descripción del curso",
    "duracion": 30,
    "categoria": "Programación",
    "nivel": "Básico"
  }'
# ✅ Debe crear el curso exitosamente
```

### ✅ Obtener cursos sin precio en respuesta:
```bash
curl http://localhost:3000/api/cursos
# ✅ La respuesta NO debe incluir el campo "precio"
```

### ✅ Actualizar curso sin precio:
```bash
curl -X PUT http://localhost:3000/api/cursos/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "nombre": "Curso Actualizado",
    "duracion": 40
  }'
# ✅ Debe actualizar sin problemas (sin precio)
```

---

## 📋 Checklist de Implementación

- [ ] Eliminar campo `precio` del modelo/schema de cursos
- [ ] Eliminar validación de `precio` en POST `/api/cursos`
- [ ] Eliminar validación de `precio` en PUT `/api/cursos/{id}`
- [ ] Eliminar campo `precio` de las respuestas GET `/api/cursos`
- [ ] Eliminar campo `precio` de las respuestas GET `/api/inscripciones/usuario` (si aplica)
- [ ] Actualizar consultas SQL para no incluir `precio` en SELECT
- [ ] Actualizar INSERT para no incluir `precio`
- [ ] Actualizar UPDATE para no incluir `precio`
- [ ] Eliminar columna `precio` de la base de datos (opcional, recomendado)
- [ ] Probar todos los endpoints después de los cambios
- [ ] Verificar que las respuestas JSON no incluyan `precio`

---

## 🎯 Resumen Final

**CAMPO ELIMINADO:** `precio`

**ENDPOINTS AFECTADOS:**
- ✅ `POST /api/cursos` - No aceptar ni validar `precio`
- ✅ `PUT /api/cursos/{id}` - No aceptar ni validar `precio`
- ✅ `GET /api/cursos` - No incluir `precio` en respuesta
- ✅ `GET /api/inscripciones/usuario` - No incluir `precio` en objeto `curso`

**PRIORIDAD:** 🔴 Alta - El frontend ya no envía ni espera este campo

---

**Fecha:** 2025-01-14  
**Estado:** ⚠️ Cambio requerido para sincronización frontend-backend