import friendController from "#domains/friend/controller/freindController.js";

export default async function friendRoutes(fastify) {
  fastify.addHook("preHandler", fastify.accessAuth);

  // POST /v1/friends/request
  fastify.post("/request", friendController.requestFriendHandler);
  // DELETE /v1/friends/delete/:id
  fastify.delete("/delete/:id", friendController.deleteFriendHandler);
  // GET /v1/friends/list
  fastify.get("/list", friendController.getFriendsHandler);
  // GET /v1/friends/received-requests
  fastify.get("/received-requests", friendController.getReceivedRequestsHandler);
}
