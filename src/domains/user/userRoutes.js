import userController from "#domains/user/controller/userController.js";

export default async function userRoutes(fastify) {
  // PUT /v1/users/update/:id
  fastify.addHook("preHandler", fastify.accessAuth);
  fastify.put("/update/:id", userController.updateMyPageHandler);
}
