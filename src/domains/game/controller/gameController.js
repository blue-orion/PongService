// src/domains/game/controller/gameController.js
import GameService from "#domains/game/service/gameService.js";
import { ApiResponse } from "#shared/api/response.js";
import websocketManager from "#shared/websocket/websocketManager.js";

class GameController {
  /**
   * GameController 클래스
   * 사용자의 요청을 처리하고 비즈니스 로직을 실행
   * 게임의 진행 상태, 결과 등을 전송
   *
   * @constructor
   */
  constructor() {
    this.gameService = new GameService();

    this.gameService.setBroadcastCallback(this.broadcastMessage);
  }

  // GET /v1/game/:id
  async getGameByIdHandler(request, reply) {
    try {
      const { id } = request.params;
      const game = await this.gameService.getGameById(parseInt(id));
      return ApiResponse.ok(reply, game);
    } catch (err) {
      return ApiResponse.error(reply, err, 404);
    }
  }

  /**
   * 새로운 플레이어 연결 처리
   *
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async handleConnect(socket) {
    const { tournamentId, gameId, playerId } = socket.handshake.auth;
    try {
      const result = await this.gameService.newConnection(tournamentId, gameId, playerId);

      // 이미 연결된 플레이어일 경우
      if (result.success === false) {
        console.log(`[Game Controller] player ${playerId} already joined game`);
        return false;
      }

      console.log(`[Game Controller] player ${playerId} joined game ${gameId}`);

      // 초기 연결 성공 메세지 전송
      socket.emit("status", { payload: { status: result.status || "waiting" } });
      socket.emit("connected", {
        payload: {
          tournamentId,
          gameId,
          playerId,
          success: result.success,
          role: result.role,
        },
      });

      return true;
    } catch (err) {
      console.error(err.message);
      websocketManager.sendToNamespaceUser("game", playerId, "error", { paydload: { msg: err.message } });
      return true;
      // socket.emit("error", { payload: { msg: err.message } });
    }
  }

  /**
   * 플레이어 연결 끊김 시 처리
   *
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async handleDisconnect(socket) {
    const { gameId, playerId } = socket.handshake.auth;

    this.gameService.handleDisconnection(gameId, playerId);
  }

  /**
   * GameService에서 호출하는 브로드캐스트 콜백 함수
   *
   * @param {{id: number, status: boolean}[]} players - 브로드캐스팅할 player 배열
   * @param {string} event - 전송할 이벤트 이름
   * @param {object} msg - 전송할 메세지 객체
   */
  broadcastMessage = (players, event, msg) => {
    for (const [role, info] of players) {
      websocketManager.sendToNamespaceUser("game", info.id, event, { payload: msg });
    }
  };

  /**
   * 클라이언트로부터 수신된 메시지를 처리
   *
   * @param {Socket} socket - 발신자 소켓
   * @param {string|object} raw - JSON 문자열 또는 객체
   * @returns {void}
   */
  handleMoveEvent(socket, raw) {
    try {
      const { playerId } = socket.handshake.auth;
      let data = typeof raw === "string" ? JSON.parse(raw) : raw;

      const { gameId, role, keycode } = data.payload;
      if (!playerId || !gameId || !role || !keycode) {
        throw new Error("playerId, gameId, role, keycode 필드가 누락됨");
      }

      switch (data.type) {
        case "keydown":
          this.gameService.handleKeyDownEvent(gameId, role, keycode);
          break;
        case "keyup":
          this.gameService.handleKeyUpEvent(gameId, role, keycode);
          break;
        default:
          throw new Error("Undefined event type");
      }
    } catch (err) {
      console.warn(`${err.message} (${err.fileName}:${err.lineNumber})`);
      return websocketManager.sendToNamespaceUser("game", playerId, "error", { payload: err.message });
      // socket.emit("error", { payload: err.message });
    }
  }
}

export const gameController = new GameController();
