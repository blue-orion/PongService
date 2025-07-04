import { LobbyController } from "#domains/lobby/controller/lobbyController.js";

export default async function lobbyRoutes(fastify, opts) {
  const controller = new LobbyController();

  // GET /api/lobbies
  fastify.get("/", controller.getAllLobbies);
}
