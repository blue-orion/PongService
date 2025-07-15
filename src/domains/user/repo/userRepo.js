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

  async getUserByNickname(nickname) {
    return await prisma.user.findUniqueOrThrow({
      where: { nickname },
    });
  },

  async putNickname(userId, nickname) {
    return await prisma.user.update({
      where: { id: userId },
      data: { nickname: nickname },
    });
  },

  async putProfileImage(userId, profileImage) {
    return await prisma.user.update({
      where: { id: userId },
      data: { profile_image: profileImage },
    });
  },

  async putPassword(userId, hashedPassword) {
    return await prisma.user.update({
      where: { id: userId },
      data: { passwd: hashedPassword },
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

  async createUser(registerDto) {
    return prisma.user.create({
      data: registerDto,
    });
  },

  async removeUser2FASecret(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: { two_fa_secret: null },
    });
  },

  async disableUser(userId) {
    return await prisma.user.update({
      where: { id: userId },
      data: { enabled: false },
    });
  },

  async enableUser(userId) {
    return await prisma.user.update({
      where: { id: userId },
      data: { enabled: true },
    });
  },
};

export default userRepo;
