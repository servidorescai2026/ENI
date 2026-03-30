# Importación en lote (Batch Upload) - Usuarios y Capacitaciones

Esta funcionalidad permite a un administrador subir un archivo Excel o CSV con múltiples usuarios y, en el mismo archivo, registrar información en `inscripciones_capacitacion`.

## 💡 Requisitos del archivo

El archivo debe contener al menos una hoja con filas que incluyan las siguientes columnas (sensibles a mayúsculas/minúsculas):

- `nombre` (o `Nombre`) **o bien** una sola columna `NOMBRE INSTRUCTOR`/`Nombre Instructor` con el nombre completo.
- `apellido` (o `Apellido`). Si no existe y el nombre completo incluye espacios se separará automáticamente.
- `email` (o `Email`, `CORREO`, `correo`, etc.)
  - Si no se proporciona correo y sí aparece `DOCUMENTO`/`documento`, se generará un placeholder `usuario<documento>@example.com`.
- `RED DE CONOCIMIENTO`, `ÁREA TEMÁTICA` o `codigoArea`/`codigo`/`codigo_area` para encontrar el área vinculada.
- `rol` (opcional, por defecto `Formador`; en las importaciones masivas todos los usuarios se crean como formadores para facilitar la gestión)

También se soportan estas columnas del archivo institucional para completar la tabla `usuarios`:

- `DOCUMENTO`
- `COD_REGIONAL`
- `REGIONAL`
- `COD_CF`
- `CENTRO DE FORMACIÓN`
- `RED DE CONOCIMIENTO`

Y estas columnas para `inscripciones_capacitacion`:

- `DENOMINACIÓN DE LA CAPACITACIÓN`
- `FECHA INICIO CAPACITACIÓN`
- `FECHA FIN CAPACITACIÓN`
- `FECHA DILIGENCIAMIENTO DEL REPORTE PLAN DE MULTIPLICACIÓN`
- `OPCIÓN PLAN DE MULTIPLICACIÓN / ACTA DE COMPROMISO`
- `FECHA EN LA QUE REALIZÓ LA MULTIPLICACIÓN`
- `VALIDACIÓN DEL PLAN DE MULTIPLICACIÓN EJECUTADO POR EL INSTRUCTOR`
- `NOMBRE SUBDIRECTOR O DELEGADO QUE HACE EL SEGUIMIENTO AL PLAN DE MULTIPLICACIÓN`
- `DESCRIBA BREVEMENTE PLAN DE MULTIPLICACIÓN`
- `LINK EVIDENCIAS PARA CONSULTA`

> **Contraseña por defecto:** todos los usuarios nuevos reciben la contraseña `ENI2024*` (hashada internamente). Desde ahora, cuando ingresan por primera vez con esa clave, el sistema los obliga a cambiarla mediante el endpoint `/usuarios/cambiar-password` antes de poder continuar.

Las filas que no cuenten con `nombre`, `email` y una red/área válida serán ignoradas. Si el usuario ya existe, se reutiliza y se intenta crear la inscripción de capacitación sin duplicarla.

## 🔧 Backend

### Dependencia

Se añadió `xlsx` al `package.json` para leer hojas de cálculo y CSV.

### Endpoint nuevo

- **POST** `/api/usuarios/upload-bulk`
- **Middleware**: `verifyToken` (debe ser administrador)
- **Entrada**: `multipart/form-data` con campo `file`.
- **Procesamiento**:
  1. Lee el buffer con `xlsx.read(..., { type: 'buffer' })`.
  2. Convierte la primera hoja en JSON.
  3. Itera filas, valida datos y busca el área por código, red o área temática.
  4. Genera contraseña genérica (`ENI2024*`) para usuarios nuevos.
  5. Marca la sesión para exigir cambio obligatorio de contraseña en el primer ingreso.
  6. Crea o reutiliza usuarios existentes.
  7. Inserta registros en `inscripciones_capacitacion` cuando la fila trae datos de capacitación.

- **Respuesta**: objeto con mensaje e incluso la lista de correos importados.

## 🧩 Frontend

Se introdujeron tres elementos:

1. **Ruta nueva** en `main.jsx`: `/upload-usuarios`.
2. **Componente** `BulkUpload.jsx` con formulario para seleccionar el archivo y enviar.
3. **Servicio** `src/services/Usuarios/BulkUploadUsers.jsx` que utiliza `authFetch` para mandar el `FormData`.
4. **Botón** en `Gestion_Usuarios.jsx` para navegar a la sección de carga masiva.

## 🧪 Flujo de uso

1. El administrador accede a "Gestión de Usuarios".
2. Clic en "Carga masiva" → se abre el formulario.
3. Selecciona el archivo `.xlsx`, `.xls` o `.csv` y pulsa "Subir archivo".
4. Aparece mensaje de éxito o errores.
5. Los nuevos usuarios quedan registrados con contraseña estándar (la pueden cambiar luego).
6. Si el archivo trae columnas de capacitación, también se crean los reportes asociados al usuario.

> Recuerda ejecutar `npm install` en el backend para agregar `xlsx`.

---

Con esto tu aplicación ya soporta la importación por lotes de usuarios y capacitaciones desde un mismo archivo institucional. ¡Éxito! 🎉
