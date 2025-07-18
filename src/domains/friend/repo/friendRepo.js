import prisma from "#shared/database/prisma.js";

const friendRepo = {
  async addFriend(friendId, userId) {
    return prisma.friend.create({
      data: {
        userId,
        friendId,
      },
    });
  },
};

export default friendRepo;
