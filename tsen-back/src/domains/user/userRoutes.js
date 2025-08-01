import userController from "#domains/user/controller/userController.js";

export default async function userRoutes(fastify) {
  fastify.addHook("preHandler", fastify.accessAuth);

  fastify.get("/profile/:id", userController.getUserProfileByIdHandler);
  fastify.put("/update", userController.updateMyPageHandler);
  fastify.put("/update/password", userController.updatePasswordHandler);
  fastify.delete("/disable", userController.disableUserHandler);
  fastify.get("/status/:id", userController.getUserStatusHandler);
  fastify.put("/status/:id", userController.updateUserStatusHandler);
  fastify.get("/records/:id", userController.getUserGameRecordsHandler);
  fastify.get("/summary/:id", userController.getUserSummaryHandler);
}
