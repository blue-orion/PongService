import friendService from "#domains/friend/service/friendService.js";
import { ApiResponse } from "#shared/api/response.js";
import websocketManager from "#shared/websocket/websocketManger.js";

const friendController = {
  // POST /v1/friends/add
  async addFriendHandler(request, reply) {
    const { friendId } = request.body;
    const userId = request.user.id;
    await friendService.addFriend(friendId, userId);
    websocketManager.sendToUser(friendId, {
      type: "friend_request",
      from: userId,
      message: `User ${request.user.username} has sent you a friend request for a game.`,
    });
    return ApiResponse.ok(reply, { message: "Friend request sent successfully" });
  },
};

export default friendController;
