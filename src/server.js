import "#env";

import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";

import domainRoutes from "#routes/index.js";
import { ApiResponse } from "#shared/api/response.js";
import config from "#shared/config/index.js";
import jwtPlugin from "#shared/plugin/jwt.js";

const app = Fastify({ logger: true });

app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || "your-secret-key",
});

app.register(jwtPlugin);

app.setErrorHandler((error, _req, res) => {
  ApiResponse.error(res, error);
});

app.register(domainRoutes, { prefix: "/v1" });

const { host, port, nodeEnv } = config.server;

const start = async () => {
  try {
    await app.listen({ port, host });
    console.log(`Server running on http://${host}:${port}`);
    console.log(`Environment: ${nodeEnv}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
