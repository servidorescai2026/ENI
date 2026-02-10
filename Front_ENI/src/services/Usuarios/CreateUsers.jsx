async function CreateUsers(user) {
    const response = await fetch('http://127.0.0.1:3000/api/usuarios', {
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