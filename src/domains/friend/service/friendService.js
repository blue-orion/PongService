import websocketManager from "#shared/websocket/websocketManager.js";

import FriendHelpers from "#domains/friend/util/friendHelpers.js";
import FriendRepo from "#domains/friend/repo/friendRepo.js";
import UserHelpers from "#domains/user/utils/userHelpers.js";
import UserRepo from "#domains/user/repo/userRepo.js";

class FriendService {
  constructor(
    friendHelpers = new FriendHelpers(),
    friendRepo = new FriendRepo(),
    userHelpers = new UserHelpers(),
    userRepo = new UserRepo()
  ) {
    this.friendHelpers = friendHelpers;
    this.friendRepo = friendRepo;
    this.userHelpers = userHelpers;
    this.userRepo = userRepo;
  }
  // 친구요청
  async requestFriend(friendRequestDto) {
    const receiver = await this.userRepo.getUserByUsername(friendRequestDto.receiverName);
    this.friendHelpers.validateExistingReceiver(receiver);

    const sender = await this.userRepo.getUserById(friendRequestDto.senderId);
    this.userHelpers.validateExistingUser(sender);

    const existingRelation = await this.friendRepo.findRelation(sender.id, receiver.id);
    this.friendHelpers.validateRelationNotExists(existingRelation);

    const friendRelation = await this.friendRepo.requestFriend(sender.id, receiver.id);

    websocketManager.sendToNamespaceUsers("friend", receiver.id, sender.id, "friend_request", {
      type: "request",
      payload: {
        relationId: friendRelation.id,
        senderId: sender.id,
        senderUsername: sender.username,
        receiverId: receiver.id,
        receiverUsername: receiver.username,
        message: "You have a new friend request",
      },
    });
  }

  // 친구 요청 수락
  async acceptFriendRequest(relationId) {
    const relation = await this.friendRepo.acceptFriendRequest(relationId);
    this.friendHelpers.validateRelationExists(relation);

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
  }

  // 친구 삭제
  async deleteFriend(friendDeleteDto) {
    const relation = await this.friendRepo.findRelation(friendDeleteDto.userId, friendDeleteDto.friendId);
    this.friendHelpers.validateRelationExists(relation);

    await this.userRepo.removeFriendFromList(relation.sender_id, relation.receiver_id);
    await this.userRepo.removeFriendFromList(relation.receiver_id, relation.sender_id);

    websocketManager.sendToNamespaceUsers("friend", relation.sender_id, relation.receiver_id, "friend_request", {
      type: "deleted",
      payload: {
        message: "Friend request deleted",
        relationId: relation.id,
        senderId: friendDeleteDto.userId,
        receiverId: friendDeleteDto.friendId,
      },
    });
    await this.friendRepo.deleteFriend(relation.id);
  }

  // 친구 목록 조회
  async getFriends(userId, pageable) {
    const friendsData = await this.userRepo.getFriendsWithDetails(userId, pageable);
    return friendsData;
  }

  // 받은 친구 요청 조회
  async getReceivedRequests(userId, pageable) {
    return this.friendRepo.getReceivedRequests(userId, pageable);
  }

  // 보낸 친구 요청 조회
  async getSentRequests(userId, pageable) {
    const response = await this.friendRepo.getSentRequests(userId, pageable);
    return response;
  }

  // 친구 요청 거절
  async rejectFriendRequest(relationId) {
    const relation = await this.friendRepo.deleteFriend(relationId);
    this.friendHelpers.validateRelationExists(relation);

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
  async cancelFriendRequest(friendCancelDto) {
    const receiver = await this.userRepo.getUserById(friendCancelDto.receiverId);
    this.userHelpers.validateExistingUser(receiver);

    const relation = await this.friendRepo.findRelation(friendCancelDto.senderId, friendCancelDto.receiverId);
    this.friendHelpers.validateRelationExists(relation);

    websocketManager.sendToNamespaceUsers("friend", relation.receiver_id, relation.sender_id, "friend_request", {
      type: "cancelled",
      payload: {
        message: "Friend request cancelled",
        relationId: relation.id,
        userId: friendCancelDto.senderId,
      },
    });
  }
}

export default FriendService;
