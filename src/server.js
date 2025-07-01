import Fastify from "fastify";
import "./env.js";
import routes from "./routes/index.js";
import config from "./shared/config/index.js";

const app = Fastify({ logger: true });
app.register(routes);

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
