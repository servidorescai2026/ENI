<<<<<<< HEAD
async function DeleteUsers(id) {
    const response = await fetch(`http://127.0.0.1:8000/api/Usuarios/${id}`, {
=======
import authFetch from "../../utils/authFetch";

async function DeleteUsers(id) {
    const response = await authFetch(`http://127.0.0.1:8000/api/Usuarios/${id}`, {
>>>>>>> 4c646f78c86c24f773229c8c3fdbbeba13241f67
        method: 'DELETE',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
    })
    const data = await response.json();
    return data;
}
export default DeleteUsers;