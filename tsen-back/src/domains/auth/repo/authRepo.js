import prisma from "#shared/database/prisma.js";

class AuthRepo {
  async updateUserRefreshToken(userId, refreshToken) {
    return await prisma.user.update({
      where: { id: userId },
      data: { refresh_token: refreshToken },
    });
  }

  async removeUserRefreshToken(userId) {
    return await prisma.user.update({
      where: { id: userId },
      data: { refresh_token: null },
    });
  }
}

export default AuthRepo;
