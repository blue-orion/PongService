import prisma from "#shared/database/prisma.js";

const userRepo = {
  async getUserByUsername(username) {
    return await prisma.user.findUnique({
      where: { username },
    });
  },

  async getUserById(id) {
    return await prisma.user.findUnique({
      where: { id },
    });
  },

  async updateUser2FASecret(userId, secret) {
    return await prisma.user.update({
      where: { id: userId },
      data: { twoFASecret: secret },
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
      data: { twoFASecret: null },
    });
  },
};

export default userRepo;
