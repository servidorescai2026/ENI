import authFetch from "../../utils/authFetch";

async function DeleteUsers(id) {
    const response = await authFetch(`http://127.0.0.1:8000/api/Usuarios/${id}`, {
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