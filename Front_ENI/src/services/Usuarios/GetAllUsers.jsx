<<<<<<< HEAD
async function GetAllUsers() {
    const response = await fetch('http://127.0.0.1:8000/api/Usuarios', {
=======
import authFetch from "../../utils/authFetch";

async function GetAllUsers() {
    const response = await authFetch('http://127.0.0.1:8000/api/Usuarios', {
>>>>>>> 4c646f78c86c24f773229c8c3fdbbeba13241f67
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
    })
    const data = await response.json();
    return data;
}
export default GetAllUsers;