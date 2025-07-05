import { ApiResponse } from "#shared/api/response.js";
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
    return ApiResponse.ok(res, await this.lobbyService.getAllLobbies());
  }
}
