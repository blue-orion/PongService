import Game from "../model/Game.js";
import { updateGame } from "../repo/gameRepo.js";

export class GameService {
  /**
   * @param {number} gameId
   * @param {[Socket, Socket]} players - [leftSocket, rightSocket]
   * @param {{ left: number, right: number }} playerIds - DB user ID
   */
  constructor(gameId, players, playerIds) {
    this.game = new Game(gameId, playerIds);
    this.players = players;
    this.playerIds = playerIds;
    this.intervalId = null;
  }

  startGame() {
    // 역할 지정
    this.players[0].emit("role", { role: "left" });
    this.players[1].emit("role", { role: "right" });

    this.intervalId = setInterval(async () => {
      const result = this.isGameOver();
      if (result) {
        clearInterval(this.intervalId);
        await this.finishGame(result);
      } else {
        this.game.updateBall();
        const state = this.game.getState();
        this.players.forEach((socket) => {
          socket.emit("state", state);
        });
      }
    }, 1000 / 60); // 60fps
  }

  isGameOver() {
    const score = this.game.getScore();
    if (score.left >= 10) return "left";
    if (score.right >= 10) return "right";
    return null;
  }

  async finishGame(winnerRole) {
    const loserRole = winnerRole === "left" ? "right" : "left";
    const winnerId = this.playerIds[winnerRole];
    const loserId = this.playerIds[loserRole];
    const score = this.game.getScore();

    // ✅ DB에 결과 저장
    await updateGame(this.game.id, {
      leftScore: score.left,
      rightScore: score.right,
      winnerId,
      loserId,
    });

    // 📨 클라이언트에 결과 전송
    this.players.forEach((socket) =>
      socket.emit("game_over", {
        winner: winnerRole,
        score,
      })
    );
  }

  handleMove(role, direction) {
    this.game.movePaddle(role, direction);
  }

  getState() {
    return this.game.getState();
  }

  stopGame() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
