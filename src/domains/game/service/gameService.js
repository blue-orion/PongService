import Game from '#domains/game/model/Game.js';
import gameRepo from '#domains/game/repo/gameRepo.js';

export class GameService {
  /**
   * GameService 클래스
   * 게임의 생성, 진행, 상태 관리 등을 담당
   *
   * @constructor
   */
  constructor() {
    /**
     * 활성화된 게임 목록
     * @type { Map<number, Game> } - key: gameId, value: Game instance
     */
    this.activeGames = new Map();
    /**
     * gameController가 등록하는 callback 함수
     * @type { (gameId, event, msg) => void }
     */
    this.broadcastCallback = null;
  }

  setBroadcastCallback(callback) {
    this.broadcastCallback = callback;
  }

  /**
   * 새로운 연결 요청 시 DB에서 플레이 위치를 확인하여
   * game 인스턴스에 Player 추가 및 가득차면 게임 시작
   * @param { number } tournamentId
   * @param { number } gameId
   * @param { number } playerId
   */
  async newConnection(tournamentId, gameId, playerId) {
    let game = this.activeGames.get(gameId);
    try {
      if (!game) {
        game = this._makeGameInstance(gameId);
      }
      console.log(`[GameService] ${gameId} game is loaded`);
      const gameData = await gameRepo.loadGameDataById(gameId);

      let role = null;
      if (playerId === gameData.player_one_id) role = 'left';
      if (playerId === gameData.player_two_id) role = 'right';
      if (!role) {
        console.log("[GameService] Role isn't defined");
        //Throw
      }
      game.addPlayer(role, playerId);

      if (game.isFull()) {
        console.log(`[GameService] Start ! (Game Id = ${gameId}`);
        this._startGame(gameId);
      } else {
        console.log(`[GameService] Wating players (Game Id = ${gameId})`);
      }
      return { success: true };
    } catch (err) {
      console.log(`[GameService] Unexpected Error`);
      console.error(err);
      return { success: false };
    }
  }

  /**
   * @private
   * 주어진 gameId에 대해 새로운 Game 인스턴스를 생성하고 activeGames에 등록
   *
   * @param {number} gameId - 생성할 게임 인스턴스의 ID
   * @returns {Game} 생성된 Game 인스턴스
   * @throws {Error} 게임 생성에 실패한 경우 에러를 던집니다.
   */
  _makeGameInstance(gameId) {
    const game = new Game(gameId);
    this.activeGames.set(gameId, game);
    console.log(`[GameService] ${gameId} game is created`);
    if (!game) {
      // Throw Error
    }
    return game;
  }

  /**
   * @private
   * 지정된 gameId에 해당하는 게임을 시작하고 매 프레임마다 상태를 브로드캐스트
   * 게임이 종료되면 후처리 로직 실행
   *
   * @param {number} gameId - 시작할 게임의 고유 ID
   * @returns {void}
   */
  _startGame(gameId) {
    console.log(`[GameService] Start Game ID : ${gameId}`);
    const game = this.activeGames.get(gameId);

    game.start();
    const intervalId = setInterval(async () => {
      const game = this.activeGames.get(gameId);
      if (game.isGameOver() === false) {
        this._sendGameState(gameId);
      } else {
        await this._processEndGame(gameId, intervalId);
      }
    }, 1000 / 60);
  }

  _sendGameState(gameId) {
    const game = this.activeGames.get(gameId);
    if (!game) {
      console.log('[Game] 해당하는 게임이 없음');
    }

    const gameState = game.getState();

    this.broadcastCallback(gameId, 'state', gameState);
  }

  /**
   * @private
   * 게임이 종료되면 Interval 삭제 및 DB에 결과 업데이트
   *
   * @param {number} gameId - 완료된 게임의 고유 gameId
   * @param {number} intervalId - 게임에 대해 등록된 intervalId
   * @returns {Promise<void>} - 비동기 작업으로 반환값 없음
   * @throws {Error} - 게임 정보를 찾을 수 없거나 DB 업데이트에 실패할 경우
   */
  async _processEndGame(gameId, intervalId) {
    clearInterval(intervalId);

    const game = this.activeGames.get(gameId);
    const { score, winnerId, loserId } = game.getResult();
    await gameRepo.updateGameResult(gameId, score, winnerId, loserId);
  }
}

export const gameService = new GameService();
