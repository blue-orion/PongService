import FriendService from "#domains/friend/service/friendService.js";
import { ApiResponse } from "#shared/api/response.js";
import PageRequest from "#shared/page/PageRequest.js";
import PageResponse from "#shared/page/PageResponse.js";

const friendService = new FriendService();

const friendController = {
  // POST /v1/friends/request
  async requestFriendHandler(request, reply) {
    const { receiverId } = request.body;
    const senderId = request.user.id;
    await friendService.requestFriend(receiverId, senderId);
    return ApiResponse.ok(reply, { message: "Friend request sent successfully" });
  },

  // PUT /v1/friends/accept-request
  async acceptFriendRequestHandler(request, reply) {
    const { relationId } = request.body;
    await friendService.acceptFriendRequest(parseInt(relationId));
    return ApiResponse.ok(reply, { message: "Friend request accepted successfully" });
  },

  // DELETE /v1/friends/delete/:relationId
  async deleteFriendHandler(request, reply) {
    const relationId = request.params.relationId;
    await friendService.deleteFriend(parseInt(relationId));
    return ApiResponse.ok(reply, { message: "Friend deleted successfully" });
  },

  // GET /v1/friends/list
  async getFriendsHandler(request, reply) {
    const userId = request.user.id;
    const pageable = PageRequest.of(request.query);
    const friends = await friendService.getFriends(userId, pageable);
    return ApiResponse.ok(reply, { friends });
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
    await friendService.rejectFriendRequest(parseInt(relationId));
    return ApiResponse.ok(reply, { message: "Friend request rejected successfully" });
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
