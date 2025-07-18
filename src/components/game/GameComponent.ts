import { Component } from "../Component";
import { io, Socket } from "socket.io-client";
import { AuthManager } from "../../utils/auth";
// 서버 메시지 구조에 맞는 타입 정의
type PaddleSide = "left" | "right";
interface Paddle {
  x: number;
  y: number;
}
interface GameState {
  ball: { x: number; y: number; vx: number; vy: number; radius: number; };
  paddles: {
    width: number;
    height: number;
    left: Paddle;
    right: Paddle;
  };
  score: { left: number; right: number; };
  status?: "waiting" | "playing" | "finished" | "paused";
  winner?: "left" | "right" | null;
}
import { KeyboardControls, ConnectionStatus } from "../../types/game";
import { loadTemplate, TEMPLATE_PATHS } from "../../utils/template-loader";

export class GameComponent extends Component {
  private myRole: "left" | "right" = "left";
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private socket: Socket | null = null;
  private gameState: GameState | null = null;
  private keyboardControls: KeyboardControls = { up: false, down: false };
  private lastUpdateTime = 0;
  private animationId: number | null = null;

  // UI 요소들
  private statusElement!: HTMLElement;
  private connectionStatusElement!: HTMLElement;

  private tournamentId: number = 1;
  private gameId: number = 1;
  private playerId: string = "";

