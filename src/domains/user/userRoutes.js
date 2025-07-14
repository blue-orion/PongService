import userController from "#domains/user/controller/userController.js";

export default async function userRoutes(fastify) {
  fastify.addHook("preHandler", fastify.accessAuth);

  fastify.get("/profile/id/:id", userController.getUserProfileByIdHandler);
  fastify.get("/profile/username/:username", userController.getUserProfileByUsernameHandler);
  fastify.get("/profile/nickname/:nickname", userController.getUserProfileByNicknameHandler);
  fastify.get("/myinfo", userController.getMyInfoHandler);
}
