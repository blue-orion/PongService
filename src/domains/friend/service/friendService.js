import FriendRepo from "#domains/friend/repo/friendRepo.js";
import UserRepo from "#domains/user/repo/userRepo.js";
import PongException from "#shared/exception/pongException.js";
import websocketManager from "#shared/websocket/websocketManager.js";

class FriendService {
  constructor(friendRepo = new FriendRepo(), userRepo = new UserRepo()) {
    this.friendRepo = friendRepo;
    this.userRepo = userRepo;
  }
  // 친구요청
  async requestFriend(receiverName, senderId) {
    if (!senderId || !receiverName) {
      throw new PongException("Sender ID and Receiver Name are required", 400);
    }

    const receiver = await this.userRepo.getUserByUsername(receiverName);
    const sender = await this.userRepo.getUserById(senderId);
    if (!receiver || !sender) {
      throw new PongException("Receiver not found", 404);
    }

    const existingRelation = await this.friendRepo.findRelation(senderId, receiver.id);
    if (existingRelation) {
      throw new PongException("Friend request already exists", 400);
    }

    const friendRelation = await this.friendRepo.requestFriend(senderId, receiver.id);

    websocketManager.sendToNamespaceUsers("friend", receiver.id, senderId, "friend_request", {
      type: "request",
      payload: {
        relationId: friendRelation.id,
        senderId: senderId,
        senderUsername: sender.username,
        receiverId: receiver.id,
        receiverUsername: receiver.username,
        message: "You have a new friend request",
      },
    });

    return friendRelation.id;
  }

  // 친구 요청 수락
  async acceptFriendRequest(relationId) {
    if (!relationId) {
      throw new PongException("Relation ID is required", 400);
    }
    const relation = await this.friendRepo.acceptFriendRequest(relationId);

    if (!relation) {
      throw new PongException("Friend relation does not exist", 404);
    }

    await this.userRepo.addFriendToList(relation.sender_id, relation.receiver_id);
    await this.userRepo.addFriendToList(relation.receiver_id, relation.sender_id);

    // socket을 통해 친구 요청 수락 알림 전송
    websocketManager.sendToNamespaceUsers("friend", relation.sender_id, relation.receiver_id, "friend_request", {
      type: "accepted",
      payload: {
        message: "Friend request accepted",
        relationId: relation.id,
        senderId: relation.sender_id,
        receiverId: relation.receiver_id,
      },
    });

    return relation;
  }

  // 친구 삭제
  async deleteFriend(requestUserId, deleteFriendId) {
    if (!requestUserId || !deleteFriendId) {
      throw new PongException("Request User ID and Delete Friend ID are required", 400);
    }
    const relation = await this.friendRepo.findRelation(requestUserId, deleteFriendId);
    if (!relation) {
      throw new PongException("Friend relation does not exist", 404);
    }

    await this.userRepo.removeFriendFromList(relation.sender_id, relation.receiver_id);
    await this.userRepo.removeFriendFromList(relation.receiver_id, relation.sender_id);

    websocketManager.sendToNamespaceUsers("friend", relation.sender_id, relation.receiver_id, "friend_request", {
      type: "deleted",
      payload: {
        message: "Friend request deleted",
        relationId: relation.id,
        senderId: requestUserId,
        receiverId: deleteFriendId,
      },
    });

    return await this.friendRepo.deleteFriend(relation.id);
  }

  // 친구 목록 조회
  async getFriends(userId, pageable) {
    const friendsData = await this.userRepo.getFriendsWithDetails(userId, pageable);
    return friendsData;
  }

  // 받은 친구 요청 조회
  async getReceivedRequests(userId, pageable) {
    if (!userId) {
      throw new PongException("User ID is required", 400);
    }
    return this.friendRepo.getReceivedRequests(userId, pageable);
  }

  // 보낸 친구 요청 조회
  async getSentRequests(userId, pageable) {
    if (!userId) {
      throw new PongException("User ID is required", 400);
    }
    const response = await this.friendRepo.getSentRequests(userId, pageable);
    return response;
  }

  // 친구 요청 거절
  async rejectFriendRequest(relationId) {
    if (!relationId) {
      throw new PongException("Relation ID is required", 400);
    }
    const relation = await this.friendRepo.deleteFriend(relationId);

    websocketManager.sendToNamespaceUsers("friend", relation.receiver_id, relation.sender_id, "friend_request", {
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
      throw new PongException("Sender ID and Receiver ID are required", 400);
    }
    const receiver = await this.userRepo.getUserById(receiverId);
    if (!receiver) {
      throw new PongException("User not found", 404);
    }

    const relation = await this.friendRepo.findRelation(senderId, receiverId);
    if (!relation) {
      throw new PongException("Friend request does not exist", 404);
    }

    websocketManager.sendToNamespaceUsers("friend", relation.receiver_id, relation.sender_id, "friend_request", {
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
