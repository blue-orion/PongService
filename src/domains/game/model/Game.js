import GameState from "./GameState.js";

const END_SCORE = 10;

export default class Game {
  /**
   * Game 클래스
   * 게임 한판 내부에서 관리되는 상태 값 관리 및 저장
   * 볼의 위치, 패들의 움직임 등을 담당
   *
   * @contructor
   * @param {number} gameId
   */
  constructor(gameId) {
    this.id = gameId;

    /** @type {Map<string, number>} - Role(left || right) => playerId*/
    this.players = new Map();

    /** @type {GameState} - 볼의 위치, 패들의 위치 등을 가진 클래스 객체*/
    this.state = new GameState();
    this.keyState = {
      left: { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false },
      right: { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false },
    };
    this.score = { left: 0, right: 0 };

    this.stoped = false;
    this.started = false;
    this.intervalId = null;
  }

  start() {
    this.started = true;

    this.intervalId = setInterval(async () => {
      if (this.isGameOver()) {
        clearInterval(this.intervalId);
      } else {
        const scoredRole = this.state.updateState(this.keyState);
        if (scoredRole !== null) {
          this.score[scoredRole]++;
          this.state.ball = this.state.resetBall();
          console.log(this.score);
        }
      }
    }, 1000 / 60);
  }

  restart(sec) {
    if (this.stoped === false) return;
    this.stoped = false;

    this.timeoutId = setTimeout(() => {
      if (this.stoped) return;

      this.intervalId = setInterval(async () => {
        if (this.isGameOver()) {
          clearInterval(this.intervalId);
        } else {
          const scoredRole = this.state.updateState(this.keyState);
          if (scoredRole !== null) {
            this.score[scoredRole]++;
            this.state.ball = this.state.resetBall();
            console.log(this.score);
          }
        }
      }, 1000 / 60);
    }, sec * 1000);
  }

  stop() {
    this.stoped = true;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  isStarted() {
    return this.started;
  }

  isStoped() {
    return this.stoped;
  }

  isFull() {
    console.log(`[Game] Player Number in gameID(${this.id}): ${this.players.size}`);
    const count = [...this.players.values()].filter((p) => p.status === true);
    if (count.length === 2) return true;
    return false;
  }

  /**
   * 게임 종료 조건 확인
   * @returns {"left" | "right" | false}
   */
  isGameOver() {
    const score = this.score;
    if (score.left >= END_SCORE) return "left";
    if (score.right >= END_SCORE) return "right";
    return false;
  }

  /** Player 추가 */
  addPlayer(role, playerId) {
    this.players.set(role, { id: playerId, status: true });
  }

  removePlayer(playerId) {
    for (const [role, player] of this.players) {
      if (player.id === playerId) {
        player.status = false;
        break;
      }
    }
  }

  setKeyState(role, keycode, mode) {
    this.keyState[role][keycode] = mode;
  }

  getPlayers() {
    return this.players;
  }

  /** 현재 게임 상태 반환 */
  getState() {
    return this.state.getState();
  }

  /** 점수 상태 반환 */
  getScore() {
    return this.score;
  }

  /** 게임 결과 반환 함수
   * @returns ({ score, winnerId, loserId })
   */
  getResult() {
    const score = this.getScore();
    if (score.left < END_SCORE && score.right < END_SCORE) {
      return null;
    }
    if (score.left >= END_SCORE)
      return {
        score,
        winnerId: this.players.get("left").id,
        loserId: this.players.get("right").id,
      };
    if (score.right >= END_SCORE)
      return {
        score,
        winnerId: this.players.get("right").id,
        loserId: this.players.get("left").id,
      };
  }
}
