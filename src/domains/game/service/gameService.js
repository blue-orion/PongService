import Game from "#domains/game/model/Game.js";
import GameDto from "#domains/game/model/GameDto.js";
import GameRepository from "#domains/game/repo/gameRepo.js";
import { GameStatus } from "@prisma/client";

class GameService {
  /**
   * GameService 클래스
   * 게임의 생성, 진행, 상태 관리 등을 담당
   *
   * @constructor
   */
  constructor(gameRepository = new GameRepository()) {
    /**
     * 활성화된 게임 목록
     * @type { Map<number, Game> } - key: gameId, value: Game instance
     */
    this.activeGames = new Map();
    this.gameIntervalId = new Map();
    this.playTimes = new Map();
    /**
     * gameController가 등록하는 callback 함수
     * @type { (gameId, event, msg) => void }
     */
    this.broadcastCallback = null;
    this.gameRepo = gameRepository;
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
    let game;
    let role = null;
    let status;

    try {
      if (this.activeGames.has(gameId)) {
        game = this.activeGames.get(gameId);
      } else {
        game = this._makeGameInstance(gameId);
      }

      if (this.isConnectedPlayer(gameId, playerId) === true) {
        console.log("이미 연결된 플레이어");
        return { success: false, msg: "이미 연결된 플레이어" };
      }

      const gameData = await this.gameRepo.getGameById(gameId);

      // DB에서 플레이어 role 가져오기
      if (playerId === gameData.player_one_id) role = "left";
      if (playerId === gameData.player_two_id) role = "right";
      if (role === null) {
        throw new Error("[GameService] Role isn't defined");
      }

      game.addPlayer(role, playerId);

      if (!game.isFull()) {
        console.log(`[GameService] Wating players (Game Id = ${gameId})`);
        status = "waiting";
        return { success: true, status, role };
      }
      if (game.isStarted() === false) {
        status = "start";
        this._startGame(gameId);
      }
      if (game.isStoped()) {
        status = "restart";
        this._restartGame(gameId);
      }
      return { success: true, status, role };
    } catch (err) {
      console.warn(`${err.message} (${err.fileName}:${err.lineNumber})`);
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
    if (!game) {
      throw new Error(`[GameService] Unexpected Error`);
    }
    this.activeGames.set(gameId, game);
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
    this.gameRepo.updateGameStatus(gameId, GameStatus.IN_PROGRESS);
    console.log(`[GameService] Start Game ID : ${gameId}`);
    const game = this.activeGames.get(gameId);
    if (game.isStarted()) return;

    game.start();
    this.playTimes.set(gameId, { startTime: performance.now(), endTime: 0 });

    const intervalId = this._broadcastGameState(gameId);
    this.gameIntervalId.set(gameId, intervalId);
  }

  _restartGame(gameId) {
    const game = this.activeGames.get(gameId);

    if (game.isStoped() === false) {
      console.log("이미 시작된 게임입니다.");
      return;
    }
    console.log(`[GameService] Restart game (Game Id = ${gameId})`);

    this.broadcastCallback(game.getPlayers(), "restart", { restartSeconds: 2 });

    game.restart(2);
    const intervalId = this._broadcastGameState(gameId);
    this.gameIntervalId.set(gameId, intervalId);
  }

  _broadcastGameState(gameId) {
    const intervalId = setInterval(async () => {
      try {
        const game = this.activeGames.get(gameId);

        if (game.isGameOver() === false) {
          this._sendGameState(gameId);
        } else {
          await this._processEndGame(gameId, intervalId);
        }
      } catch (err) {
        clearInterval(intervalId);
        throw new Error(err.message);
      }
    }, 1000 / 60);
    return intervalId;
  }

  _sendGameState(gameId) {
    const game = this.activeGames.get(gameId);
    if (!game) {
      throw new Error("[Game] 해당하는 게임이 없음");
    }

    const players = game.getPlayers();

    const gameState = game.getState();
    const payload = {
      ball: gameState.ball,
      paddles: gameState.paddles,
      score: game.getScore(),
      players: {
        left: players.get("left"),
        right: players.get("right"),
      },
    };

    this.broadcastCallback(players, "state", payload);
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

    const time = this.playTimes.get(gameId);
    time.endTime = performance.now();
    const totalSeconds = Math.floor((time.endTime - time.startTime) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const playTime = `${minutes}:${seconds}`;

    const game = this.activeGames.get(gameId);
    const { score, winnerId, loserId } = game.getResult();
    await this.gameRepo.updateGameResult(gameId, score, winnerId, loserId, playTime);

    if (!this.activeGames.delete(gameId)) {
      throw new Error(`[GameService] Unexpected Error`);
    }

    const payload = {
      playTime,
      score: game.getScore(),
    };

    this.broadcastCallback(game.getPlayers(), "gameOver", payload);
  }

  handleKeyDownEvent(gameId, role, keycode) {
    const game = this.activeGames.get(gameId);
    if (!game) return;

    game.setKeyState(role, keycode, true);
  }

  handleKeyUpEvent(gameId, role, keycode) {
    const game = this.activeGames.get(gameId);
    if (!game) return;

    game.setKeyState(role, keycode, false);
  }

  handleDisconnection(gameId, playerId) {
    const intervalId = this.gameIntervalId.get(gameId);
    const game = this.activeGames.get(gameId);
    if (!game) {
      throw new Error("[Game] 해당하는 게임이 없음");
    }

    game.removePlayer(playerId);

    if (!game.isStarted()) {
      return;
    }

    clearInterval(intervalId);
    this._sendGameState(gameId);
    game.stop();

    this.broadcastCallback(game.getPlayers(), "disconnection", { disconnectedId: playerId });
    setTimeout(() => {
      if (game.isStoped() === false) return;
      this._restartGame(gameId);
    }, 10000);
  }

  isConnectedPlayer(gameId, playerId) {
    const game = this.activeGames.get(gameId);
    if (!game) {
      throw new Error("[Game] 해당하는 게임이 없음");
    }
    const players = game.getPlayers();

    return [...players.values()].some((player) => player.id === playerId && player.status === true);
  }

  async getGameById(id) {
    const game = await this.gameRepo.getGameById(id);
    return new GameDto(game);
  }
}

export default GameService;
