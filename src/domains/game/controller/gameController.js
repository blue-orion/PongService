import { GameService } from "../service/gameService.js";

export class GameController {
	constructor() {
		this.gameSession = new GameSession();
		this.gameService = new GameService();
	}

	getState() {
		return (this.gameService.getState());
	}
}

export const gameController = new GameController();
