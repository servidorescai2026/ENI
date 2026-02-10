import authFetch from "../../utils/authFetch";

async function GetOneUsers(id) {
<<<<<<< HEAD
    const response = await authFetch(`http://127.0.0.1:8000/api/Usuarios/${id}`, {
=======
    const response = await fetch(`http://127.0.0.1:3000/api/usuarios/${id}`, {
>>>>>>> origin/santi
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
    })
    const data = await response.json();
    return data;
}
export default GetOneUsers;