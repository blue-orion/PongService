import GameState from '../model/GameState.js';

export class GameService {
	static async startGame(gameState) {
		let intervalId = setInterval(() => {
			gameState.updateBall();
		}, 1000);

		setTimeout(() => {
			clearInterval(intervalId);
			console.log("Game Over");
		}, 10000);
	}

	static async getState(gameState) {
		return (gameState.getState());
	}
}
