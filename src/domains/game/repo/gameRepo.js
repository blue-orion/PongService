import prisma from "#shared/database/prisma.js";
import { GameStatus, TournamentStatus, TournamentType } from "@prisma/client";

export class GameRepository {
  /** 특정 게임 ID로 상태 불러오기 */
  async loadGameDataById(gameId) {
    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      console.log(`[GameRepo] ID: ${gameId}에 해당하는 game 데이터가 없습니다.`);
    } else console.log("Game state 불러옴:", game);
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
  async updateGameResult(gameId, score, winnerId, loserId) {
    console.log(`winerId = ${winnerId}, loserId = ${loserId}`);

    const exists = await prisma.game.findUnique({ where: { id: gameId } });
    if (!exists) {
      console.error(`❌ [updateGameResult] Game ID ${gameId} not found in DB.`);
      return null;
    }

    return await prisma.game.update({
      where: { id: gameId },
      data: {
        player_one_score: score.left,
        player_two_score: score.right,
        winner_id: winnerId,
        loser_id: loserId,
        game_status: GameStatus.COMPLETED,
      },
    });
  }

  // 초기 매칭들을 bulk insert
  async createInitialMatches(matchesData) {
    return await prisma.game.createMany({
      data: matchesData,
    });
  }

  // 현재 라운드 가져오기
  async getCurrentRound(tournamentId) {
    const result = await prisma.game.findFirst({
      where: {
        tournament_id: tournamentId,
        enabled: true,
      },
      orderBy: {
        round: "desc",
      },
      select: {
        round: true,
      },
    });

    return result?.round || 1;
  }

  // 특정 라운드에 게임이 있는지 확인 (새로 추가된 메서드)
  async hasGamesInRound(tournamentId, round) {
    const count = await prisma.game.count({
      where: {
        tournament_id: tournamentId,
        round: round,
        enabled: true,
      },
    });

    return count > 0;
  }

  // 라운드 완료 여부 확인
  async isRoundComplete(tournamentId, round) {
    const totalGames = await prisma.game.count({
      where: {
        tournament_id: tournamentId,
        round: round,
        enabled: true,
      },
    });

    const completedGames = await prisma.game.count({
      where: {
        tournament_id: tournamentId,
        round: round,
        game_status: "COMPLETED",
        enabled: true,
      },
    });

    return totalGames === completedGames;
  }

  // 라운드 승자들 가져오기
  async getRoundWinners(tournamentId, round) {
    const winners = await prisma.game.findMany({
      where: {
        tournament_id: tournamentId,
        round: round,
        game_status: "COMPLETED",
        enabled: true,
      },
      select: {
        winner_id: true,
        winner: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return winners.map((game) => ({
      user_id: game.winner_id,
      user: game.winner,
    }));
  }
}
