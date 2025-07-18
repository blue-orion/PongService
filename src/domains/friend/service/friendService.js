import friendRepo from "#domains/freind/repo/friendRepo.js";

const friendService = {
  async addFriend(friendId, userId) {
    if (!friendId || !userId) {
      throw new Error("Friend ID and User ID are required");
    }
    if (friendId === userId) {
      throw new Error("You cannot add yourself as a friend");
    }
    await friendRepo.addFriend(friendId, userId);
  },
};

export default friendService;
