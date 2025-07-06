import "#env";
import Fastify from "fastify";
import domainRoutes from "#routes/index.js";
import { ApiResponse } from "#shared/api/response.js";
import config from "#shared/config/index.js";
// import websocket from "@fastify/websocket";
import fastifyIO from "fastify-socket.io";
import "./env.js";
import routes from "./routes/index.js";
import config from "./shared/config/index.js";
import gameRoutes from './domains/game/gameRoutes.js';
import handle from './domains/game/gameRoutes.js';

const app = Fastify({ logger: true });

const { host, port, nodeEnv } = config.server;

// ✅ 플러그인 등록 순서 중요!
app.register(fastifyIO);       // 가장 먼저 등록해야 WebSocket 작동

app.register(domainRoutes, { prefix: "/v1" });
app.setErrorHandler((error, _req, res) => {
  ApiResponse.error(res, error);
});

app.register(routes);          // 일반 HTTP 라우트
app.register(gameRoutes);      // WebSocket 라우트

// ✅ .env 또는 설정 파일로부터 host, port, nodeEnv 추출
const { host = "0.0.0.0", port = 3003, nodeEnv = "development" } = config.server;

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
