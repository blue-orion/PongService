import GameState from '../model/GameState.js';

export class GameService {
	constructor() {
		this.players = [];
		this.gameState = new GameState;
	}

	newConnect(ws) {
		this.players.push(ws);
		if (this.players.length === 2) {
			this.startGame();
		}
	}

	startGame() {
		let intervalId = setInterval(() => {
			this.gameState.updateBall();
			this.players.forEach((socket) => {
				socket.emit('state', this.gameState.getState());
			})
		}, 1000);

		setTimeout(() => {
			clearInterval(intervalId);
			console.log("Game Over");
		}, 30000);
	}

	getState() {
		return (this.gameState.getState());
	}
	
	movePaddle(role, direction) {
		return this.gameState.movePaddle(role, direction);
	}
}
