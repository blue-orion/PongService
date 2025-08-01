import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";

import PongException from "#shared/exception/pongException.js";

async function jwtPlugin(fastify, _options) {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "your-secret-key",
  });

  const jwtUtils = {
    generateAccessToken(user) {
      return fastify.jwt.sign({ id: user.id, username: user.username, type: "access" }, { expiresIn: "15m" });
    },

    generateRefreshToken(user) {
      return fastify.jwt.sign({ id: user.id, type: "refresh" }, { expiresIn: "1d" });
    },

    verifyToken(token) {
      return fastify.jwt.verify(token);
    },
  };

  const authenticate = async (request, _reply) => {
    try {
      await request.jwtVerify();
    } catch {
      throw PongException.UNAUTHORIZED();
    }
  };

  const accessAuth = async (request, _reply) => {
    await authenticate(request, _reply);
    if (request.user.type !== "access") throw PongException.UNAUTHORIZED();
  };

  const refreshAuth = async (request, _reply) => {
    await authenticate(request, _reply);
    if (request.user.type !== "refresh") throw PongException.UNAUTHORIZED();
  };

  fastify.decorate("jwtUtils", jwtUtils);
  fastify.decorate("accessAuth", accessAuth);
  fastify.decorate("refreshAuth", refreshAuth);
}

export default fp(jwtPlugin);
