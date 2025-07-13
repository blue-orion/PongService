// src/domains/game/controller/gameController.js

import { gameService } from '../service/gameService.js';
import { tournamentService } from '../service/tournamentService.js';

export const gameController = {
  /**
   * 새로운 플레이어 연결 처리
   */
  async handleConnection(socket, tournamentId, playerId) {
    try {
      const status = await tournamentService.newConnection(socket, tournamentId, playerId);
      console.log(`[Connected] player ${playerId} joined tournament ${tournamentId}`);
      return status;
    } catch (err) {
      console.error('❌ 연결 오류:', err);
      return { success: false, message: 'Tournament connection failed' };
    }
  },

  /**
   * 클라이언트의 메시지 처리
   */
  handleMessage(socket, raw) {
    let data;
    try {
      data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      console.warn('⚠️ Invalid message format');
      return;
    }

    switch (data.type) {
      case 'move':
        gameService.handleMoveBySocket(socket.id, data.role, data.direction);
        break;

      case 'ping':
        socket.emit('pong');
        break;

      default:
        console.warn('알 수 없는 메시지 타입:', data.type);
    }
  },
};
