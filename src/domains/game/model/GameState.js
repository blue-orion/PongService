class GameState {
	static paddles = { left: 300, right: 300 };
	static ball = { x: 400, y: 300, dx: 4, dy: 2 };
	static height = 600;
	static width = 800;
  
	static setPaddlePosition(role, y) {
	  if (role === 'left' || role === 'right') {
		GameState.paddles[role] = y;
	  }
	}
  
	static updateBall() {
	  const b = GameState.ball;
	  b.x += b.dx;
	  b.y += b.dy;
	  if (b.y <= 0 || b.y >= GameState.height) b.dy *= -1;
	}
  
	static getState() {
	  return {
		paddles: { ...GameState.paddles },
		ball: { ...GameState.ball },
	  };
	}
  }
  
  export default GameState;