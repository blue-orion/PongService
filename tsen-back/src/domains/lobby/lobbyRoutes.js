import { LobbyController } from "#domains/lobby/controller/lobbyController.js";

export default async function lobbyRoutes(fastify, _opts) {
  fastify.addHook("preHandler", fastify.accessAuth);

  const controller = new LobbyController();

  // GET /v1/lobbies
  fastify.get("/", controller.getAllLobbies);
}
