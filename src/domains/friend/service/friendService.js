import friendRepo from "#domains/friend/repo/friendRepo.js";

const friendService = {
  // 친구요청
  async requestFriend(senderId, receiverId) {
    if (!senderId || !receiverId) {
      throw new Error("Friend ID and User ID are required");
    }
    // 이미 친구 요청이 있는지 확인
    if (await this.isExistRequest(senderId, receiverId)) {
      throw new Error("Friend request already exists");
    }
    // 친구 요청 생성
    const friendRelation = await friendRepo.requestFriend(senderId, receiverId);
    return friendRelation.id;
  },

  // 친구 요청 수락
  async acceptFriendRequest(relationId) {
    if (!relationId) {
      throw new Error("Relation ID is required");
    }
    await friendRepo.acceptFriendRequest(relationId);
  },

  // 친구 삭제
  async deleteFriend(relationId) {
    if (!relationId) {
      throw new Error("Relation ID is required");
    }
    return friendRepo.deleteFriend(relationId);
  },

  // 친구 관계 확인(존재 여부)
  async isExistRequest(senderId, receiverId) {
    const relation = await friendRepo.findRelation(senderId, receiverId);
    return relation !== null;
  },

  // 친구 목록 조회
  async getFriends(userId, pageable) {
    if (!userId) {
      throw new Error("User ID is required");
    }
    return friendRepo.getFriends(userId, pageable);
  },

  // 받은 친구 요청 조회
  async getReceivedRequests(userId, pageable) {
    if (!userId) {
      throw new Error("User ID is required");
    }
    return friendRepo.getReceivedRequests(userId, pageable);
  },
};

export default friendService;
