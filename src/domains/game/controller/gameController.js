// src/domains/game/controller/gameController.js
import { GameService } from "../service/gameService.js";
import { createGameWithTournament } from "../repo/gameRepo.js";

const waiting = [];
const activeGames = new Map(); // gameId -> GameService

export const gameController = {
  async handleConnection(socket, playerId) {
    waiting.push({ socket, playerId });

    // ✅ 2명 이상일 때 게임 시작
    if (waiting.length >= 2) {
      const left = waiting.shift();
      const right = waiting.shift();

      // ✅ 1. 게임 생성 (DB)
      const game = await createGameWithTournament(
        left.playerId,
        right.playerId
      );
      const gameId = game.id;

      // ✅ 2. GameService 생성
      const gameService = new GameService(gameId, [left.socket, right.socket], {
        left: left.playerId,
        right: right.playerId,
      });

      // ✅ 3. 게임 시작
      gameService.startGame();

      // ✅ 4. 게임을 Map에 등록
      activeGames.set(gameId, gameService);
    }
  },

  handleMessage(socket, raw) {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    if (data.type === "move") {
      // TODO: gameId별로 정확히 찾아서 이동 처리 (2단계에서)
      for (const gameService of activeGames.values()) {
        gameService.handleMove(data.role, data.direction);
      }
    }
  },
};
