import authFetch from "../../utils/authFetch";
import { apiUrl } from "../../config/api";

async function DeleteCourse(courseId) {
    const token = localStorage.getItem("token");
    console.log("DeleteCourse - CourseId:", courseId);

    if (!token) {
        throw new Error("No hay token de autenticación");
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await authFetch(apiUrl(`/api/cursos/${courseId}`), {
            method: 'DELETE',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
            },
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
export default DeleteCourse;
