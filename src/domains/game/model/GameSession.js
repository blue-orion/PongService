export class GameSession {
	constructor() {
		this.players = [];
		this.started = false;
		this.gameState = new GameState();
	}

	addPlayer (ws) {
		if (this.players.length() >= 2) {
			return false;
		}
		this.player.push(ws);
		if (this.players.length() === 2) {
			this.started = true;
			this.startGame();
		}
		return true;
	}

	getPlayerNum() {
		return this.players.length();
	}
}
