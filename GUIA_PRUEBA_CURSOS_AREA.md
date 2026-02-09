# Guía de Prueba: Filtrado de Cursos por Área

## Resumen de cambios implementados

Se han realizó las siguientes correcciones para que los formadores vean solo los cursos de su área:

### Backend
1. ✅ Modelo `Usuario`: Agregado campo `areaId` y rol "Formador"
2. ✅ Endpoint `/api/usuarios/login`: Ahora retorna `areaId` en la respuesta y en el JWT
3. ✅ Endpoint `/api/cursos/mios`: Nuevo endpoint que devuelve solo cursos del usuario autenticado y su área
4. ✅ Controlador `cursosUsuarioController.js`: Ahora filtra por área

### Frontend
1. ✅ Nuevo servicio `GetMyCourses.jsx`: Llama al endpoint `/api/cursos/mios`
2. ✅ Nuevo componente `VerificarMisCursos.jsx`: Página para que formadores vean sus cursos
3. ✅ `main.jsx`: Ruta `/verificar-mis-cursos` agregada
4. ✅ `Usuario.jsx`: Botón "Verificar mis cursos" para formadores

## Pasos para Probar

### Paso 1: Preparar Datos en la Base de Datos

Asegúrate de que:
- [ ] Existe al menos 1 Área (ej: "Programación")
- [ ] Existe un Usuario con rol "Formador" asignado a esa área
- [ ] Existen 2-3 Cursos asignados a esa área

```sql
-- Ejemplo de consulta para verificar datos
SELECT u.id, u.nombre, u.rol, u.areaId, a.nombre as areaNombre
FROM usuarios u
LEFT JOIN areas a ON u.areaId = a.id
WHERE u.rol = 'Formador';

SELECT c.id, c.nombre, c.areaId, a.nombre as areaNombre
FROM cursos c
LEFT JOIN areas a ON c.areaId = a.id;
```

### Paso 2: Iniciar Sesión como Formador

1. Ve a `http://localhost:5173/login` (o tu URL del frontend)
2. Ingresa credenciales de un usuario con rol "Formador"
3. Completa el reCAPTCHA
4. Inicia sesión

### Paso 3: Verificar que areaId se guardó correctamente

1. Abre la consola del navegador (F12)
2. en la pestaña Console, escribe:
   ```javascript
   console.log(JSON.parse(localStorage.getItem("usuario")));
   ```
3. Verifica que aparezca el campo `areaId` con el ID del área

**Resultado esperado:**
```javascript
{
  id: 1,
  nombre: "Juan",
  apellido: "Pérez",
  email: "juan@ejemplo.com",
  rol: "Formador",
  areaId: 1,  // ← Debe estar presente
  categoria: null
}
```

### Paso 4: Ir a "Verificar mis cursos"

1. En el panel de usuario, deberías ver un botón azul "📋 Verificar mis cursos"
2. (Si no aparece, verifica que `usuario.rol === "Formador"`)
3. Haz clic en ese botón
4. Deberías ir a la URL: `http://localhost:5173/verificar-mis-cursos`

### Paso 5: Verificar que solo muestra cursos del área

1. En la página "Mis Cursos Asignados", deberías ver:
   - Un header con "Área ID: [tu-area-id]"
   - Una lista de cursos
   - Todos los cursos mostrados deben tener el mismo `areaId` que el usuario

**Resultado esperado:**
- Si tienes 3 cursos en tu área, pero 10 cursos en total en la BD, solo verás 3

### Paso 6: Probar el endpoint directamente (Postman/Insomnia)

Si quieres verificar que el endpoint funciona correctamente:

1. Copia tu token JWT del localStorage
2. En Postman/Insomnia:
   - URL: `GET http://localhost:3000/api/cursos/mios`
   - Headers:
     ```
     Authorization: Bearer <tu-token-aqui>
     Content-Type: application/json
     ```
3. Envía la solicitud
4. Deberías recibir un JSON con solo los cursos de tu área

**Resultado esperado:**
```json
[
  {
    "id": 1,
    "nombre": "Curso de JavaScript",
    "descripcion": "...",
    "duracion": 40,
    "categoria": "Programación",
    "nivel": "Intermedio",
    "areaId": 1,  // ← Coincide con tu área
    "usuarioId": 1,
    "created_at": "2025-02-07T10:00:00.000Z",
    "updated_at": "2025-02-07T10:00:00.000Z"
  },
  // ... más cursos solo del área 1
]
```

### Paso 7: Verificar que otros endpoints aún funcionan

- [ ] `/api/cursos` (todos los cursos): GET sin autenticación
- [ ] `/api/cursos/area/:areaId` (cursos de un área): GET sin autenticación  
- [ ] `/api/cursos/mios` (mis cursos): GET con token de formador
- [ ] `/api/cursos/:id/usuarios`: Usuarios de un curso específico

## Pruebas Negativas (Lo que NO debería pasar)

1. **Un Formador no debería ver todo**
   - Si creas un curso en área 2, y el formador es del área 1
   - El formador NO debería verlo en "Verificar mis cursos"

2. **Un Formador no puede acceder a datos de otro área**
   - Aunque sepa la URL, la protección está en el backend

3. **Estudiantes y Administradores**
   - Estudiantes no pueden acceder a `/verificar-mis-cursos`
   - Administradores pueden ver todos los cursos en Gestión de Cursos

## Solución de Problemas

### Problema: No aparece el botón "Verificar mis cursos"
- **Causa**: El usuario no tiene rol "Formador" o `usuario.rol` viene con mayúscula/minúscula inconsistente
- **Solución**: Verifica que en la BD el rol esté exactamente como "Formador"

### Problema: Falta el areaId en localStorage
- **Causa**: Backend no está retornando areaId en login
- **Solución**: Verifica que actualizaste correctamente el endpoint `/api/usuarios/login`

### Problema: La página "Verificar mis cursos" está vacía
- **Causa**: El usuario no tiene cursos, o no está asignado en `cursos_usuarios`
- **Solución**: En la BD, verifica que haya registros en `cursos_usuarios` para ese usuario

### Problema: Se ven todos los cursos en lugar de solo los del área
- **Causa**: El controlador `getCursosForUser` no está filtrando correctamente
- **Solución**: Verifica el filtro SQL en `cursosUsuarioController.js`

## Checklist Final

- [ ] Backend: Modelo Usuario tiene `areaId` y "Formador" en roles
- [ ] Backend: Login retorna `areaId`
- [ ] Backend: Endpoint `/api/cursos/mios` funciona
- [ ] Frontend: Servicio `GetMyCourses.jsx` existe
- [ ] Frontend: Componente `VerificarMisCursos.jsx` existe y está registrado
- [ ] Frontend: Usuario.jsx muestra botón solo para Formadores
- [ ] Base de datos: Usuarios Formadores tienen `areaId`
- [ ] Base de datos: Cursos tienen `areaId` correcto
- [ ] Base de datos: `cursos_usuarios` tiene asociaciones correctas

## Notas Importantes

1. Los cambios en el modelo Usuario pueden requerir una migración de base de datos si usas Sequelize migrations
2. Si la BD no tiene el campo `areaId` en la tabla usuarios, necesitarás agregarlo:
   ```sql
   ALTER TABLE usuarios ADD COLUMN areaId INT NULL;
   ALTER TABLE usuarios ADD FOREIGN KEY (areaId) REFERENCES areas(id);
   ```

3. Los cursos creados antes de estos cambios pueden no tener `areaId`. Deberás asignarlos manualmente o mediante un script SQL.
