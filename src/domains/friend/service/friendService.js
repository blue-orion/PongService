import friendRepo from "#domains/friend/repo/friendRepo.js";
import websocketManager from "#shared/websocket/websocketManager.js";

const friendService = {
  // 친구요청
  async requestFriend(senderId, receiverId) {
    if (!senderId || !receiverId) {
      throw new Error("Friend ID and User ID are required");
    }
    // 이미 친구 요청이 있는지 확인
    const existingRelation = await friendRepo.findRelation(senderId, receiverId);
    if (existingRelation) {
      throw new Error("Friend request already exists");
    }
    // 친구 요청 생성
    const friendRelation = await friendRepo.requestFriend(senderId, receiverId);

    websocketManager.sendToNamespaceUser("friend", receiverId, "friend_request", {
      type: "request",
      payload: {
        relationId: friendRelation.id,
        message: "You have a new friend request",
      },
    });

    return friendRelation.id;
  },

  // 친구 요청 수락
  async acceptFriendRequest(relationId) {
    if (!relationId) {
      throw new Error("Relation ID is required");
    }
    // socket을 통해 친구 요청 수락 알림 전송
    const relation = await friendRepo.acceptFriendRequest(relationId);

    websocketManager.sendToNamespaceUser("friend", relation.receiver_id, "friend_request", {
      type: "accepted",
      payload: {
        message: "Friend request accepted",
        relationId: relation.id,
        userId: relation.sender_id,
      },
    });

    return relation;
  },

  // 친구 삭제
  async deleteFriend(relationId) {
    if (!relationId) {
      throw new Error("Relation ID is required");
    }
    return friendRepo.deleteFriend(relationId);
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

  // 보낸 친구 요청 조회
  async getSentRequests(userId, pageable) {
    if (!userId) {
      throw new Error("User ID is required");
    }
    return friendRepo.getSentRequests(userId, pageable);
  },

  // 친구 요청 거절
  async rejectFriendRequest(relationId) {
    if (!relationId) {
      throw new Error("Relation ID is required");
    }
    const relation = await friendRepo.deleteFriend(relationId);

    websocketManager.sendToNamespaceUser("friend", relation.receiver_id, "friend_request", {
      type: "rejected",
      payload: {
        message: "Friend request rejected",
        relationId: relation.id,
        userId: relation.sender_id,
      },
    });

    return relation;
  },

  // 친구 요청 취소
  async cancelFriendRequest(senderId, receiverId) {
    if (!senderId || !receiverId) {
      throw new Error("Sender ID and Receiver ID are required");
    }
    const relation = await friendRepo.findRelation(senderId, receiverId);
    if (!relation) {
      throw new Error("Friend request does not exist");
    }

    websocketManager.sendToNamespaceUser("friend", receiverId, "friend_request", {
      type: "cancelled",
      payload: {
        message: "Friend request cancelled",
        relationId: relation.id,
        userId: senderId,
      },
    });

    return friendRepo.deleteFriend(relation.id);
  },
};

export default friendService;
