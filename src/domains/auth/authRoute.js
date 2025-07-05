import { loginHandler, meHandler } from "./controller/authController.js";

export default async function authRoutes(fastify) {
  fastify.post("/auth/login", loginHandler(fastify));
  fastify.get("/auth/me", { preHandler: [fastify.authenticate] }, meHandler);
}
