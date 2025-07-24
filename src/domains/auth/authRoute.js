import authController from "#domains/auth/controller/authController.js";
import twoFAController from "#domains/auth/controller/2faController.js";

export default async function authRoutes(fastify) {
  // authController.js
  fastify.post("/login", authController.loginHandler);
  fastify.post("/login/check", authController.checkLoginHandler);
  fastify.post("/logout", authController.logoutHandler);
  fastify.post("/register", authController.registerHandler);
  fastify.get("/refresh", { preHandler: [fastify.refreshAuth] }, authController.refreshTokenHandler);
  fastify.get("/google/callback", authController.googleOAuthCallbackHandler);
  fastify.get("/42/callback", authController.fortyOAuthCallbackHandler);

  // 2faController.js
  fastify.post("/2fa/setup", twoFAController.setup2FAHandler);
  fastify.post("/2fa/confirm", twoFAController.confirm2FAHandler);
  fastify.post("/2fa/disable", twoFAController.disable2FAHandler);
  fastify.post("/2fa/verify", twoFAController.verify2FAHandler);
}
