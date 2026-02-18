import authFetch from "../../utils/authFetch";

async function CancelEnrollment(enrollmentId) {
    const token = localStorage.getItem("token");

    if (!token) {
        throw new Error("No hay token de autenticación");
    }

    const response = await authFetch(`http://localhost:3000/api/inscripciones/${enrollmentId}/cancelar`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
        }
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = { error: `HTTP ${response.status}` };
        }
        throw new Error(errorData.error || "No se pudo cancelar la inscripción");
    }

    return response.json();
}

export default CancelEnrollment;
