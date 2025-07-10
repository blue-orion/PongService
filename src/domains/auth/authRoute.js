import {
  loginHandler,
  logoutHandler,
  registerHandler,
  refreshTokenHandler,
  meHandler,
} from "./controller/authController.js";
import { setup2FAHandler, verify2FAHandler } from "./controller/2faController.js";

export default async function authRoutes(fastify) {
  fastify.post("/auth/login", loginHandler(fastify));
  fastify.post("/auth/logout", logoutHandler);
  fastify.post("/auth/register", registerHandler);
  fastify.get("/auth/me", { preHandler: [fastify.authenticate] }, meHandler);
  fastify.post("/auth/refresh", refreshTokenHandler(fastify));
  fastify.post("/auth/2fa/setup", setup2FAHandler);
  fastify.post("/auth/2fa/verify", verify2FAHandler);
}
