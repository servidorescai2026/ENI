import authFetch from "../../utils/authFetch";
import { apiUrl } from "../../config/api";

async function GetMyCourses() {
    const token = localStorage.getItem("token");
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

    if (!token) {
        throw new Error("No hay token de autenticación");
    }

    if (!usuario?.areaId) {
        return [];
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await authFetch(apiUrl(`/api/cursos/area/${usuario.areaId}`), {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error("La petición tardó demasiado tiempo. Verifica que el servidor esté corriendo.");
        }
        throw error;
    }
}
export default GetMyCourses;
