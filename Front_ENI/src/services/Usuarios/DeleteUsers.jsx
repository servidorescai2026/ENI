import authFetch from "../../utils/authFetch";
import { apiUrl } from "../../config/api";

async function DeleteUsers(id) {
    const response = await authFetch(apiUrl(`/api/usuarios/eliminar/${id}`), {
        method: 'DELETE',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}
export default DeleteUsers;
