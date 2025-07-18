import friendController from "#domains/friend/controller/friendController.js";

export default async function friendRoutes(fastify) {
  fastify.addHook("preHandler", fastify.accessAuth);

  fastify.post("/add", friendController.addFriendHandler);
}
