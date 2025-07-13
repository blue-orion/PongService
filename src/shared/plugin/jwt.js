import fp from "fastify-plugin";
import fastifyOauth2 from "fastify/oauth2";

import PongException from "#shared/exception/pongException.js";

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

  const authenticate = async (request, _reply) => {
    try {
      await request.jwtVerify();
      if (!request.user || request.user.type !== "access") throw PongException.FORBIDDEN;
    } catch {
      throw PongException.UNAUTHORIZE;
    }
  };

  fastify.decorate("jwtUtils", jwtUtils);
  fastify.decorate("authenticate", authenticate);

  fastify.register(fastifyOauth2, {
    name: "googleOAuth",
    scope: ["profile", "email"],
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID,
        secret: process.env.GOOGLE_CLIENT_SECRET,
      },
      auth: fastifyOauth2.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: "/auth/google",
    callbackUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3333/v1/auth/google/callback",
  });
}

export default fp(jwtPlugin);
