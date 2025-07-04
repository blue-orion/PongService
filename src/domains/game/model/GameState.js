class GameState {
	constructor() {
		this.paddles = { left: 300, right: 300 };
		this.ball = { x: 400, y: 300, dx: 4, dy: 2 };
		this.height = 600;
		this.width = 800;
	}

	setPaddlePosition(role, y) {
		if (role === 'left' || role === 'right') {
			this.paddles[role] = y;
		}
	}

	updateBall() {
		const b = this.ball;
		b.x += b.dx;
		b.y += b.dy;
		if (b.y <= 0 || b.y >= this.height) b.dy *= -1;
	}

	getState() {
		return {
			paddles: { ...this.paddles },
			ball: { ...this.ball },
		};
	}
}

export default GameState;
