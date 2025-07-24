import { gameController } from "#domains/game/controller/gameController.js";

// WS /ws/game
export default async function gameRoutes(fastify) {
  fastify.get("/:id", gameController.getGameByIdHandler);
}
