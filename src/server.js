import "#env";

import Fastify from "fastify";

import jwtPlugin from "#shared/plugin/jwt.js";
import oauthPlugin from "#shared/plugin/oauth.js";
import domainRoutes from "#routes/index.js";
import { ApiResponse } from "#shared/api/response.js";
import config from "#shared/config/index.js";
import encryptPlugin from "#shared/plugin/encrypt.js";
import fastifyIO from "fastify-socket.io";
import fastifyCors from "@fastify/cors";
import "./env.js";
import websocketHandlers from "#shared/websocket/websocketHandlers.js";

const app = Fastify({ logger: true });

app.register(jwtPlugin);
app.register(encryptPlugin);
app.register(oauthPlugin);

// 플러그인 등록 순서 중요!
app.register(fastifyIO, {
  cors: {
    origin: `${process.env.FRONTEND_URL}`, // 프론트엔드 서버 주소
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// fastify-cors 등록
app.register(fastifyCors, {
  origin: "*", // 또는 구체적인 도메인
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
});

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
    console.log(`🚀 Server running on http://${host}:${port}`);
    console.log(`🌱 Environment: ${nodeEnv}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
