import prisma from "#shared/database/prisma.js";

export class LobbyRepository {
  async findAll() {
    return await prisma.lobby.findMany();
  }

  async findById(id) {
    return await prisma.lobby.findUnique({
      where: { id },
    });
  }
}
