// src/domains/game/controller/gameController.js
//
// 전역 객체로 생성하여 한 개의 서비스 객체만을 유지
import { gameService } from '../service/gameService.js';
import { loadTournament } from '../repo/gameRepo.js';

const waiting = [];

export const gameController = {
  async handleConnection(socket, tournamentId, playerId) {
    waiting.push({ socket, tournamentId, playerId });

    const status = gameService.newConnection(socket, tournamentId, playerId);
    if (status) {
      console.log(`${playerId} came in tournament(Tournament Id = ${tournamentId})!`);
    }
    return status; //JSON 형태 혹은 API 형태로 연결 결과 응답 보내주기
  },

  handleMessage(socket, raw) {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (data.type === 'move') {
      // TODO: gameId별로 정확히 찾아서 이동 처리 (2단계에서)
      for (const gameService of activeGames.values()) {
        gameService.handleMove(data.role, data.direction);
      }
    }
  },
};
