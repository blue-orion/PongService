import { updateGame } from "../repo/gameRepo.js"

export default class Game {
	/**
		* @param { number } gameId
		* @param { {id, Socket}[] } players - 0번째 인덱스가 left, 1번째 인덱스가 right
		*/
  constructor(gameId, players) {
    this.id = gameId;

		/** @type {{id: number, socket: Socket}[]} */
    this.players = players;

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

  isGameOver() {
    const score = this.getScore();
    if (score.left >= 10) return "left";
    if (score.right >= 10) return "right";
    return null;
  }

	startGame() {
    // 역할 지정
    this.players[0].socket.emit("role", { role: "left" });
    this.players[1].socket.emit("role", { role: "right" });

    const intervalId = setInterval(async () => {
      const result = this.isGameOver();
      if (result) {
        clearInterval(intervalId);
        await this.finishGame(result);
      } else {
        this.updateBall();
        const state = this.getState();
        this.players.forEach((player) => {
          player.socket.emit("state", state);
        });
      }
    }, 1000 / 60); // 60fps
  }

  async finishGame(winnerRole) {
		let winnerId = null;
		let loserId = null;

		if (winnerRole === "left") {
			winnerId = this.players[0].id;
			loserId = this.players[1].id;
		}
		else {
			winnerId = this.players[1].id;
			loserId = this.players[0].id;
		}

    const score = this.getScore();

    // ✅ DB에 결과 저장
    await updateGame(this.id, {
      leftScore: score.left,
      rightScore: score.right,
      winnerId,
      loserId,
    });

    // 📨 클라이언트에 결과 전송
    this.players.forEach((player) =>
      player.socket.emit("game_over", {
        winner: winnerRole,
        score,
      })
    );
  }
}
