import fp from "fastify-plugin";

async function jwtPlugin(fastify, _options) {
  const jwtUtils = {
    generateAccessToken(user) {
      return fastify.jwt.sign({ userId: user.id, username: user.username, type: "access" }, { expiresIn: "15m" });
    },

    generateRefreshToken(user) {
      return fastify.jwt.sign({ userId: user.id, type: "refresh" }, { expiresIn: "1d" });
    },

    verifyToken(token) {
      return fastify.jwt.verify(token);
    },
  };

  const authenticate = async (request, reply) => {
    try {
      await request.jwtVerify();
      if (!request.user || request.user.type !== "access") {
        return reply.code(403).send({ message: "Access token required" });
      }
    } catch {
      reply.code(401).send({ message: "Unauthorized" });
    }
  };

  fastify.decorate("jwtUtils", jwtUtils);
  fastify.decorate("authenticate", authenticate);
}

export default fp(jwtPlugin);
