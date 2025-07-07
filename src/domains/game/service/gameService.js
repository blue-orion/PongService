import GameState from '../model/GameState.js';
import { saveGameState } from '../repo/gameRepo.js';

export class GameService {
	constructor() {
		this.players = [];
		this.gameState = new GameState;
	}

	newConnect(ws) {
		this.players.push(ws);
		if (this.players.length === 2) {
			this.players[0].emit('role', { role: 'left' })
			this.players[1].emit('role', { role: 'right' })
			this.startGame();
		}
	}

	isGameOver() {
		const score = this.gameState.getScore();
		console.log("current score = ", score);
		if (score.left >= 10) {
			return 'left';
		}
		if (score.right >= 10) {
			return 'right'
		}
		return false;
	}

	startGame() {
		let intervalId = setInterval(() => {
			const result = this.isGameOver();
			if (result === 'left' || result === 'right') {
				clearInterval(intervalId);
				console.log(`${result} user win!!!`);
				saveGameState(1);
			}
			else {
				this.gameState.updateBall();
				this.players.forEach((socket) => {
					socket.emit('state', this.gameState.getState());
				})
			}
		}, 1000/60);
	}

	getState() {
		return (this.gameState.getState());
	}
	
	movePaddle(role, direction) {
		return this.gameState.movePaddle(role, direction);
	}
}
