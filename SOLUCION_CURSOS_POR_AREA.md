# Solución: Filtrado de Cursos por Área para Formadores

## Problema Identificado
Los formadores veían cursos de todas las áreas cuando verificaban sus cursos, en lugar de solo ver los cursos del área a la que pertenecen.

## Causas del Problema

1. **Modelo Usuario incompleto**: El modelo de Sequelize no tenía el campo `areaId` ni el rol "Formador"
2. **Login no devolvía areaId**: El endpoint de login no retornaba el `areaId` al cliente
3. **Controlador sin filtrado**: El controlador `getCursosForUser` devolvía TODOS los cursos del usuario sin validar que pertenecieran a su área
4. **Falta de endpoint específico**: No había un endpoint en el backend que devuelva solo los cursos del área del usuario autenticado

## Cambios Realizados

### 1. Backend - Modelo Usuario Actualizado
**Archivo**: `Backend-ENI/src/database/models/usuarios.js`

- ✅ Agregado rol "Formador" al enum de roles
- ✅ Agregado campo `areaId` con referencia a la tabla `areas`

```javascript
rol: {
  type: DataTypes.ENUM('Administrador', 'Estudiante', 'Formador'),
  defaultValue: "Estudiante",
  allowNull: false,
},
areaId: {
  type: DataTypes.INTEGER,
  allowNull: true,
  references: {
    model: 'areas',
    key: 'id'
  }
}
```

### 2. Backend - Endpoint de Login Actualizado
**Archivo**: `Backend-ENI/src/routes/usuarios.js`

- ✅ JWT ahora incluye `areaId`
- ✅ Respuesta de login ahora devuelve `areaId`

```javascript
// En el token
const token = jwt.sign(
  { id: user.id, email: user.email, nombre: user.nombre, 
    apellido: user.apellido, rol: user.rol, areaId: user.areaId },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
);

// En la respuesta
usuario: {
  id: user.id,
  nombre: user.nombre,
  apellido: user.apellido,
  email: user.email,
  rol: user.rol,
  areaId: user.areaId,
  categoria: user.categoria
}
```

### 3. Backend - Nuevo Endpoint para Mis Cursos
**Archivo**: `Backend-ENI/src/routes/cursos.js`

Agregado nuevo endpoint `GET /api/cursos/mios` que:
- ✅ Requiere autenticación
- ✅ Obtiene el areaId del usuario autenticado
- ✅ Devuelve SOLO los cursos que pertenecen a esa área

```javascript
router.get("/mios", verifyToken, async (req, res) => {
  // ... obtiene areaId del usuario autenticado
  // ... filtra cursos donde areaId = usuario.areaId
});
```

### 4. Frontend - Controlador de Cursos Actualizado
**Archivo**: `Front_ENI/server/controllers/cursosUsuarioController.js`

- ✅ Obtiene el `areaId` del usuario
- ✅ Filtra cursos para que SOLO devuelva los del área del usuario

```javascript
// Obtén el areaId del usuario
const userAreaId = usuarioQuery[0]?.areaId;

// Filtra cursos por área
SELECT c.* FROM cursos c
JOIN cursos_usuarios cu ON cu.cursoId = c.id
WHERE cu.usuarioId = :usuarioId AND c.areaId = :areaId
```

### 5. Frontend - Nuevo Servicio GetMyCourses
**Archivo**: `Front_ENI/src/services/Cursos/GetMyCourses.jsx`

Nuevo servicio que llama al endpoint `/api/cursos/mios` para obtener solo los cursos del usuario autenticado de su área.

## Cómo Usar

### Para Formadores que Verifican sus Cursos

En el componente que muestre los cursos de un formador, importa y usa:

```javascript
import GetMyCourses from "./services/Cursos/GetMyCourses";

// En useEffect o al cargar cursos
const cursos = await GetMyCourses();
```

### Para Administradores

Continúan usando `GetAllCourses()` para ver todos los cursos de todas las áreas.

### Para Estudiantes

Continúan usando `CursosDisponibles` que ya filtra correctamente por área (línea 53-69 en CursosDisponibles.jsx).

## Verificación

Para verificar que el problema está resuelto:

1. **Login**: Verifica en el localStorage que el usuario tenga `areaId`
   ```javascript
   console.log(JSON.parse(localStorage.getItem("usuario")).areaId);
   ```

2. **Endpoint /api/cursos/mios**: Probarlo en Postman/Insomnia con un token válido
   ```
   GET http://localhost:3000/api/cursos/mios
   Headers: Authorization: Bearer <token>
   ```

3. **Cursos Filtrados**: Los cursos devueltos debe tener el mismo `areaId` del usuario

## Notas Importantes

- Los cursos actualmente en la BD deben tener un `areaId` válido
- Los usuarios (formadores) deben tener un `areaId` válido
- La tabla `cursos_usuarios` asocia usuarios de un área con cursos de esa misma área
- Cuando se crea un curso en un área, se asigna automáticamente a todos los usuarios de esa área

## Próximas Validaciones

- [ ] Actualizar GUI para que formadores vean "Mis Cursos del Área"
- [ ] Agregar validación adicional en el frontend para CursosDisponibles.jsx
- [ ] Crear reportes por área para visualizar la distribución de cursos correctamente
