import authController from "#domains/auth/controller/authController.js";
import twoFAController from "#domains/auth/controller/2faController.js";

export default async function authRoutes(fastify) {
  // authController.js
  fastify.post("/login", authController.loginHandler);
  fastify.post("/logout", authController.logoutHandler);
  fastify.post("/register", authController.registerHandler);
  fastify.post("/refresh", { preHandler: [fastify.refreshAuth] }, authController.refreshTokenHandler);
  fastify.get("/google/callback", authController.googleOAuthCallbackHandler);
  fastify.post("/enable", authController.enableUserHandler);

  // 2faController.js
  fastify.post("/2fa/setup", twoFAController.setup2FAHandler);
  fastify.post("/2fa/verify", twoFAController.verify2FAHandler);
}
