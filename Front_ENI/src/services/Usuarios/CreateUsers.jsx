async function CreateUsers(user) {
    const response = await fetch('http://localhost:3000/api/usuarios/register', {
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