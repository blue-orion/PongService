import lobbyRoutes from "#domains/lobby/lobbyRoutes.js";

export default async function domainRoutes(fastify, _opts) {
  await fastify.register(lobbyRoutes, { prefix: "/lobbies" });

  fastify.get("/health", async (_request, _reply) => {
    return { status: "ok" };
  });
}
