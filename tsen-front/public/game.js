// public/game.js
class PongGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.connectToServer();
    this.setupKeyboardControls();
  }

  connectToServer() {
    // 클라이언트 연결
    this.socket = io('http://localhost:3003/ws/game', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('게임 서버에 연결됨');
      this.socket.emit("message", {
        type: 'new',
        msg: 'Hi Server!'
      });
      this.playerId = this.socket.id;
      document.getElementById('gameStatus').textContent = '연결됨';
    });

    this.socket.on('state', (msg) => {
      this.updateGameState(msg);
    });

    this.socket.on('disconnect', () => {
      console.log('서버 연결 해제됨');
      document.getElementById('gameStatus').textContent = '연결 해제됨';
    });

  }

  updateGameState(gameState) {
    this.gameState = gameState;
    this.render();
  }

  render() {
    // 게임 화면 렌더링 로직
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 공 그리기
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(this.gameState.ball.x, this.gameState.ball.y, 10, 10);
    
    // 패들 그리기
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(this.gameState.paddles.left.x, this.gameState.paddles.left.y, 10, 100);
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(this.gameState.paddles.right.x, this.gameState.paddles.right.y, 10, 100);
  }
  // 키보드 이벤트 설정 (클래스 내부로 이동)
  setupKeyboardControls() {
    // this 바인딩을 위해 화살표 함수 사용
    document.addEventListener('keydown', (event) => {
      // 소켓 연결 상태 확인
      if (!this.socket || !this.socket.connected) {
        console.warn('서버에 연결되지 않음');
        return;
      }

      switch (event.key) {
        case 'ArrowUp':
          console.log('위쪽 화살표 키 입력됨');
          this.socket.emit('message', { // 오타 수정: messeage → message
            type: 'move',
            msg: 'up',
          });
          break;
        case 'ArrowDown':
          console.log('아래쪽 화살표 키 입력됨');
          this.socket.emit('message', {
            type: 'move',
            msg: 'down',
          });
          break;
        case 'ArrowLeft':
          console.log('왼쪽 화살표 키 입력됨');
          this.socket.emit('message', {
            type: 'move',
            msg: 'left',
          });
          break;
        case 'ArrowRight':
          console.log('오른쪽 화살표 키 입력됨');
          this.socket.emit('message', {
            type: 'move',
            msg: 'right',
          });
          break;
        default:
          // 다른 키 처리
          break;
      }
    });
  };
}

// 게임 시작
const game = new PongGame();
