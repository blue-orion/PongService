import GameState from "./GameState.js";

export default class Game {
  /**
   * @param { number } gameId
   * @param { {id: number, socket: any}[] } players - [left, right]
   */
  constructor(gameId, players) {
    this.id = gameId;

    /** @type {{id: number, socket: any}[]} */
    this.players = players;

    /** @type {GameState} */
    this.state = new GameState();
  }

  /**
   * 플레이어에게 역할(left/right)을 전달
   */
  assignRoles() {
    this.players[0].socket.emit("role", { role: "left" });
    this.players[1].socket.emit("role", { role: "right" });
  }

  /**
   * 패들 이동 요청 처리
   * @param {"left" | "right"} role
   * @param {"up" | "down"} direction
   */
  movePaddle(role, direction) {
    this.state.movePaddle(role, direction);
  }

  /**
   * 현재 게임 상태 반환
   */
  getState() {
    return this.state.getState();
  }

  /**
   * 게임 종료 조건 확인
   * @returns {"left" | "right" | false}
   */
  isGameOver() {
    const score = this.state.getScore();
    if (score.left >= 10) return "left";
    if (score.right >= 10) return "right";
    return false;
  }

  /**
   * 점수 상태 반환
   */
  getScore() {
    return this.state.getScore();
  }
}
