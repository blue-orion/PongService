import authRoutes from "./authRoute.js";
import jwtPlugin from "../shared/plugins/jwt.js";

export default async function routes(fastify) {
  fastify.register(jwtPlugin);
  fastify.register(authRoutes);
  fastify.get("/health", async (_request, _reply) => {
    return { status: "ok" };
  });
}