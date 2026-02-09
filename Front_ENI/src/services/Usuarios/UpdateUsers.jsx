async function UpdateUsers(id, user) {
    const response = await fetch(`http://127.0.0.1:8000/api/Usuarios/${id}`, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify(user)
    })
    const data = await response.json();
    return data;
}
export default UpdateUsers;