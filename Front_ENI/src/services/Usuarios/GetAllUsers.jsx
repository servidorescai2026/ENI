async function GetAllUsers() {
    const response = await fetch('http://127.0.0.1:8000/api/Usuarios', {
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