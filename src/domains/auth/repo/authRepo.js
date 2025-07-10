import prisma from "#shared/database/prisma.js";

export async function updateUserRefreshToken(userId, refreshToken) {
  return prisma.user.update({
    where: { id: userId },
    data: { refresh_token: refreshToken },
  });
}

export async function removeUserRefreshToken(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { refresh_token: null },
  });
}
