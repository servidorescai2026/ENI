# Inscripciones de Capacitación

Esta sección documenta la tabla `inscripciones_capacitacion` que almacena información detallada sobre las capacitaciones en las que están inscritos los usuarios (formadores).

## 📋 Estructura de la tabla

`inscripciones_capacitacion` es una tabla intermedia que vincula a usuarios con su información de capacitación:

| Campo | Tipo | Nulo | Descripción |
|-------|------|------|-------------|
| `id` | INT | No | Identificador único (AUTO_INCREMENT) |
| `usuarioId` | INT | No | FK a tabla usuarios |
| `denominacion_capacitacion` | VARCHAR(255) | Sí | Nombre de la capacitación |
| `fecha_inicio_cap` | DATE | Sí | Fecha de inicio de la capacitación |
| `fecha_fin_cap` | DATE | Sí | Fecha de finalización de la capacitación |
| `fecha_diligenciamiento` | DATE | Sí | Fecha de dilligenciamiento del reporte |
| `opcion_plan_multiplicacion` | VARCHAR(255) | Sí | Opción del plan de multiplicación |
| `acta_compromiso` | VARCHAR(100) | Sí | Información del acta de compromiso |
| `fecha_multiplicacion` | DATE | Sí | Fecha en que se realizó la multiplicación |
| `validacion_plan` | TEXT | Sí | Validación del plan de multiplicación ejecutado |
| `nombre_delegado_seguimiento` | VARCHAR(150) | Sí | Nombre del subdirector/delegado que hace seguimiento |
| `descripcion_plan` | TEXT | Sí | Descripción breve del plan de multiplicación |
| `link_evidencias` | VARCHAR(255) | Sí | Link a las evidencias para consulta |

## 🔌 Endpoints

### Obtener todas las inscripciones
```
GET /api/inscripciones-capacitacion
```
- **Autenticación**: Requerida (admin)
- **Headers**: `Authorization: Bearer <token>`
- **Respuesta**: Array de todas las inscripciones de capacitación

### Obtener inscripción por ID
```
GET /api/inscripciones-capacitacion/:id
```
- **Autenticación**: Requerida
- **Parámetros**: `id` (identificador de la inscripción)
- **Respuesta**: Objeto con detalles de la inscripción

### Obtener inscripciones de un usuario
```
GET /api/inscripciones-capacitacion/usuario/:usuarioId
```
- **Autenticación**: Requerida
- **Parámetros**: `usuarioId` (identificador del usuario)
- **Respuesta**: Array de inscripciones del usuario

### Crear nueva inscripción
```
POST /api/inscripciones-capacitacion
```
- **Autenticación**: Requerida (admin)
- **Body** (JSON):
```json
{
  "usuarioId": 1,
  "denominacion_capacitacion": "Capacitación en ...",
  "fecha_inicio_cap": "2024-01-15",
  "fecha_fin_cap": "2024-02-15",
  "fecha_diligenciamiento": "2024-02-20",
  "opcion_plan_multiplicacion": "Opción A",
  "acta_compromiso": "SI/NO",
  "fecha_multiplicacion": "2024-03-01",
  "validacion_plan": "Plan validado...",
  "nombre_delegado_seguimiento": "Nombre del delegado",
  "descripcion_plan": "Descripción del plan...",
  "link_evidencias": "https://link-evidencias.com"
}
```

### Actualizar inscripción
```
PUT /api/inscripciones-capacitacion/:id
```
- **Autenticación**: Requerida (admin)
- **Parámetros**: `id` (identificador de la inscripción)
- **Body**: Mismo formato que POST (parcial o completo)

### Eliminar inscripción
```
DELETE /api/inscripciones-capacitacion/:id
```
- **Autenticación**: Requerida (admin)
- **Parámetros**: `id` (identificador de la inscripción)

## 🔗 Relaciones

- **Usuario**: Una relación 1:N. Un usuario puede tener múltiples inscripciones de capacitación.

## 💡 Ejemplo de uso en el flujo

1. Se carga un usuario desde el bulk upload de Excel
2. Se crea una inscripción de capacitación asociada a ese usuario
3. Se almacenan detalles de su formación, plan de multiplicación y evidencias
4. Los administradores pueden consultar el historial de capacitaciones por usuario
