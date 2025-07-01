import bcrypt from "bcrypt";

const users = [
  {
    id: 1,
    username: "gitkim",
    passwordHash: await bcrypt.hash("password123", 10),
  },
];

export async function findUserByUsername(username) {
  return users.find((user) => user.username === username);
}

export async function validatePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
