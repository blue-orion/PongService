import prisma from "#shared/database/prisma.js";

// username으로 유저 조회
export async function getUserByUsername(username) {
  return prisma.user.findUnique({
    where: { username },
  });
}

// id로 유저 조회
export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
  });
}

// 2FA 시크릿 저장/업데이트
export async function updateUser2FASecret(userId, secret) {
  return prisma.user.update({
    where: { id: userId },
    data: { twoFASecret: secret },
  });
}

// 유저 생성 (회원가입)
export async function createUser({ username, passwordHash }) {
  return prisma.user.create({
    data: { username, passwordHash },
  });
}

// 2FA 시크릿 제거 (2FA 해제)
export async function removeUser2FASecret(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { twoFASecret: null },
  });
}
