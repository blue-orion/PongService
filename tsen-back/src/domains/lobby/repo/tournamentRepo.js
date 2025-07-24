import prisma from "#shared/database/prisma.js";

export class TournamentRepository {
  async create(type) {
    return await prisma.tournament.create({
      data: {
        tournament_type: type,
        tournament_status: "PENDING",
        round: 1
      },
    });
  }

  async findById(id) {
    return await prisma.tournament.findUnique({
      where: { id },
      include: {
        lobbies: {
          include: {
            lobby_players: {
              include: { user: true },
            },
          },
        },
        games: {
          include: {
            player_one: {
              select: { id: true, nickname: true, username: true }
            },
            player_two: {
              select: { id: true, nickname: true, username: true }
            },
            winner: {
              select: { id: true, nickname: true, username: true }
            },
            loser: {
              select: { id: true, nickname: true, username: true }
            }
          }
        },
      },
    });
  }

  async updateStatus(id, status) {
    return await prisma.tournament.update({
      where: { id },
      data: { tournament_status: status },
    });
  }

  async findAll() {
    return await prisma.tournament.findMany({
      include: {
        lobbies: {
          include: {
            lobby_players: {
              include: { user: true },
            },
          },
        },
        games: true,
      },
    });
  }

  async findByStatus(status) {
    return await prisma.tournament.findMany({
      where: { tournament_status: status },
      include: {
        lobbies: {
          include: {
            lobby_players: {
              include: { user: true },
            },
          },
        },
        games: true,
      },
    });
  }

  async incrementRound(id) {
    return await prisma.tournament.update({
      where: { id },
      data: { 
        round: {
          increment: 1
        }
      },
    });
  }
}
