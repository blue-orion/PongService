import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import fastifyOauth2 from "@fastify/oauth2";

export default fp(async (fastify) => {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "your-secret-key",
  });

  /**
   * /auth/me
   */
  fastify.decorate("authenticate", async function (request, reply) {
    try {
      await request.jwtVerify();
      if (!request.user || request.user.type !== "access") {
        return reply.code(401).send({ message: "Access token required" });
      }
    } catch {
      reply.code(401).send({ message: "Unauthorized" });
    }
  });
});
