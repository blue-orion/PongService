import friendService from "#domains/friend/service/friendService.js";
import { ApiResponse } from "#shared/api/response.js";
import websocketManager from "#shared/websocket/websocketManger.js";
import PageRequest from "#shared/page/PageRequest.js";
import PageResponse from "#shared/page/PageResponse.js";

const friendController = {
  // POST /v1/friends/request
  async requestFriendHandler(request, reply) {
    const { requestId: receiverId } = request.body;
    const senderId = request.user.id;
    const relationId = await friendService.requestFriend(receiverId, senderId);
    // 친구 추가 후, 친구 웹소켓 네임스페이스에 알림 전송
    websocketManager.sendToNamespaceUser("friend", receiverId, "friendRequest", {
      payload: {
        relationId,
        message: "You have a new friend request",
      },
    });
    return ApiResponse.ok(reply, { message: "Friend request sent successfully" });
  },

  async acceptFriendRequestHandler(data) {
    const { relationId } = data.payload;
    await friendService.acceptFriendRequest(relationId);
  },

  // DELETE /v1/friends/delete/:id
  async deleteFriendHandler(request, reply) {
    const relationId = request.params.id;
    await friendService.deleteFriend(relationId);
    return ApiResponse.ok(reply, { message: "Friend deleted successfully" });
  },

  // GET /v1/friends/list
  async getFriendsHandler(request, reply) {
    const userId = request.user.id;
    const pageable = PageRequest.of(request.query);
    const friends = await friendService.getFriends(userId, pageable);
    return ApiResponse.ok(reply, PageResponse.of(pageable, friends));
  },

  // GET /v1/friends/received-requests
  async getReceivedRequestsHandler(request, reply) {
    const userId = request.user.id;
    const pageable = PageRequest.of(request.query);
    const requests = await friendService.getReceivedRequests(userId, pageable);
    return ApiResponse.ok(reply, PageResponse.of(pageable, requests));
  },
};

export default friendController;
