import { getUserByUsername } from "#domains/user/repo/userRepo.js";

// DB에서 유저 조회
export async function findUserByUsername(username) {
  return getUserByUsername(username);
}
