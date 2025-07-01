export default async function (fastify) {
  fastify.get("/health", async (_request, _reply) => {
    return { status: "ok" };
  });
}
