// In-memory storage for users when MongoDB is not available
let inMemoryUsers = [];
let userIdCounter = 1;

module.exports = {
  users: inMemoryUsers,
  getNextId: () => userIdCounter++,
  addUser: (user) => {
    user._id = userIdCounter++;
    inMemoryUsers.push(user);
    return user;
  },
  findUserByEmail: (email) => {
    return inMemoryUsers.find(u => u.email === email);
  },
  findUserById: (id) => {
    return inMemoryUsers.find(u => u._id === id);
  },
  getAllUsers: () => inMemoryUsers,
  clearUsers: () => {
    inMemoryUsers.length = 0;
    userIdCounter = 1;
  }
};