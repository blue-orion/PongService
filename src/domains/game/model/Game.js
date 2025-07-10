export default class Game {
  constructor(gameId, playerIds) {
    this.id = gameId;
    this.playerIds = playerIds;

    this.paddles = {
      length: 100,
      left: { x: 0, y: 300 },
      right: { x: 790, y: 300 },
    };

    this.ball = {
      x: 400,
      y: 300,
      dx: this.randomNum(3, 8),
      dy: this.randomNum(0, 10),
    };

    this.score = { left: 0, right: 0 };
    this.width = 800;
    this.height = 600;
  }

  randomNum(min, max) {
    let rand = Math.floor(Math.random() * (max - min + 1)) + min;
    return Math.random() > 0.5 ? rand : -1 * rand;
  }

  movePaddle(role, direction) {
    const paddle = this.paddles[role];
    if (!paddle) return;

    if (direction === "up") paddle.y += 10;
    if (direction === "down") paddle.y -= 10;
    if (direction === "left") paddle.x -= 10;
    if (direction === "right") paddle.x += 10;

    const halfWidth = this.width / 2;
    const limitY = { min: 15, max: this.height - 15 };

    if (role === "left") {
      if (paddle.x < 0) paddle.x = 1;
      if (paddle.x > halfWidth) paddle.x = halfWidth - 1;
    } else if (role === "right") {
      if (paddle.x < halfWidth) paddle.x = halfWidth + 1;
      if (paddle.x > this.width) paddle.x = this.width - 1;
    }

    if (paddle.y < limitY.min) paddle.y = limitY.min;
    if (paddle.y > limitY.max) paddle.y = limitY.max;
  }

  updateBall() {
    const b = this.ball;
    b.x += b.dx;
    b.y += b.dy;

    // 벽 충돌
    if (b.y <= 0 || b.y >= this.height) b.dy *= -1;

    // 점수 체크
    if (b.x <= 0) {
      this.score.right++;
      return this.resetBall();
    }

    if (b.x >= this.width) {
      this.score.left++;
      return this.resetBall();
    }

    // 패들 충돌
    const { left, right, length } = this.paddles;

    if (b.x <= left.x && b.y >= left.y && b.y <= left.y + length) {
      b.dx = this.randomNum(3, 10);
      b.dy += this.randomNum(0, 2);
    }

    if (b.x >= right.x && b.y >= right.y && b.y <= right.y + length) {
      b.dx = -this.randomNum(3, 10); // 반대 방향
      b.dy += this.randomNum(0, 2);
    }
  }

  resetBall() {
    this.ball = {
      x: 400,
      y: 300,
      dx: this.randomNum(3, 8),
      dy: this.randomNum(0, 10),
    };
  }

  getScore() {
    return this.score;
  }

  getState() {
    return {
      gameId: this.id,
      paddles: this.paddles,
      ball: this.ball,
      score: this.score,
    };
  }
}
