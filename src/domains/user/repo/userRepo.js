import prisma from "#shared/database/prisma.js";

const userRepo = {
  async getUserByUsername(username) {
    return await prisma.user.findUniqueOrThrow({
      where: { username },
    });
  },

  async getUserById(id) {
    return await prisma.user.findUniqueOrThrow({
      where: { id },
    });
  },

  async getUserByRefreshToken(refreshToken) {
    return await prisma.user.findUniqueOrThrow({
      where: { refresh_token: refreshToken },
    });
  },

  async updateUser2FASecret(userId, secret) {
    return await prisma.user.update({
      where: { id: userId },
      data: { two_fa_secret: secret },
    });
  },

  async createUser({ username, passwd }) {
    return prisma.user.create({
      data: { username, passwd },
    });
  },

  async removeUser2FASecret(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: { two_fa_secret: null },
    });
  },
};

export default userRepo;
