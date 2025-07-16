import { gameController } from '#domains/game/controller/gameController.js';

// WS /ws/game
export default async function gameRoutes(fastify, opts) {
  const io = fastify.io;
  const gameNamespace = io.of('/ws/game');

  gameNamespace.on('connection', (socket) => {
    // 소켓 연결 시 auth 필드를 통한 정보 전달
    const { playerId, tournamentId, gameId } = socket.handshake.auth;
    console.log('🎯 받은 playerId:', playerId);
    console.log('🎯 받은 tournamentId:', tournamentId);
    console.log('🎯 받은 gameId:', gameId);

    gameController.handleConnection(socket, tournamentId, gameId, playerId);

    socket.on('move', (raw) => {
      gameController.handleMoveEvent(socket, raw);
    });

    // socket.on('message', (raw) => {
    //   gameController.handleMessage(socket, raw);
    // });

    socket.on('disconnect', async () => {
      //   console.log(JSON.stringify(await loadGameState()));
      console.log('클라이언트 연결 종료');
    });
  });
}
