import prisma from "#shared/database/prisma.js";
import { FriendStatus } from "@prisma/client";

const friendRepo = {
  async requestFriend(friendId, userId) {
    return prisma.friend.create({
      data: {
        sender_id: userId,
        receiver_id: friendId,
        status: FriendStatus.PENDING,
      },
    });
  },

  async acceptFriendRequest(relationId) {
    return prisma.friend.update({
      where: { id: relationId },
      data: { status: FriendStatus.ACCEPTED },
    });
  },

  async deleteFriend(relationId) {
    return prisma.friend.delete({
      where: { id: relationId },
    });
  },

  async findRelation(senderId, receiverId) {
    return prisma.friend.findFirst({
      where: {
        sender_id: senderId,
        receiver_id: receiverId,
      },
    });
  },

  async getFriends(userId, pageable) {
    return prisma.friend.findMany({
      skip: pageable.skip,
      take: pageable.take,
      where: {
        status: FriendStatus.ACCEPTED,
        OR: [{ sender_id: userId }, { receiver_id: userId }],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            profile_image: true,
          },
        },
      },
    });
  },

  async getReceivedRequests(userId, pageable) {
    return prisma.friend.findMany({
      skip: pageable.skip,
      take: pageable.take,
      where: {
        receiver_id: userId,
        status: FriendStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            profile_image: true,
          },
        },
      },
    });
  },
};

export default friendRepo;
