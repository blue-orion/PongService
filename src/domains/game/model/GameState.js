class GameState {
	constructor() {
		this.paddles = {
			length: 100,
			left: {x: 0, y: 300},
			right: {x: 790, y: 300}
		};
		this.ball = {
			x: 400,
			y: 300,
			dx: this.randomNum(3, 8),
			dy: this.randomNum(0, 10),
		};
		this.height = 600;
		this.width = 800;
		this.score = { left: 0, right: 0 };
	}

	randomNum(min, max) {
		let randNum = Math.floor(Math.random() * (max - min + 1)) + min;
		randNum = Math.random() > 0.5 ? randNum : -1 * randNum;
		return randNum;
	}

	movePaddle(role, direction) {
		if (direction === 'up') {
			this.paddles[role].y += 10;
		}
		if (direction === 'down') {
			this.paddles[role].y -= 10;
		}
		if (direction === 'left') {
			this.paddles[role].x -= 10;
		}
		if (direction === 'right') {
			this.paddles[role].x += 10;
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
			b.dx = this.randomNum(3, 8);
			b.dy = this.randomNum(0, 10);
		}
		if (b.x >= this.width) {
			this.score['left']++;
			b.x = 400;
			b.y = 300;
			b.dx = this.randomNum(3, 8);
			b.dy = this.randomNum(0, 10);
		}
		if (b.x <= this.paddles.left.x) {
			if (b.y >= this.paddles.left.y
				&& b.y <= this.paddles.left.y + this.paddles.length) {
				b.dx = this.randomNum(3, 10);
				b.dy += this.randomNum(0, 2);
			}
		}
		if (b.x >= this.paddles.right.x) {
			if (b.y >= this.paddles.right.y
				&& b.y <= this.paddles.right.y + this.paddles.length) {
				b.dx = this.randomNum(3, 10);
				b.dy += this.randomNum(0, 2);
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
