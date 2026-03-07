import authFetch from "../../utils/authFetch";
import { apiUrl } from "../../config/api";

async function GetAllUsers() {
    const response = await authFetch(apiUrl('/api/usuarios'), {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data.usuarios || []);
}
export default GetAllUsers;
