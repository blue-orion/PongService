import friendService from "#domains/friend/service/friendService.js";
import { ApiResponse } from "#shared/api/response.js";
import websocketManager from "#shared/websocket/websocketManger.js";
import PageRequest from "#shared/page/PageRequest.js";
import PageResponse from "#shared/page/PageResponse.js";

const friendController = {
  // POST /v1/friends/request
  async requestFriendHandler(request, reply) {
    const { receiverId } = request.body;
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

  // socket에서 친구 요청 수락 핸들러
  async acceptFriendRequestSocketHandler(data) {
    const { relationId } = data.payload;
    await friendService.acceptFriendRequest(relationId);
  },

  // PUT /v1/friends/accept-request
  async acceptFriendRequestHandler(request, reply) {
    const { relationId } = request.body;
    await friendService.acceptFriendRequest(relationId);
    return ApiResponse.ok(reply, { message: "Friend request accepted successfully" });
  },

  // DELETE /v1/friends/delete/:relationId
  async deleteFriendHandler(request, reply) {
    const relationId = request.params.relationId;
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

  // GET /v1/friends/sent-requests
  async getSentRequestsHandler(request, reply) {
    const userId = request.user.id;
    const pageable = PageRequest.of(request.query);
    const requests = await friendService.getSentRequests(userId, pageable);
    return ApiResponse.ok(reply, PageResponse.of(pageable, requests));
  },

  // DELETE /v1/friends/reject-request
  async rejectFriendRequestHandler(request, reply) {
    const { relationId } = request.body;
    await friendService.rejectFriendRequest(relationId);
    return ApiResponse.ok(reply, { message: "Friend request rejected successfully" });
  },

  // socket에서 친구 요청 거절 핸들러
  async rejectFriendRequestSocketHandler(data) {
    const { relationId } = data.payload;
    await friendService.rejectFriendRequest(relationId);
  },

  // DELETE /v1/friends/cancel-request/:receiverId
  async cancelFriendRequestHandler(request, reply) {
    const receiverId = request.params.receiverId;
    const senderId = request.user.id;
    await friendService.cancelFriendRequest(senderId, receiverId);
    return ApiResponse.ok(reply, { message: "Friend request cancelled successfully" });
  },
};

export default friendController;
