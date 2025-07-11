import {
  logoutHandler,
  registerHandler,
  refreshTokenHandler,
  meHandler,
  googleOAuthCallbackHandler,
} from "./controller/authController.js";
import { setup2FAHandler, verify2FAHandler } from "./controller/2faController.js";

import authController from "#domains/auth/controller/authController.js";

export default async function authRoutes(fastify) {
  // authController.js
  fastify.post("/login", authController.loginHandler);
  fastify.post("/logout", logoutHandler);
  fastify.post("/register", registerHandler);
  fastify.post("/refresh", refreshTokenHandler(fastify));
  fastify.get("/google/callback", googleOAuthCallbackHandler(fastify));
  fastify.get("/me", { preHandler: [fastify.authenticate] }, meHandler);

  // 2faController.js
  fastify.post("/2fa/setup", setup2FAHandler);
  fastify.post("/2fa/verify", verify2FAHandler);
}
