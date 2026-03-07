import GetAllUsers from "./GetAllUsers";

async function GetOneUsers(id) {
    const users = await GetAllUsers();
    return users.find((user) => Number(user.id) === Number(id)) || null;
}
export default GetOneUsers;
