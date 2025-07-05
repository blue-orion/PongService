import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";

export default fp(async (fastify) => {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "your-secret-key",
  });

  fastify.decorate("authenticate", async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ message: "Unauthorized" });
    }
  });
});
