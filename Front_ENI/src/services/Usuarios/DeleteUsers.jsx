async function DeleteUsers(id) {
    const response = await fetch(`http://127.0.0.1:3000/api/usuarios/${id}`, {
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