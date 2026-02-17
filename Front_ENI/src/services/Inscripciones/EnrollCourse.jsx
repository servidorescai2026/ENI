<<<<<<< HEAD
=======
import authFetch from "../../utils/authFetch";

>>>>>>> 4c646f78c86c24f773229c8c3fdbbeba13241f67
async function EnrollCourse(courseId) {
    const token = localStorage.getItem("token");
    console.log("EnrollCourse - CourseId:", courseId);

    if (!token) {
        throw new Error("No hay token de autenticación");
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

<<<<<<< HEAD
        const response = await fetch('http://localhost:3000/api/inscripciones', {
=======
        const response = await authFetch('http://localhost:3000/api/inscripciones', {
>>>>>>> 4c646f78c86c24f773229c8c3fdbbeba13241f67
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ curso_id: courseId }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
<<<<<<< HEAD
                errorData = { error: "Error desconocido del servidor" };
=======
                errorData = { error: `Error desconocido del servidor ${e}` };
>>>>>>> 4c646f78c86c24f773229c8c3fdbbeba13241f67
            }
            throw new Error(errorData.error || `HTTP ${response.status}`);
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
export default EnrollCourse;