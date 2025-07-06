import { loginHandler, meHandler } from "./controller/authController.js";
import { setup2FAHandler, verify2FAHandler } from "./controller/2faController.js";

export default async function authRoutes(fastify) {
  fastify.post("/auth/login", loginHandler(fastify));
  fastify.get("/auth/me", { preHandler: [fastify.authenticate] }, meHandler);
  // 2FA 관련 엔드포인트 추가
  fastify.post("/auth/2fa/setup", setup2FAHandler);
  fastify.post("/auth/2fa/verify", verify2FAHandler);
}
