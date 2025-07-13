import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";

import PongException from "#shared/exception/pongException.js";

async function jwtPlugin(fastify, _options) {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "your-secret-key",
  });

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

  const authenticate = async (request, _reply) => {
    try {
      await request.jwtVerify();
    } catch {
      throw PongException.UNAUTHORIZE;
    }
  };

  fastify.decorate("jwtUtils", jwtUtils);
  fastify.decorate("authenticate", authenticate);
}

export default fp(jwtPlugin);
