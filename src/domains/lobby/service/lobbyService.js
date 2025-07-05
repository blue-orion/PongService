import { LobbyRepository } from "#domains/lobby/repo/lobbyRepo.js";

export class LobbyService {
  constructor() {
    this.lobbyRepository = new LobbyRepository();
  }

  async getAllLobbies() {
    return await this.lobbyRepository.findAll();
  }
}
