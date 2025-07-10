import {
  loginHandler,
  logoutHandler,
  registerHandler,
  refreshTokenHandler,
  meHandler,
} from "./controller/authController.js";
import { setup2FAHandler, verify2FAHandler } from "./controller/2faController.js";

export default async function authRoutes(fastify) {
  fastify.post("/login", loginHandler(fastify));
  fastify.post("/logout", logoutHandler);
  fastify.post("/register", registerHandler);
  fastify.get("/me", { preHandler: [fastify.authenticate] }, meHandler);
  fastify.post("/refresh", refreshTokenHandler(fastify));
  fastify.post("/2fa/setup", setup2FAHandler);
  fastify.post("/2fa/verify", verify2FAHandler);
}
