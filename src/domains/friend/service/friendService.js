import FriendRepo from "#domains/friend/repo/friendRepo.js";
import UserRepo from "#domains/user/repo/userRepo.js";
import websocketManager from "#shared/websocket/websocketManager.js";
import PongException from "#shared/exception/pongException.js";

class FriendService {
  constructor(friendRepo = new FriendRepo(), userRepo = new UserRepo()) {
    this.friendRepo = friendRepo;
    this.userRepo = userRepo;
  }
  // 친구요청
  async requestFriend(senderId, receiverId) {
    if (!senderId || !receiverId) {
      throw PongException.BAD_REQUEST("Sender ID and Receiver ID are required");
    }
    // 이미 친구 요청이 있는지 확인
    const existingRelation = await this.friendRepo.findRelation(senderId, receiverId);
    if (existingRelation) {
      throw PongException.BAD_REQUEST("Friend request already exists");
    }
    // 친구 요청 생성
    const friendRelation = await this.friendRepo.requestFriend(senderId, receiverId);

    websocketManager.sendToNamespaceUser("friend", receiverId, "friend_request", {
      type: "request",
      payload: {
        relationId: friendRelation.id,
        message: "You have a new friend request",
      },
    });

    return friendRelation.id;
  }

  // 친구 요청 수락
  async acceptFriendRequest(relationId) {
    if (!relationId) {
      throw PongException.BAD_REQUEST("Relation ID is required");
    }
    const relation = await this.friendRepo.acceptFriendRequest(relationId);

    if (!relation) {
      throw PongException.ENTITY_NOT_FOUND("Friend relation does not exist");
    }

    await this.userRepo.addFriendToList(relation.sender_id, relation.receiver_id);
    await this.userRepo.addFriendToList(relation.receiver_id, relation.sender_id);

    // socket을 통해 친구 요청 수락 알림 전송
    websocketManager.sendToNamespaceUser("friend", relation.receiver_id, "friend_request", {
      type: "accepted",
      payload: {
        message: "Friend request accepted",
        relationId: relation.id,
        userId: relation.sender_id,
      },
    });

    return relation;
  }

  // 친구 삭제
  async deleteFriend(relationId) {
    if (!relationId) {
      throw PongException.BAD_REQUEST("Relation ID is required");
    }
    const relation = await this.friendRepo.findRelation(relationId);
    if (!relation) {
      throw PongException.BAD_REQUEST("Friend relation does not exist");
    }

    await this.userRepo.removeFriendFromList(relation.sender_id, relation.receiver_id);
    await this.userRepo.removeFriendFromList(relation.receiver_id, relation.sender_id);

    return this.friendRepo.deleteFriend(relationId);
  }

  // 친구 목록 조회
  async getFriends(userId, pageable) {
    const friendsData = await this.friendRepo.userRepo.getFriendsWithDetails(userId, pageable);
    return friendsData;
  }

  // 받은 친구 요청 조회
  async getReceivedRequests(userId, pageable) {
    if (!userId) {
      throw PongException.BAD_REQUEST("User ID is required");
    }
    return this.friendRepo.getReceivedRequests(userId, pageable);
  }

  // 보낸 친구 요청 조회
  async getSentRequests(userId, pageable) {
    if (!userId) {
      throw PongException.BAD_REQUEST("User ID is required");
    }
    return this.friendRepo.getSentRequests(userId, pageable);
  }

  // 친구 요청 거절
  async rejectFriendRequest(relationId) {
    if (!relationId) {
      throw PongException.BAD_REQUEST("Relation ID is required");
    }
    const relation = await this.friendRepo.deleteFriend(relationId);

    websocketManager.sendToNamespaceUser("friend", relation.receiver_id, "friend_request", {
      type: "rejected",
      payload: {
        message: "Friend request rejected",
        relationId: relation.id,
        userId: relation.sender_id,
      },
    });

    return relation;
  }

  // 친구 요청 취소
  async cancelFriendRequest(senderId, receiverId) {
    if (!senderId || !receiverId) {
      throw PongException.BAD_REQUEST("Sender ID and Receiver ID are required");
    }
    const relation = await this.friendRepo.findRelation(senderId, receiverId);
    if (!relation) {
      throw PongException.BAD_REQUEST("Friend request does not exist");
    }

    websocketManager.sendToNamespaceUser("friend", receiverId, "friend_request", {
      type: "cancelled",
      payload: {
        message: "Friend request cancelled",
        relationId: relation.id,
        userId: senderId,
      },
    });

    return this.friendRepo.deleteFriend(relation.id);
  }
}

export default FriendService;
