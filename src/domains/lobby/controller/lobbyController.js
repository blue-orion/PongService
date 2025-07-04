import { LobbyService } from "#domains/lobby/service/lobbyService.js";

export class LobbyController {
  constructor() {
    this.lobbyService = new LobbyService();

    Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(
        (prop) => typeof this[prop] === "function" && prop !== "constructor"
      )
      .forEach((fn) => {
        this[fn] = this[fn].bind(this);
      });
  }

  async getAllLobbies(_req, res) {
    try {
      return await this.lobbyService.getAllLobbies();
    } catch (error) {
      res.code(400).send({ error: error.message });
    }
  }
}
