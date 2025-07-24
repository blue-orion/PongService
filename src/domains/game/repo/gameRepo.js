import prisma from "#shared/database/prisma.js";
import PongException from "#shared/exception/pongException.js";
import { GameStatus, TournamentStatus, TournamentType } from "@prisma/client";

export class GameRepository {
  /** 특정 게임 ID로 상태 불러오기 */
  async getGameById(id) {
    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) {
      throw new PongException(`ID: ${id}에 해당하는 game 데이터가 없습니다.`, 404);
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

  /** 게임 상태 업데이트 */
  async updateGameStatus(gameId, game_status) {
    const exists = await prisma.game.findUnique({ where: { id: gameId } });
    if (!exists) {
      throw new PongException(`Game ID ${gameId} not found in DB.`, 404);
    }

    await prisma.game.update({
      where: { id: gameId },
      data: {
        game_status,
      },
    });
  }

  /** 게임 결과 업데이트 */
  async updateGameResult(gameId, score, winnerId, loserId, playTime) {
    console.log(`winerId = ${winnerId}, loserId = ${loserId}`);

    const exists = await prisma.game.findUnique({ where: { id: gameId } });
    if (!exists) {
      throw new PongException(`Game ID ${gameId} not found in DB.`, 404);
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
        total_losses: { increment: 1 },
      },
    });

    // WinRate Update
    let winRate = (winner.total_wins / (winner.total_wins + winner.total_losses)) * 100;
    await prisma.user.update({
      where: { id: winnerId },
      data: {
        win_rate: winRate,
      },
    });

    winRate = (loser.total_wins / (loser.total_wins + loser.total_losses)) * 100;
    await prisma.user.update({
      where: { id: loserId },
      data: {
        win_rate: winRate,
      },
    });

    return winner;
  }

  // 초기 매칭들을 bulk insert
  async createInitialMatches(matchesData) {
    const createdGames = await Promise.all(
      matchesData.map((match) =>
        prisma.game.create({
          data: match,
          include: {
            player_one: {
              select: {
                id: true,
                nickname: true,
                username: true,
                profile_image: true,
              },
            },
            player_two: {
              select: {
                id: true,
                nickname: true,
                username: true,
                profile_image: true,
              },
            },
            tournament: true,
          },
        })
      )
    );
    return createdGames;
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

  // 토너먼트별 모든 게임 조회 (플레이어 정보 포함)
  async getGamesByTournamentId(tournamentId) {
    return await prisma.game.findMany({
      where: {
        tournament_id: tournamentId,
        enabled: true,
      },
      include: {
        player_one: {
          select: {
            id: true,
            nickname: true,
            username: true,
            profile_image: true,
          },
        },
        player_two: {
          select: {
            id: true,
            nickname: true,
            username: true,
            profile_image: true,
          },
        },
        winner: {
          select: {
            id: true,
            nickname: true,
            username: true,
          },
        },
        loser: {
          select: {
            id: true,
            nickname: true,
            username: true,
          },
        },
        tournament: true,
      },
      orderBy: [{ round: "asc" }, { match: "asc" }],
    });
  }

  // 특정 토너먼트의 특정 라운드 게임들 조회 (플레이어 정보 포함)
  async getGamesByTournamentIdAndRound(tournamentId, round) {
    return await prisma.game.findMany({
      where: {
        tournament_id: tournamentId,
        round: round,
        enabled: true,
      },
      include: {
        player_one: {
          select: {
            id: true,
            nickname: true,
            username: true,
            profile_image: true,
          },
        },
        player_two: {
          select: {
            id: true,
            nickname: true,
            username: true,
            profile_image: true,
          },
        },
        winner: {
          select: {
            id: true,
            nickname: true,
            username: true,
          },
        },
        loser: {
          select: {
            id: true,
            nickname: true,
            username: true,
          },
        },
        tournament: true,
      },
      orderBy: [{ match: "asc" }],
    });
  }

  // 라운드 완료 여부 확인
  async isRoundComplete(tournamentId, round) {
    const totalGames = await prisma.game.count({
      where: {
        tournament_id: tournamentId,
        round: round,
      },
    });

    const completedGames = await prisma.game.count({
      where: {
        tournament_id: tournamentId,
        round: round,
        game_status: "COMPLETED",
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

export default GameRepository;
