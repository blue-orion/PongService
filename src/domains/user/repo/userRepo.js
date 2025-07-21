import prisma from "#shared/database/prisma.js";
import FriendsUtils from "#domains/friend/util/friendsUtils.js";

class UserRepo {
  async getUserByUsername(username) {
    return await prisma.user.findUniqueOrThrow({
      where: { username },
    });
  }

  async getUserById(id) {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async getUserByNickname(nickname) {
    return await prisma.user.findUniqueOrThrow({
      where: { nickname },
    });
  }

  async putNickname(userId, nickname) {
    return await prisma.user.update({
      where: { id: userId },
      data: { nickname: nickname },
    });
  }

  async putProfileImage(userId, profileImage) {
    return await prisma.user.update({
      where: { id: userId },
      data: { profile_image: profileImage },
    });
  }

  async putPassword(userId, hashedPassword) {
    return await prisma.user.update({
      where: { id: userId },
      data: { passwd: hashedPassword },
    });
  }

  async getUserByRefreshToken(refreshToken) {
    return await prisma.user.findUniqueOrThrow({
      where: { refresh_token: refreshToken },
    });
  }

  async updateUser2FASecret(userId, secret) {
    return await prisma.user.update({
      where: { id: userId },
      data: { two_fa_secret: secret },
    });
  }

  async createUser(registerDto) {
    return prisma.user.create({
      data: registerDto,
    });
  }

  async removeUser2FASecret(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: { two_fa_secret: null },
    });
  }

  async disableUser(userId) {
    return await prisma.user.update({
      where: { id: userId },
      data: { enabled: false },
    });
  }

  async getUserStatus(userId) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { status: true },
    });
    return user.status;
  }

  async updateUserStatus(userId, status) {
    return await prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  async getUserFriendIds(userId) {
    return await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { friends: true },
    });
  }

  async addFriendToList(userId, friendId) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { friends: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const updatedFriends = FriendsUtils.addFriend(user.friends, friendId);

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        friends: updatedFriends,
      },
    });

    return FriendsUtils.parseIds(updatedFriends);
  }

  async removeFriendFromList(userId, friendId) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { friends: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const updatedFriends = FriendsUtils.removeFriend(user.friends, friendId);

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        friends: updatedFriends,
      },
    });

    return FriendsUtils.parseIds(updatedFriends);
  }

  async getFriendsWithDetails(userId, pageable) {
    const friendIds = await this.getUserFriendIds(userId);

    if (friendIds.length === 0) {
      return [];
    }

    const friends = await prisma.user.findMany({
      skip: pageable.skip,
      take: pageable.take,
      where: {
        id: { in: friendIds },
        enabled: true,
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        profile_image: true,
        status: true,
      },
    });

    return friends;
  }

  async getUserGameRecords(userId, pageable) {
    return await prisma.user.findUnique({
      skip: pageable.skip,
      take: pageable.take,
      where: { id: userId },
      select: {
        gamesAsWinner: true,
        gamesAsLoser: true,
      },
      orderBy: {
        [pageable.sort]: pageable.order,
      },
    });
  }
}

export default UserRepo;
