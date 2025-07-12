import prisma from "#shared/database/prisma.js";
import { GameStatus, TournamentStatus, TournamentType } from "@prisma/client";

const gameRepo = {
  /**
   * 초기 테스트용 게임 상태 저장 (id=1)
   */
  async saveGameState() {
    const [user1, user2] = await Promise.all([
      prisma.user.findUnique({ where: { id: 1 } }),
      prisma.user.findUnique({ where: { id: 2 } }),
    ]);

    if (!user1) {
      await prisma.user.create({
        data: { username: "Hyuntaek", passwd: "temppassword" },
      });
    }

    if (!user2) {
      await prisma.user.create({
        data: { username: "Taeho", passwd: "temppassword" },
      });
    }

    const tournament1 = await prisma.tournament.findUnique({ where: { id: 1 } });
    if (!tournament1) {
      await prisma.tournament.create({
        data: {
          tournament_type: TournamentType.FINAL,
          tournament_status: TournamentStatus.PENDING,
        },
      });
    }

    const existingGame = await prisma.game.findUnique({ where: { id: 1 } });
    if (existingGame) return;

    const game = await prisma.game.create({
      data: {
        tournament_id: 1,
        player_one_id: 1,
        player_two_id: 2,
        winner_id: 1,
        loser_id: 2,
        round: 0,
        match: 1,
        game_status: GameStatus.COMPLETED,
      },
    });
    console.log("Game state 저장됨:", game);
  },

  /** 특정 게임 ID로 상태 불러오기 */
  async loadGameState(gameId) {
    const game = await prisma.game.findUnique({ where: { id: gameId } });
    console.log("Game state 불러옴:", game);
    return game;
  },

  /** 특정 토너먼트 ID로 불러오기 */
  async loadTournament(tournamentId) {
    console.log("Try to load tournament Id: ", tournamentId);
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    console.log("Tournament Loaded");
    return tournament;
  },

  /** 토너먼트 상태 업데이트 */
  async updateTournament(tournamentId, tournamentType, tournamentStatus) {
    const exists = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!exists) {
      console.error(`❌ [updateTournament] Tournament ID ${tournamentId} not found in DB.`);
      return null;
    }

    return await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        tournament_status: tournamentStatus,
        tournament_type: tournamentType,
      },
    });
  },

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
  },

  /** 게임 결과 업데이트 */
  async updateGameResult(gameId, score, winnerId, loserId) {
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
  },
};

export default gameRepo;
