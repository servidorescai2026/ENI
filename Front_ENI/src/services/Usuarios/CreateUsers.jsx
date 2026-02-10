import authFetch from "../../utils/authFetch";

async function CreateUsers(user) {
<<<<<<< HEAD
    const response = await authFetch('http://127.0.0.1:8000/api/Usuarios', {
=======
    const response = await fetch('http://127.0.0.1:3000/api/usuarios', {
>>>>>>> origin/santi
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