import authRoutes from "#domains/auth/authRoute.js";
import lobbyRoutes from "#domains/lobby/lobbyRoutes.js";
import userRoutes from "#domains/user/userRoutes.js";
// import gameRoutes from "#domains/game/gameRoutes.js";

export default async function domainRoutes(fastify, _opts) {
  await fastify.register(authRoutes, { prefix: "/auth" });
  await fastify.register(lobbyRoutes, { prefix: "/lobbies" });
  await fastify.register(userRoutes, { prefix: "/users" });
  // await fastify.register(gameRoutes, { prefix: "/game"});

  fastify.get("/health", async (_request, _reply) => {
    return { status: "ok" };
  });
}
