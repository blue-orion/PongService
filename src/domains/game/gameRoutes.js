import { gameController } from "./controller/gameController.js";

export default async function gameRoutes(fastify, opts) {
  const io = fastify.io;
  const gameNamespace = io.of("/ws/game");

  gameNamespace.on("connection", (socket) => {
    const playerId = parseInt(socket.handshake.query.playerId);
    console.log("🎯 받은 playerId:", socket.handshake.query.playerId);
    console.log("🎯 파싱된 playerId:", playerId); // URL에 ?playerId=123 식으로 연결

    console.log(`🎮 플레이어 ${playerId} 연결됨`);
    gameController.handleConnection(socket, playerId);

    socket.on("message", (raw) => {
      gameController.handleMessage(socket, raw);
    });

    socket.on("disconnect", async () => {
      //   console.log(JSON.stringify(await loadGameState()));
      console.log("클라이언트 연결 종료");
    });
  });
}
