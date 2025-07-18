import friendController from "#domains/friend/controller/freindController.js";

export default async function friendRoutes(fastify) {
  fastify.addHook("preHandler", fastify.accessAuth);

  // POST /v1/friends/request
  fastify.post("/request", friendController.requestFriendHandler);
  // DELETE /v1/friends/delete/:relationId
  fastify.delete("/delete/:relationId", friendController.deleteFriendHandler);
  // GET /v1/friends/list
  fastify.get("/list", friendController.getFriendsHandler);
  // GET /v1/friends/received-requests
  fastify.get("/received-requests", friendController.getReceivedRequestsHandler);
  // GET /v1/friends/sent-requests
  fastify.get("/sent-requests", friendController.getSentRequestsHandler);
  // PUT /v1/friends/accept-request
  fastify.put("/accept-request", friendController.acceptFriendRequestHandler);
  // PUT /v1/friends/reject-request
  fastify.delete("/reject-request", friendController.rejectFriendRequestHandler);
  // DELETE /v1/friends/cancel-request/:receiverId
  fastify.delete("/cancel-request/:receiverId", friendController.cancelFriendRequestHandler);
}
