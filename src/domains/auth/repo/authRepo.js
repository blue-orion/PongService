import prisma from "#shared/database/prisma.js";

const authRepo = {
  async updateUserRefreshToken(userId, refreshToken) {
    return await prisma.user.update({
      where: { id: userId },
      data: { refresh_token: refreshToken },
    });
  },
};

export default authRepo;

export async function removeUserRefreshToken(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { refresh_token: null },
  });
}
