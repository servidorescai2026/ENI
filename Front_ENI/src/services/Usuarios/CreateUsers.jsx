<<<<<<< HEAD
async function CreateUsers(user) {
    const response = await fetch('http://127.0.0.1:8000/api/Usuarios', {
=======
import authFetch from "../../utils/authFetch";

async function CreateUsers(user) {
    const response = await authFetch('http://127.0.0.1:8000/api/Usuarios', {
>>>>>>> 4c646f78c86c24f773229c8c3fdbbeba13241f67
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify(user)
    })
    const data = await response.json();
    return data;
}
export default CreateUsers;