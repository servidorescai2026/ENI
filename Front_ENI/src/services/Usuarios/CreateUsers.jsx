import { apiUrl } from "../../config/api";

async function CreateUsers(user) {
    const response = await fetch(apiUrl('/api/usuarios/register'), {
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
