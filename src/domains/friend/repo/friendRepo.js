import prisma from "#shared/database/prisma.js";
import { FriendStatus } from "@prisma/client";

class FriendRepo {
  // 친구 요청 보내기
  async requestFriend(friendId, userId) {
    return prisma.friendship.create({
      data: {
        sender_id: userId,
        receiver_id: friendId,
        status: FriendStatus.PENDING,
      },
    });
  }

  // 친구 요청 수락
  async acceptFriendRequest(relationId) {
    return prisma.friendship.update({
      where: { id: relationId },
      data: { status: FriendStatus.ACCEPTED },
    });
  }

  // 친구 삭제
  async deleteFriend(relationId) {
    return prisma.friendship.delete({
      where: { id: relationId },
    });
  }

  // 친구 관계 확인(존재 여부)
  async findRelation(senderId, receiverId) {
    return prisma.friendship.findFirst({
      where: {
        sender_id: senderId,
        receiver_id: receiverId,
      },
    });
  }

  // 받은 친구 요청 조회
  async getReceivedRequests(userId, pageable) {
    return prisma.friendship.findMany({
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
            status: true,
          },
        },
      },
    });
  }

  // 보낸 친구 요청 조회
  async getSentRequests(userId, pageable) {
    return prisma.friendship.findMany({
      skip: pageable.skip,
      take: pageable.take,
      where: {
        sender_id: userId,
        status: FriendStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            profile_image: true,
            status: true,
          },
        },
      },
    });
  }
}

export default FriendRepo;
