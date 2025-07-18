import dashboardController from "#domains/dashboard/controller/dashboardController.js";

export default async function dashboardRoutes(fastify) {
  // fastify.addHook("preHandler", fastify.accessAuth);

  fastify.get("/rank", dashboardController.getRankHandler);
}
