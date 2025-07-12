import { gameController } from "#domains/pong/controller/gameController.js";

export default async function gameRoutes(fastify, opts) {
  const io = fastify.io;
  const gameNamespace = io.of("/ws/game");

  gameNamespace.on("connection", (socket) => {
    // socket.io(4.x) 이상 버전에서는 url을 통한 쿼리 전달 보다는
    // auth 필드를 이용한 정보 전달을 표준으로 삼고 있다고 함
    // 소켓 연결 시 auth 필드를 기재하여 정보 전달 가능
    const { playerId, tournamentId } = socket.handshake.auth;
    const parsedPlayerId = parseInt(playerId);
    const parsedTournamentId = parseInt(tournamentId);
    console.log("🎯 받은 playerId:", playerId);
    console.log("🎯 파싱된 playerId:", parsedPlayerId);
    console.log("🎯 받은 tournamentId:", tournamentId);
    console.log("🎯 파싱된 tournamentId:", parsedTournamentId);

    console.log(`🎮 플레이어 ${playerId} 연결됨`);
    gameController.handleConnection(socket, parsedTournamentId, parsedPlayerId);

    socket.on("message", (raw) => {
      gameController.handleMessage(socket, raw);
    });

    socket.on("disconnect", async () => {
      //   console.log(JSON.stringify(await loadGameState()));
      console.log("클라이언트 연결 종료");
    });
  });
}