  constructor(container: HTMLElement) {
    super(container);
    // accessToken에서 playerId 추출 (JWT 디코딩)
    const tokens = AuthManager.getTokens && AuthManager.getTokens();
    const token = tokens && tokens.accessToken;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        this.playerId = payload.id;
      } catch (e) {
        this.playerId = "";
      }
    }
    // tournamentId, gameId는 임시로 1
    this.tournamentId = 1;
    this.gameId = 1;
  }

  async render(): Promise<void> {
    this.clearContainer();

    const template = await loadTemplate(TEMPLATE_PATHS.GAME);
    this.container.innerHTML = template;

    this.canvas = this.container.querySelector("#gameCanvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;
    this.statusElement = this.container.querySelector("#gameStatus")!;
    this.connectionStatusElement = this.container.querySelector("#connectionStatus")!;

    // 게임 초기화 (인증은 이미 앱 레벨에서 확인됨)
    this.initializeGame();
  }

  private initializeGame(): void {
    this.setupUI();
    this.connectWebSocket();
    this.setupKeyboardControls();
    this.startGameLoop();
  }

  private connectWebSocket(): void {
    this.socket = io("http://localhost:3333/ws/game", {
      auth: {
        tournamentId: this.tournamentId,
        gameId: this.gameId,
        playerId: this.playerId,
      },
      transports: ["websocket"],
    });

    this.socket.on("connected", (msg) => {
      const payload = msg?.payload;
      this.updateConnectionStatus("connected");
      if (payload?.role === "left" || payload?.role === "right") {
        this.myRole = payload.role;
      }
    });

    this.socket.on("state", (msg) => {
      const payload = msg?.payload;
      this.gameState = payload;
      this.updateGameStatus(payload);
      
      // 게임 종료 상태 체크 - 점수로도 확인
      if (payload?.status === "finished" || this.checkGameEndByScore(payload)) {
        this.showGameResult(payload);
      }
    });

    this.socket.on("status", (msg) => {
      const payload = msg?.payload;
      // 게임 상태 변화 처리
      if (payload?.status === "finished") {
        this.showGameResult(payload);
      }
    });

    this.socket.on("error", (msg) => {
      // payload가 string 또는 { msg: string } 형태
      const payload = msg?.payload;
      if (typeof payload === "string") {
        this.showError(payload);
      } else if (payload && payload.msg) {
        this.showError(payload.msg);
      } else {
        this.showError("알 수 없는 에러");
      }
    });

    this.socket.on("disconnect", () => {
      this.updateConnectionStatus("disconnected");
    });

    this.socket.on("connect_error", (err) => {
      this.updateConnectionStatus("disconnected");
      this.showError("서버 연결 오류: " + err.message);
    });
  }

  private setupWebSocketEvents(): void {
    // 연결 상태 변화 감지

  }

  private setupKeyboardControls(): void {

    const keydownHandler = (event: KeyboardEvent) => {
      if (!this.socket) return;
      let keycode = event.code;
      if (event.repeat) return;
      // w/s를 ArrowUp/ArrowDown으로 변환
      if (keycode === "KeyW") keycode = "ArrowUp";
      if (keycode === "KeyS") keycode = "ArrowDown";
      if (["ArrowUp", "ArrowDown"].includes(keycode)) {
        this.socket.emit("move", {
          type: "keydown",
          payload: {
            gameId: this.gameId,
            role: this.myRole,
            keycode,
          },
        });
        event.preventDefault();
      }
    };

    const keyupHandler = (event: KeyboardEvent) => {
      if (!this.socket) return;
      let keycode = event.code;
      // w/s를 ArrowUp/ArrowDown으로 변환
      if (keycode === "KeyW") keycode = "ArrowUp";
      if (keycode === "KeyS") keycode = "ArrowDown";
      if (["ArrowUp", "ArrowDown"].includes(keycode)) {
        this.socket.emit("move", {
          type: "keyup",
          payload: {
            gameId: this.gameId,
            role: this.myRole,
            keycode,
          },
        });
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", keydownHandler);
    window.addEventListener("keyup", keyupHandler);

    // 정리용 핸들러 저장
    (this as any)._keydownHandler = keydownHandler;
    (this as any)._keyupHandler = keyupHandler;
  }

  private setupUI(): void {
    // 컨트롤 버튼들 컨테이너
    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "flex gap-3 mt-4";

    // 재연결 버튼
    const reconnectBtn = document.createElement("button");
    reconnectBtn.textContent = "재연결";
    reconnectBtn.className = "btn-primary";
    reconnectBtn.onclick = () => this.connectWebSocket();

    // 로그아웃 버튼
    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "로그아웃";
    logoutBtn.className = "btn-muted";
    logoutBtn.onclick = () => {
      if (confirm("정말 로그아웃하시겠습니까?")) {
        AuthManager.logout();
        window.router.navigate("/login");
      }
    };

    buttonsContainer.appendChild(reconnectBtn);
    buttonsContainer.appendChild(logoutBtn);
    this.statusElement.appendChild(buttonsContainer);
  }

  private sendPlayerMove(direction: "up" | "down"): void {
    // socket.io 기반에서는 키 이벤트에서 직접 emit 처리하므로 이 메서드는 더 이상 사용하지 않음
  }

  private updateConnectionStatus(status: ConnectionStatus): void {
    const statusMessages = {
      connecting: "연결 중...",
      connected: "연결됨",
      disconnected: "연결 끊김",
      reconnecting: "재연결 중...",
    };

    const statusClasses = {
      connecting: "status-connecting",
      connected: "status-connected",
      disconnected: "status-disconnected",
      reconnecting: "status-connecting",
    };

    this.connectionStatusElement.textContent = statusMessages[status];
    this.connectionStatusElement.className = `connection-status ${statusClasses[status]}`;
  }

  private updateGameStatus(state: GameState): void {
    if (!state || !state.score) return;
    const scores = `LEFT: ${state.score.left} | RIGHT: ${state.score.right}`;
    let scoresDiv = this.statusElement.querySelector(".scores") as HTMLElement;
    if (!scoresDiv) {
      scoresDiv = document.createElement("div");
      scoresDiv.className = "scores mt-2 text-sm";
      this.statusElement.appendChild(scoresDiv);
    }
    scoresDiv.textContent = scores;
  }

  private checkGameEndByScore(payload: any): boolean {
    // 점수가 10점에 도달했는지 확인
    if (payload?.score) {
      const leftScore = payload.score.left || 0;
      const rightScore = payload.score.right || 0;
      if (leftScore >= 10 || rightScore >= 10) {
        return true;
      }
    }
    return false;
  }

  private showGameResult(gameData: any): void {
    // 승자 결정 (점수 기반)
    if (!gameData.winner && gameData.score) {
      const leftScore = gameData.score.left || 0;
      const rightScore = gameData.score.right || 0;
      if (leftScore > rightScore) {
        gameData.winner = "left";
      } else if (rightScore > leftScore) {
        gameData.winner = "right";
      }
    }
    
    // 결과 메시지 생성
    let resultMessage = "게임 종료!";
    if (gameData.winner) {
      const winnerText = gameData.winner === "left" ? "P1" : "P2";
      const isWinner = gameData.winner === this.myRole;
      resultMessage = isWinner ? `승리! ${winnerText} 승!` : `패배! ${winnerText} 승!`;
    }
    
    // 결과 표시
    const resultDiv = document.createElement("div");
    resultDiv.className = "game-result glass-card p-6 mt-4 text-center";
    resultDiv.innerHTML = `
      <h3 class="text-2xl font-bold text-primary-700 mb-4">${resultMessage}</h3>
      <p class="text-primary-600 mb-4">최종 점수: ${this.gameState?.score.left || 0} - ${this.gameState?.score.right || 0}</p>
      <button class="btn-primary" onclick="location.reload()">다시 게임</button>
    `;
    
    this.statusElement.appendChild(resultDiv);
  }

  private showError(error: string): void {
    const errorDiv = document.createElement("div");
    errorDiv.className = "bg-red-500 text-white p-2 rounded mt-2";
    errorDiv.textContent = error;
    this.statusElement.appendChild(errorDiv);

    // 5초 후 자동 제거
    setTimeout(() => errorDiv.remove(), 5000);
  }

  private startGameLoop(): void {
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - this.lastUpdateTime;
      this.lastUpdateTime = currentTime;

      this.renderCanvas();
      this.animationId = requestAnimationFrame(gameLoop);
    };

    this.animationId = requestAnimationFrame(gameLoop);
  }

  private renderCanvas(): void {
    // 캔버스 클리어 - 투명하게 처리해서 배경 글래스 효과와 물방울이 보이도록
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.gameState) {
      this.renderWaitingScreen();
      return;
    }

    this.renderGameObjects();
  }
  private renderGameObjects(): void {
    if (!this.gameState || !this.gameState.paddles || !this.gameState.ball) return;

    const { left, right, width, height } = this.gameState.paddles;
    
    // P1 패들 렌더링 (left) - primary-600 색상
    this.ctx.fillStyle = "#6182b8";
    this.ctx.fillRect(left.x, left.y, width, height);
    
    // P2 패들 렌더링 (right) - secondary-600 색상  
    this.ctx.fillStyle = "#9070aa";
    this.ctx.fillRect(right.x, right.y, width, height);

    // 공 렌더링 - 글래스 효과와 함께
    const ball = this.gameState.ball;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "#1f2937";
    this.ctx.fill();
    
    // 공에 글래스 하이라이트 효과
    this.ctx.beginPath();
    this.ctx.arc(ball.x - ball.radius/3, ball.y - ball.radius/3, ball.radius/3, 0, Math.PI * 2);
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    this.ctx.fill();

    // 중앙선 렌더링 - 글래스 효과
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([8, 8]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private renderWaitingScreen(): void {
    // 글래스 효과와 함께 대기 화면 텍스트 렌더링
    this.ctx.fillStyle = "rgba(77, 106, 159, 0.9)"; // primary-700 with opacity
    this.ctx.font = '28px "Pretendard", -apple-system, BlinkMacSystemFont, sans-serif';
    this.ctx.textAlign = "center";
    
    // 텍스트 그림자 효과
    this.ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    
    this.ctx.fillText("게임 서버에 연결 중...", this.canvas.width / 2, this.canvas.height / 2);
    
    // 그림자 효과 초기화
    this.ctx.shadowColor = "transparent";
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }

  destroy(): void {
    // 애니메이션 정리
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    // WebSocket 연결 정리
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    // 키보드 이벤트 리스너 정리
    if ((this as any)._keydownHandler) {
      window.removeEventListener("keydown", (this as any)._keydownHandler);
    }
    if ((this as any)._keyupHandler) {
      window.removeEventListener("keyup", (this as any)._keyupHandler);
    }
  }
}
