import prisma from '#shared/database/prisma.js';
import { GameStatus, TournamentStatus, TournamentType } from '@prisma/client';

const tournamentRepo = {
  /** 특정 토너먼트 ID로 불러오기 */
  async loadTournament(tournamentId) {
    console.log('Try to load tournament Id: ', tournamentId);
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    console.log('Tournament Loaded');
    return tournament;
  },

  async findById(tournamentId) {
    console.log('In tournament Repo', tournamentId, '!!!');
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
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
};

export default tournamentRepo;
