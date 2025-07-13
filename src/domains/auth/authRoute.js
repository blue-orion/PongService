import authController from "#domains/auth/controller/authController.js";
import twoFAController from "#domains/auth/controller/2faController.js";
import userController from "#domains/user/controller/userController.js";

export default async function authRoutes(fastify) {
  // authController.js
  fastify.post("/login", authController.loginHandler);
  fastify.post("/logout", authController.logoutHandler);
  fastify.post("/register", authController.registerHandler);
  fastify.post("/refresh", authController.refreshTokenHandler);
  fastify.get("/google/callback", authController.googleOAuthCallbackHandler);
  fastify.get("/me", { preHandler: [fastify.authenticate] }, userController.meHandler);

  // 2faController.js
  fastify.post("/2fa/setup", twoFAController.setup2FAHandler);
  fastify.post("/2fa/verify", twoFAController.verify2FAHandler);
}
