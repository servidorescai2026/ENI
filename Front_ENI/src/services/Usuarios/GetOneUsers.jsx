async function GetOneUsers(id) {
    const response = await fetch(`http://127.0.0.1:8000/api/Usuarios/${id}`, {
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