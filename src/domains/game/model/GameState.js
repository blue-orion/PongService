const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_HEIGHT = 100;
const MAX_SPEED = 100;
const PADDLE_WIDTH = 8;
const BALL_RADIUS = 4;
const END_SCORE = 10;

class GameState {
  constructor() {
    this.canvasWidth = CANVAS_WIDTH;
    this.canvasHeight = CANVAS_HEIGHT;
    this.paddles = {
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      left: { x: 0, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
      right: { x: CANVAS_WIDTH - PADDLE_WIDTH, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
    };
    this.ball = this.resetBall();
    this.lastHitPaddle = null;
    this.hitCooldown = 0;
    this.status = {
      scored: false,
      waiting: true,
      waitUntil: null,
    };
  }

  randomNum(min, max) {
    let rand = Math.floor(Math.random() * (max - min + 1)) + min;
    if (rand === 0) rand = 1;
    return rand;
  }

  hitLeftPaddle() {
    const b = this.ball;
    const { width, height } = this.paddles;
    const paddle = this.paddles['left'];
    const buffer = 6;

    const paddleTop = paddle.y;
    const paddleBottom = paddle.y + height;
    const paddleLeft = paddle.x;
    const paddleRight = paddle.x + width;

    // 들어가면 충돌로 간주
    if (
      b.y + b.radius >= paddleTop &&
      b.y - b.radius <= paddleBottom &&
      b.x - b.radius <= paddleRight + buffer &&
      b.x + b.radius >= paddleLeft
    )
      return true;
    return false;
  }

  hitRightPaddle() {
    const b = this.ball;
    const { width, height } = this.paddles;
    const paddle = this.paddles['right'];
    const buffer = 6;

    const paddleTop = paddle.y;
    const paddleBottom = paddle.y + height;
    const paddleLeft = paddle.x;
    const paddleRight = paddle.x + width;

    // 들어가면 충돌로 간주
    if (
      b.y + b.radius >= paddleTop &&
      b.y - b.radius <= paddleBottom &&
      b.x + b.radius >= paddleLeft - buffer &&
      b.x - b.radius <= paddleRight
    )
      return true;
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
    if (this.ball.dx < 10) {
      this.ball.dx *= 1.2;
      this.ball.dy *= 1.2;
    } else {
      this.ball.dx *= 1.05;
      this.ball.dy *= 1.05;
    }
    this.ball.direction *= -1;

    //Max Speed 설정
    if (this.ball.dx >= MAX_SPEED) this.ball.dx = MAX_SPEED;
    if (this.ball.dx >= MAX_SPEED) this.ball.dx = MAX_SPEED;

    if (this.lastHitPaddle === 'left') {
      this.ball.x = this.paddles.left.x + this.paddles.width + this.ball.radius + 1;
    } else if (this.lastHitPaddle === 'right') {
      this.ball.x = this.paddles.right.x - this.ball.radius - 1;
    }
  }

  updateBall() {
    const b = this.ball;

    b.prevX = b.x;
    b.prevY = b.y;

    b.x += (b.dx / b.dx) * b.direction;
    b.y += b.dy / b.dx;
  }

  updatePaddle(keyState) {
    for (const role in keyState) {
      const paddle = this.paddles[role];
      const dx = CANVAS_WIDTH / 200;
      const dy = CANVAS_HEIGHT / 100;

      if (keyState[role]['ArrowUp']) paddle.y -= dy;
      if (keyState[role]['ArrowDown']) paddle.y += dy;
      if (keyState[role]['ArrowLeft']) paddle.x -= dx;
      if (keyState[role]['ArrowRight']) paddle.x += dx;

      const halfWidth = this.canvasWidth / 2;
      const limitY = { min: 0, max: this.canvasHeight - 100 };

      if (role === 'left') {
        if (paddle.x < 0) paddle.x = 1;
        if (paddle.x > halfWidth - 11) paddle.x = halfWidth - 11;
      } else if (role === 'right') {
        if (paddle.x < halfWidth) paddle.x = halfWidth + 2;
        if (paddle.x > this.canvasWidth - 10) paddle.x = this.canvasWidth - 10;
      }

      if (paddle.y < limitY.min) paddle.y = limitY.min;
      if (paddle.y > limitY.max) paddle.y = limitY.max;
    }
  }

  // 볼의 속도에 따라 hitCooldown 조절
  calculateHitCooldown() {
    let cooldown;
    if (this.ball.dx < 8) {
      cooldown = 20;
    } else {
      cooldown = 5;
    }
    return cooldown;
  }

  updateState(keyState) {
    if (this.hitCooldown > 0) this.hitCooldown--;

    this.updatePaddle(keyState);
    for (let i = 0; i < this.ball.dx; i++) {
      // 득점이 나면 1초 뒤 게임 시작
      if (this.status.waitUntil !== null) {
        if (Date.now() < this.status.waitUntil) return null;
        this.status.waitUntil = null;
      }
      this.updateBall();

      if (this.hitLeftPaddle() && this.lastHitPaddle !== 'left') {
        this.lastHitPaddle = 'left';
        this.hitCooldown = this.calculateHitCooldown();
        this.processHitPaddle();
      }
      if (this.hitRightPaddle() && this.lastHitPaddle !== 'right') {
        this.lastHitPaddle = 'right';
        this.hitCooldown = this.calculateHitCooldown();
        this.processHitPaddle();
      }
      if (this.hitCooldown === 0) this.lastHitPaddle = null;

      if (this.hitCeil()) this.ball.dy *= -1;

      // 양 옆 벽에 닿으면 점수 획득
      if (this.ball.x <= 0) {
        this.ball = this.resetBall();
        this.status.waitUntil = Date.now() + 1000;
        return 'right';
      }
      if (this.ball.x >= this.canvasWidth) {
        this.ball = this.resetBall();
        this.status.waitUntil = Date.now() + 1000;
        return 'left';
      }
    }
    return null;
  }

  resetBall() {
    const direction = Math.random() > 0.5 ? 1 : -1;
    let dy = this.randomNum(2, 4);
    dy = Math.random() > 0.5 ? -dy : dy;

    return {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      prevX: 0,
      prevY: 0,
      dx: this.randomNum(5, 6),
      dy: dy,
      radius: 4,
      direction: direction,
    };
  }

  isGameOver() {
    if (this.score.left >= END_SCORE) return 'left';
    if (this.score.right >= END_SCORE) return 'right';
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
