class GameState {
	constructor() {
		this.paddles = {
			length: 100,
			left: {x: 10, y: 300},
			right: {x: 790, y: 300}
		};
		this.ball = { x: 400, y: 300, dx: 3, dy: 1 };
		this.height = 600;
		this.width = 800;
		this.score = { left: 0, right: 0 };
	}

	movePaddle(role, direction) {
		if (direction === 'up') {
			this.paddles[role].y += 2;
		}
		if (direction === 'down') {
			this.paddles[role].y -= 2;
		}
		if (direction === 'left') {
			this.paddles[role].x -= 2;
		}
		if (direction === 'right') {
			this.paddles[role].x += 2;
		}

		// 왼쪽 패들 이동 가능 범위 설정
		if (this.paddles.left.x < 0) {
			this.paddles.left.x = 1;
		}
		if (this.paddles.left.x > this.width / 2) {
			this.paddles.left.x = this.width / 2 - 1;
		}
		if (this.paddles.left.y < 15) {
			this.paddles.left.y = 15;
		}
		if (this.paddles.left.y > this.height - 15) {
			this.paddles.left.y = this.height - 15;
		}

		// 오른쪽 패들 이동 가능 범위 설정
		if (this.paddles.right.x < this.width / 2) {
			this.paddles.right.x = this.width / 2 + 1;
		}
		if (this.paddles.right.x > this.width) {
			this.paddles.right.x = this.width - 1;
		}
		if (this.paddles.right.y < 15) {
			this.paddles.right.y = 15;
		}
		if (this.paddles.right.y > this.height - 15) {
			this.paddles.right.y = this.height - 15;
		}
	}

	updateBall() {
		const b = this.ball;
		b.x += b.dx;
		b.y += b.dy;
		if (b.y <= 0 || b.y >= this.height) b.dy *= -1;
		if (b.x <= 0) {
			this.score['right']++;
			b.x = 400;
			b.y = 300;
			b.dx *= -1; // score 획득
		}
		if (b.x >= this.width) {
			this.score['left']++;
			b.x = 400;
			b.y = 300;
			b.dx *= -1; // score 획득
		}
		if (b.x <= this.paddles.left.x) {
			if (b.y >= this.paddles.left.y
				&& b.y <= this.paddles.left.y + this.paddles.length) {
				b.dx *= -1;
				b.dy *= -1;
			}
		}
		if (b.x >= this.paddles.right.x) {
			if (b.y >= this.paddles.right.y
				&& b.y <= this.paddles.right.y + this.paddles.length) {
				b.dx *= -1;
				b.dy *= -1;
			}
		}
	}

	getState() {
		return {
			paddles: { ...this.paddles },
			ball: { ...this.ball },
			score: { ...this.score },
		};
	}
	getScore() {
		return 	this.score;
	}
}

export default GameState;
