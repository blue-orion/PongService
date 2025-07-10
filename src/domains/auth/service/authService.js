import { findUserByUsername, validatePassword } from "#domains/user/service/userService.js";

export async function authenticateUser(username, password) {
  const user = await findUserByUsername(username);
  if (!user) {
    return null;
  }

  const isValid = await validatePassword(password, user.passwd);
  if (!isValid) {
    return null;
  }

  return user;
}
