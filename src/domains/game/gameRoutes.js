import { gameController } from '#domains/game/controller/gameController.js';
import util from 'util';

// WS /ws/game
export default async function gameRoutes(fastify, opts) {
  const gameNamespace = fastify.io.of('/ws/game');

  gameNamespace.on('connect', (socket) => {
    // 소켓 연결 시 auth 필드를 통한 정보 전달
    gameController.handleConnect(socket);

    socket.on('move', (raw) => {
      gameController.handleMoveEvent(socket, raw);
    });

    socket.on('disconnect', async () => {
      gameController.handleDisconnect(socket);
      //   console.log(JSON.stringify(await loadGameState()));
      console.log('클라이언트 연결 종료');
    });
  });

  fastify.get('/:id', gameController.getGameByIdHandler);
}
