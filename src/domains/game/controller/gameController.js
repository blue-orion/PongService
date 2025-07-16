// src/domains/game/controller/gameController.js
import { gameService } from '#domains/game/service/gameService.js';

class GameController {
  /**
   * GameController 클래스
   * 사용자의 요청을 처리하고 비즈니스 로직을 실행
   * 게임의 진행 상태, 결과 등을 전송
   *
   * @constructor
   */
  constructor() {
    /**
     * @type { Map<number, Socket[]> } - key: gameId => value: Socket 배열
     */
    this.sockets = new Map();
    gameService.setBroadcastCallback(this.broadcastMessage);
  }

  /**
   * 새로운 플레이어 연결 처리
   *
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async handleConnection(socket, tournamentId, gameId, playerId) {
    try {
      const result = await gameService.newConnection(tournamentId, gameId, playerId);

      // 연결이 성공하면 소켓 등록
      if (!this.sockets.has(gameId)) {
        this.sockets.set(gameId, []);
      }
      this.sockets.get(gameId).push(socket);

      console.log(`[Game Controller] player ${playerId} joined game ${gameId}`);

      socket.emit('status', { payload: { status: result.status || 'waiting' } });
      return socket.emit('connected', {
        payload: {
          tournamentId,
          gameId,
          playerId,
          success: result.success,
          role: result.role,
        },
      });
    } catch (err) {
      console.error(err.message);
      return socket.emit('error', { payload: { msg: err.message } });
    }
  }

  /**
   * gameService에서 호출하는 브로드캐스트 콜백 함수
   *
   * @param {number} gameId - 브로드캐스팅할 범위의 gameId
   * @param {string} event - 전송할 이벤트 이름
   * @param {object} msg - 전송할 메세지 객체
   */
  broadcastMessage = (gameId, event, msg) => {
    const room = this.sockets.get(gameId);

    room.forEach((socket) => {
      socket.emit(event, { payload: msg });
    });
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
      let data = typeof raw === 'string' ? JSON.parse(raw) : raw;

      const { gameId, role, keycode } = data.payload;
      if (!playerId || !gameId || !role || !keycode) {
        throw new Error('playerId, gameId, role, keycode 필드가 누락됨');
      }

      switch (data.type) {
        case 'keydown':
          gameService.handleKeyDownEvent(gameId, role, keycode);
          break;
        case 'keyup':
          gameService.handleKeyUpEvent(gameId, role, keycode);
          break;
        default:
          throw new Error('Undefined event type');
      }
    } catch (err) {
      console.warn(`${err.message} (${err.fileName}:${err.lineNumber})`);
      return socket.emit('error', { payload: err.message });
    }
  }
}

export const gameController = new GameController();
