import prisma from '#shared/database/prisma.js';
import { GameStatus, TournamentStatus, TournamentType } from '@prisma/client';

class GameRepository {
  /** 특정 게임 ID로 상태 불러오기 */
  async loadGameDataById(gameId) {
    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      throw new Error(`[GameRepo] ID: ${gameId}에 해당하는 game 데이터가 없습니다.`);
    }
    return game;
  }

  /** 게임 생성 */
  async createGame(tournamentId, playerOneId, playerTwoId, round = 1, match = 1) {
    return await prisma.game.create({
      data: {
        round,
        match,
        game_status: GameStatus.PENDING,
        tournament: { connect: { id: tournamentId } },
        player_one: { connect: { id: playerOneId } },
        player_two: { connect: { id: playerTwoId } },
      },
    });
  }

  /** 게임 결과 업데이트 */
  async updateGameResult(gameId, score, winnerId, loserId, playTime) {
    console.log(`winerId = ${winnerId}, loserId = ${loserId}`);

    const exists = await prisma.game.findUnique({ where: { id: gameId } });
    if (!exists) {
      throw new Error(`[GameRepo] Game ID ${gameId} not found in DB.`);
    }

    // Game Update
    await prisma.game.update({
      where: { id: gameId },
      data: {
        player_one_score: score.left,
        player_two_score: score.right,
        winner_id: winnerId,
        loser_id: loserId,
        play_time: playTime,
        game_status: GameStatus.COMPLETED,
      },
    });

    // Winner Update
    const winner = await prisma.user.update({
      where: { id: winnerId },
      data: {
        total_wins: { increment: 1 },
      },
    });

    // Loser Update
    const loser = await prisma.user.update({
      where: { id: loserId },
      data: {
        total_loses: { increment: 1 },
      },
    });

    // WinRate Update
    let winRate = (winner.total_wins / (winner.total_wins + winner.total_loses)) * 100;
    await prisma.user.update({
      where: { id: winnerId },
      data: {
        win_rate: winRate,
      },
    });

    winRate = (loser.total_wins / (loser.total_wins + loser.total_loses)) * 100;
    await prisma.user.update({
      where: { id: loserId },
      data: {
        win_rate: winRate,
      },
    });
  }
}

export default GameRepository;
