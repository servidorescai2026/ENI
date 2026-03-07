async function UpdateUsers(id, user) {
    throw new Error(`La API actual no expone actualización de usuarios (id ${id}). Datos recibidos: ${JSON.stringify(user)}`);
}
export default UpdateUsers;
