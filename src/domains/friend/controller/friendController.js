import { ApiResponse } from "#shared/api/response.js";
import PageRequest from "#shared/page/PageRequest.js";
import PageResponse from "#shared/page/PageResponse.js";

import FriendCancelDto from "#domains/friend/model/friendCancelDto.js";
import FriendDeleteDto from "#domains/friend/model/friendDeleteDto.js";
import FriendHelpers from "#domains/friend/util/friendHelpers.js";
import FriendAcceptionDto from "#domains/friend/model/friendAcceptionDto.js";
import FriendService from "#domains/friend/service/friendService.js";

const friendHelpers = new FriendHelpers();
const friendService = new FriendService();

const friendController = {
  // POST /v1/friends/request
  async requestFriendHandler(request, reply) {
    const friendRequestDto = new FriendAcceptionDto(request.body, request.user);
    friendHelpers.validateFriendRequestForm(friendRequestDto);

    await friendService.requestFriend(friendRequestDto);
    return ApiResponse.ok(reply, { message: "Friend request sent successfully" });
  },

  // PUT /v1/friends/accept-request
  async acceptFriendRequestHandler(request, reply) {
    const { relationId } = request.body;
    friendHelpers.validateFriendAcceptionForm(relationId);

    await friendService.acceptFriendRequest(parseInt(relationId));
    return ApiResponse.ok(reply, { message: "Friend request accepted successfully" });
  },

  // DELETE /v1/friends/delete
  async deleteFriendHandler(request, reply) {
    const friendDeleteDto = new FriendDeleteDto(request.body, request.user);
    friendHelpers.validateFriendDeleteForm(friendDeleteDto);

    await friendService.deleteFriend(friendDeleteDto);
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
    const response = await friendService.getReceivedRequests(userId, pageable);
    return ApiResponse.ok(reply, response);
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
    friendHelpers.validateFriendAcceptionForm(relationId);

    await friendService.rejectFriendRequest(parseInt(relationId));
    return ApiResponse.ok(reply, { message: "Friend request rejected successfully" });
  },

  // DELETE /v1/friends/cancel-request
  async cancelFriendRequestHandler(request, reply) {
    const friendCancelDto = new FriendCancelDto(request.body, request.user);
    friendHelpers.validateFriendCancelForm(friendCancelDto);

    await friendService.cancelFriendRequest(friendCancelDto);
    return ApiResponse.ok(reply, { message: "Friend request cancelled successfully" });
  },
};

export default friendController;
