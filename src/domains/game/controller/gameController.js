import { GameService } from "../service/gameService.js";

export class GameController {
	constructor() {
		this.gameService = new GameService();
	}

	handleMessage(ws, data) {
		if (data.type === 'new') {
			console.log(`새로운 데이터: ${data.msg}`);
			this.gameService.newConnect(ws);
		}
		if (data.type === 'move') {
			this.gameService.movePaddle("left", data.msg);
		}
	}
}

export const gameController = new GameController();
