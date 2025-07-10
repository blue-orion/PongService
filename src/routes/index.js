import jwtPlugin from "#domains/auth/jwt.js";
import authRoutes from "#domains/auth/authRoute.js";
import lobbyRoutes from "#domains/lobby/lobbyRoutes.js";

export default async function domainRoutes(fastify, _opts) {
  await fastify.register(jwtPlugin);
  await fastify.register(authRoutes, { prefix: "/auth" });
  await fastify.register(lobbyRoutes, { prefix: "/lobbies" });

  fastify.get("/health", async (_request, _reply) => {
    return { status: "ok" };
  });
}
