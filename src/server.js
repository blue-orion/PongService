import "#env";
import Fastify from "fastify";
import domainRoutes from "#routes/index.js";
import { ApiResponse } from "#shared/api/response.js";
import config from "#shared/config/index.js";
import fastifyIO from "fastify-socket.io";
import fastifyCors from "@fastify/cors";
import "./env.js";
import routes from "./routes/index.js";
import gameRoutes from "#domains/pong/gameRoutes.js";

const app = Fastify({ logger: true });

// 플러그인 등록 순서 중요!
app.register(fastifyIO, {
  cors: {
    origin: "http://localhost:3000", // 프론트엔드 서버 주소
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// fastify-cors 등록
app.register(fastifyCors, {
  origin: "*", // 또는 구체적인 도메인
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
});

app.register(domainRoutes, { prefix: "/v1" });
app.setErrorHandler((error, _req, res) => {
  ApiResponse.error(res, error);
});

app.register(routes); // 일반 HTTP 라우트
app.register(gameRoutes); // WebSocket 라우트

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
