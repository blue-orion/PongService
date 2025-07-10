import bcrypt from "bcrypt";
import { getUserByUsername } from "#domains/user/repo/userRepo.js";

// DB에서 유저 조회
export async function findUserByUsername(username) {
  return getUserByUsername(username);
}

// 비밀번호 검증
export async function validatePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
