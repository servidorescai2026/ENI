import authFetch from "../../utils/authFetch";


async function UpdateCourse(courseId, courseData) {
    const token = localStorage.getItem("token");
    console.log("UpdateCourse - CourseId:", courseId);
    console.log("UpdateCourse - CourseData:", courseData);

    const primaryAreaId = Array.isArray(courseData?.areaIds) && courseData.areaIds.length > 0
        ? Number(courseData.areaIds[0])
        : courseData?.areaId;

    const normalizedPayload = {
        nombre: courseData?.nombre,
        descripcion: courseData?.descripcion,
        duracion: Number(courseData?.duracion),
        categoria: courseData?.categoria,
        nivel: courseData?.nivel,
        areaId: primaryAreaId,
        areaIds: Array.isArray(courseData?.areaIds) ? courseData.areaIds : (primaryAreaId ? [primaryAreaId] : []),
        fechaInicio: courseData?.fechaInicio || null,
        fechaFin: courseData?.fechaFin || null,
        tipoLanzamiento: courseData?.tipoLanzamiento || "fecha",
        maxPersonas: courseData?.maxPersonas ? Number(courseData.maxPersonas) : null,
        fechaCierreInscripcion: courseData?.fechaCierreInscripcion || null,
    };

    if (!token) {
        throw new Error("No hay token de autenticación");
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await authFetch(`http://localhost:3000/api/cursos/${courseId}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(normalizedPayload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorText;
            try {
                errorText = await response.text();
            } catch (e) {
                errorText = `Error desconocido del servidor ${e}`;
            }
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error("La petición tardó demasiado tiempo. Verifica que el servidor esté corriendo.");
        }
        throw error;
    }
}
export default UpdateCourse;