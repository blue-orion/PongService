const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 8;
const BALL_RADIUS = 4;

class GameState {
  constructor() {
    this.canvasWidth = CANVAS_WIDTH;
    this.canvasHeight = CANVAS_HEIGHT;
    this.paddles = {
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      left: { x: 0, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT },
      right: { x: CANVAS_WIDTH - PADDLE_WIDTH, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT },
    };
    this.ball = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: this.randomNum(2, 4),
      dy: this.randomNum(0, 10),
      radius: 4,
    };
  }

  randomNum(min, max) {
    let rand = Math.floor(Math.random() * (max - min + 1)) + min;
    if (rand === 0) rand = 1;
    return Math.random() > 0.5 ? rand : -1 * rand;
  }

  movePaddle(role, direction) {
    const paddle = this.paddles[role];
    if (!paddle) return;
    if (direction === 'up') paddle.y -= CANVAS_WIDTH / 100;
    if (direction === 'down') paddle.y += CANVAS_WIDTH / 100;
    if (direction === 'left') paddle.x -= CANVAS_HEIGHT / 100;
    if (direction === 'right') paddle.x += CANVAS_HEIGHT / 100;

    const halfWidth = this.canvasWidth / 2;
    const limitY = { min: 15, max: this.canvasHeight - 15 };

    if (role === 'left') {
      if (paddle.x < 0) paddle.x = 1;
      if (paddle.x > halfWidth) paddle.x = halfWidth - 1;
    } else if (role === 'right') {
      if (paddle.x < halfWidth) paddle.x = halfWidth + 1;
      if (paddle.x > this.canvasWidth) paddle.x = this.canvasWidth - 1;
    }

    if (paddle.y < limitY.min) paddle.y = limitY.min;
    if (paddle.y > limitY.max) paddle.y = limitY.max;
  }

  hitLeftPaddle() {
    const b = this.ball;
    const { width, height } = this.paddles;
    const paddle = this.paddles['left'];

    const paddleTop = paddle.y;
    const paddleBottom = paddle.y + height;
    const paddleRight = paddle.x + width;

    // if (b.x <= left.x && b.y >= left.y && b.y <= left.y + height) {
    if (b.y <= paddleTop || b.y >= paddleBottom) return false;
    if (b.x - b.radius >= paddleRight - 10 && b.x - b.radius <= paddleRight) {
      return true;
    }
    return false;
  }

  hitRightPaddle() {
    const b = this.ball;
    const { width, height } = this.paddles;
    const paddle = this.paddles['right'];

    const paddleTop = paddle.y;
    const paddleBottom = paddle.y + height;
    const paddleLeft = paddle.x;

    // if (b.x <= left.x && b.y >= left.y && b.y <= left.y + height) {
    if (b.y < paddleTop || b.y > paddleBottom) return false;
    if (b.x + b.radius >= paddleLeft && b.x + b.radius <= paddleLeft + 10) {
      return true;
    }
    return false;
  }

  hitCeil() {
    const b = this.ball;
    if (b.y - b.radius <= 0 || b.y + b.radius >= this.canvasHeight) {
      return true;
    }
    return false;
  }

  processHitPaddle() {
    // this.ball.dx = this.randomNum(3, 10);
    // this.ball.dy += this.randomNum(0, 2);
    this.ball.dx *= -1.05;
    this.ball.dy *= 1.05;
  }

  updateBall() {
    const b = this.ball;

    const dx = b.dx < 0 ? -b.dx : b.dx;
    for (let i = 0; i < dx; i++) {
      b.x += b.dx / dx;
      b.y += b.dy / dx;

      if (this.hitLeftPaddle()) this.processHitPaddle();
      if (this.hitRightPaddle()) this.processHitPaddle();
      if (this.hitCeil()) b.dy *= -1;

      // 양 옆 벽에 닿으면 점수 획득
      if (b.x <= 0) {
        return 'right';
      }
      if (b.x >= this.canvasWidth) {
        return 'left';
      }
    }
    return null;
  }

  resetBall() {
    this.ball = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: this.randomNum(3, 5),
      dy: this.randomNum(0, 10),
      radius: 4,
    };
  }

  isGameOver() {
    if (this.score.left >= 10) return 'left';
    if (this.score.right >= 10) return 'right';
    return null;
  }

  getState() {
    return {
      paddles: this.paddles,
      ball: this.ball,
      score: this.score,
    };
  }

  getScore() {
    return this.score;
  }
}

export default GameState;
