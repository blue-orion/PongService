import GameState from './GameState.js';

export const END_SCORE = 10;

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
    this.isStarted = false;
  }

  start() {
    const intervalId = setInterval(async () => {
      if (this.isGameOver()) {
        clearInterval(intervalId);
      } else {
        const scoredRole = this.state.updateState(this.keyState);
        if (scoredRole !== null) {
          this.score[scoredRole]++;
          this.state.resetBall();
          console.log(this.score);
        }
      }
    }, 1000 / 60);
  }

  isFull() {
    console.log(`Player Number in gameID(${this.id}): ${this.players.size}`);
    console.log(this.players);
    if (this.players.size === 2) {
      return true;
    }
    return false;
  }

  /**
   * 게임 종료 조건 확인
   * @returns {"left" | "right" | false}
   */
  isGameOver() {
    const score = this.score;
    if (score.left >= END_SCORE) return 'left';
    if (score.right >= END_SCORE) return 'right';
    return false;
  }

  /** Player 추가 */
  addPlayer(role, playerId) {
    // TODO: 이미 존재하는 유저 ID일 경우 오류 반환
    for (let id in this.players) {
      if (id === playerId) {
        console.log('이미 존재하는 플레이어입니다.');
        return;
      }
    }
    this.players.set(role, playerId);
  }

  setKeyState(role, keycode, mode) {
    this.keyState[role][keycode] = mode;
  }

  getPlayers() {
    return [...this.players];
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
        winnerId: this.players.get('left'),
        loserId: this.players.get('right'),
      };
    if (score.right >= END_SCORE)
      return {
        score,
        winnerId: this.players.get('right'),
        loserId: this.players.get('left'),
      };
  }
}
