import prisma from "#shared/database/prisma.js";
import { FriendStatus } from "@prisma/client";

class FriendRepo {
  // 친구 요청 보내기
  async requestFriend(userId, friendId) {
    if (!Number.isInteger(friendId) || !Number.isInteger(userId)) {
      throw new Error("Invalid input: friendId and userId must be integers");
    }

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
  async findRelation(userId1, userId2) {
    return prisma.friendship.findFirst({
      where: {
        OR: [
          { sender_id: userId1, receiver_id: userId2 },
          { sender_id: userId2, receiver_id: userId1 },
        ],
      },
    });
  }

  // 받은 친구 요청 조회
  async getReceivedRequests(userId, pageable) {
    const result = await prisma.friendship.findMany({
      skip: pageable.skip,
      take: pageable.take,
      where: {
        receiver_id: userId,
        status: FriendStatus.PENDING,
      },
      include: {
        sender: {
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
    return result;
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
        sender: {
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
