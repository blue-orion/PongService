import "#env";

import Fastify from "fastify";

import domainRoutes from "#routes/index.js";
import { ApiResponse } from "#shared/api/response.js";
import config from "#shared/config/index.js";
import encryptPlugin from "#shared/plugin/encrypt.js";
import jwtPlugin from "#shared/plugin/jwt.js";
import oauthPlugin from "#shared/plugin/oauth.js";
import fastifySocketIO from "fastify-socket.io";
import websocketHandlers from "#shared/websocket/websocketHandlers.js";

const app = Fastify({ logger: true });

app.register(jwtPlugin);
app.register(encryptPlugin);
app.register(oauthPlugin);
app.register(fastifySocketIO);

app.ready((err) => {
  if (err) throw err;

  // Socket.IO 네임스페이스 핸들러 등록
  websocketHandlers.gameWebSocketHandler(app.io);
  websocketHandlers.lobbyWebSocketHandler(app.io);
  websocketHandlers.friendWebSocketHandler(app.io);
});

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
