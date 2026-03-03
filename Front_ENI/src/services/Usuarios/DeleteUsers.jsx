async function DeleteUsers(id) {
    const response = await fetch(`http://localhost:3000/api/usuarios/eliminar/${id}`, {
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