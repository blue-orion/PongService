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
      left: { x: 0, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
      right: { x: CANVAS_WIDTH - PADDLE_WIDTH, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / j },
    };
    this.ball = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      prevX: 0,
      prevY: 0,
      dx: this.randomNum(3, 5),
      dy: 2,
      radius: 4,
      direction: -1,
    };
    this.lastHitPaddle = null;
    this.hitCooldown = 0;
  }

  randomNum(min, max) {
    let rand = Math.floor(Math.random() * (max - min + 1)) + min;
    if (rand === 0) rand = 1;
    return rand;
  }

  // movePaddle(role, direction) {
  //   const paddle = this.paddles[role];
  //   if (!paddle) return;
  //   if (direction === 'up') paddle.y -= CANVAS_WIDTH / 100;
  //   if (direction === 'down') paddle.y += CANVAS_WIDTH / 100;
  //   if (direction === 'left') paddle.x -= CANVAS_HEIGHT / 100;
  //   if (direction === 'right') paddle.x += CANVAS_HEIGHT / 100;
  //
  //   const halfWidth = this.canvasWidth / 2;
  //   const limitY = { min: 15, max: this.canvasHeight - 15 };
  //
  //   if (role === 'left') {
  //     if (paddle.x < 0) paddle.x = 1;
  //     if (paddle.x > halfWidth) paddle.x = halfWidth - 1;
  //   } else if (role === 'right') {
  //     if (paddle.x < halfWidth) paddle.x = halfWidth + 1;
  //     if (paddle.x > this.canvasWidth) paddle.x = this.canvasWidth - 1;
  //   }
  //
  //   if (paddle.y < limitY.min) paddle.y = limitY.min;
  //   if (paddle.y > limitY.max) paddle.y = limitY.max;
  // }

  hitLeftPaddle() {
    const b = this.ball;
    const { width, height } = this.paddles;
    const paddle = this.paddles['left'];
    const buffer = 6;

    const paddleTop = paddle.y;
    const paddleBottom = paddle.y + height;
    const paddleLeft = paddle.x;
    const paddleRight = paddle.x + width;

    // if (b.x <= left.x && b.y >= left.y && b.y <= left.y + height) {
    if (
      b.y + b.radius >= paddleTop &&
      b.y - b.radius <= paddleBottom &&
      b.x - b.radius <= paddleRight + buffer && // 들어가면 충돌로 간주
      b.x + b.radius >= paddleLeft
    )
      return true;
    // if (b.y < paddleTop || b.y > paddleBottom) return false;
    // if (b.x - b.radius >= paddleRight - width && b.x - b.radius <= paddleRight + buffer) {
    //   return true;
    // }
    // if (
    //   b.prevX - b.radius >= paddleRight + buffer &&
    //   b.x - b.radius >= paddleRight - width &&
    //   b.x - b.radius <= paddleRight + buffer
    // )
    // return true;
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

    // if (b.x <= left.x && b.y >= left.y && b.y <= left.y + height) {
    if (
      b.y + b.radius >= paddleTop &&
      b.y - b.radius <= paddleBottom &&
      b.x + b.radius >= paddleLeft - buffer && // 들어가면 충돌로 간주
      b.x - b.radius <= paddleRight
    )
      return true;
    // if (b.y < paddleTop || b.y > paddleBottom) return false;
    // if (b.x + b.radius >= paddleLeft - buffer && b.x + b.radius <= paddleLeft + width) {
    //   return true;
    // }
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
    if (this.ball.dx < 10) {
      this.ball.dx += this.randomNum(1, 1.5);
      this.ball.dy += this.randomNum(1, 2);
    } else {
      this.ball.dx *= 1.05;
      this.ball.dy *= 1.05;
    }
    this.ball.direction *= -1;

    // 충돌 후 패들 내부에 공이 위치하지 않도록 위치 보정
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

    // const dx = b.dx < 0 ? -b.dx : b.dx;
    // for (let i = 0; i < dx; i++) {
    //   b.x += b.dx / dx;
    //   b.y += b.dy / dx;
    // }
    // return null;
  }

  updatePaddle(keyState) {
    for (const role in keyState) {
      const paddle = this.paddles[role];
      // const dx = 1.5;
      // const dy = 2;
      const dx = CANVAS_WIDTH / 200 / this.ball.dx;
      const dy = CANVAS_HEIGHT / 100 / this.ball.dx;

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
        if (paddle.x < halfWidth) paddle.x = halfWidth + 1;
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

    // this.updateBall();
    // this.updatePaddle(keyState);

    for (let i = 0; i < this.ball.dx; i++) {
      // this.ball.x += (this.ball.dx / this.ball.dx) * this.ball.direction;
      // this.ball.y += this.ball.dy / this.ball.dx;
      this.updateBall();
      this.updatePaddle(keyState);

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
        return 'right';
      }
      if (this.ball.x >= this.canvasWidth) {
        return 'left';
      }
    }
    return null;
  }

  resetBall() {
    const direction = this.ball.direction * -1;
    this.ball = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: this.randNum(3, 5),
      // dx: 2,
      dy: this.randomNum(2, 4),
      radius: 4,
      direction: direction,
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
