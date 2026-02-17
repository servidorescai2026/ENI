<<<<<<< HEAD
=======
import authFetch from "../../utils/authFetch";

>>>>>>> 4c646f78c86c24f773229c8c3fdbbeba13241f67
async function GetMyCourses() {
    const token = localStorage.getItem("token");

    if (!token) {
        throw new Error("No hay token de autenticación");
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

<<<<<<< HEAD
        const response = await fetch('http://localhost:3000/api/cursos/mios', {
=======
        const response = await authFetch('http://localhost:3000/api/cursos/mios', {
>>>>>>> 4c646f78c86c24f773229c8c3fdbbeba13241f67
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
export default GetMyCourses;
