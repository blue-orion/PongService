import { Component } from "../Component";
import { io, Socket } from "socket.io-client";
import { UserManager } from "../../utils/user";
const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_BASE_URL;

// 서버 메시지 구조에 맞는 타입 정의
type PaddleSide = "left" | "right";
interface Paddle {
  x: number;
  y: number;
}
interface GameState {
  ball: { x: number; y: number; vx: number; vy: number; radius: number };
  paddles: {
    width: number;
    height: number;
    left: Paddle;
    right: Paddle;
  };
  score: { left: number; right: number };
  players?: {
    left?: { username?: string };
    right?: { username?: string };
    leftUsername?: string;
    rightUsername?: string;
  };
  status?: "waiting" | "playing" | "finished" | "paused";
  winner?: "left" | "right" | null;
}

import { ArrowKey, KeyState, KeyboardControls, ConnectionStatus } from "../../types/game";

export class GameComponent extends Component {
  private myRole: "left" | "right" = "left";
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private scoresElement!: HTMLElement;
  private socket: Socket | null = null;
  private gameState: GameState | null = null;
  private keyboardControls: KeyboardControls = { up: false, down: false };
  private lastUpdateTime = 0;
  private animationId: number | null = null;
  private keyState: KeyState = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  };

  // UI 요소들
  private statusElement!: HTMLElement;
  private connectionStatusElement!: HTMLElement;

  private tournamentId: number = 0;
  private gameId: number = 0;
  private playerId: number | null = 0;
  private nickname: string | null = "";

  constructor(container: HTMLElement, ...args: any[]) {
    super(container);
    this.playerId = UserManager.getUserId();
    this.nickname = UserManager.getUsername();

    const { gameId, tournamentId } = args[0];
    console.log(args, tournamentId, gameId);
    // tournamentId, gameId는 임시로 1
    this.tournamentId = Number(tournamentId);
    this.gameId = Number(gameId);
  }

  private getTemplate(): string {
    return `
<div class="game-container relative overflow-hidden">
  <!-- 배경 플로팅 요소들 (로그인과 동일) -->
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-20 left-20 w-20 h-20 bg-primary-300/30 rounded-full floating"></div>
    <div
      class="absolute top-40 right-40 w-16 h-16 bg-secondary-300/30 rounded-full floating"
      style="animation-delay: -2s"
    ></div>
    <div
      class="absolute bottom-32 left-32 w-12 h-12 bg-neutral-300/30 rounded-full floating"
      style="animation-delay: -4s"
    ></div>
    <div
      class="absolute bottom-20 right-20 w-24 h-24 bg-primary-200/20 rounded-full floating"
      style="animation-delay: -1s"
    ></div>
    <div
      class="absolute top-1/2 left-1/4 w-8 h-8 bg-secondary-200/25 rounded-full floating"
      style="animation-delay: -3s"
    ></div>
    <div
      class="absolute top-1/3 right-1/3 w-14 h-14 bg-accent-300/20 rounded-full floating"
      style="animation-delay: -5s"
    ></div>
  </div>

  <div class="status-bar flex relative justify-between items-center w-[800px]">
		<div id="gameStatus" class="game-status">
			<div id="connectionStatus" class="connection-status status-connecting">연결 중...</div>
		</div>

		<div id="scores" class="scores text-2xl text-center">LEFT: 0 | RIGHT: 0</div>

		<div class="text-sm text-primary-600 glass-card p-1.5 text-center">
			<p class="font-medium">게임 조작법</p>
			<p class="mt-1">W/A/S/D 또는 방향키로 패들을 조작하세요</p>
		</div>
	</div>
  <canvas id="gameCanvas" class="game-canvas relative z-0" width="800" height="600"></canvas>
</div>
    `;
  }

  async render(): Promise<void> {
    this.clearContainer();

    this.container.innerHTML = this.getTemplate();

    this.canvas = this.container.querySelector("#gameCanvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;
    this.scoresElement = this.container.querySelector("#scores") as HTMLElement;
    this.connectionStatusElement = this.container.querySelector("#connectionStatus") as HTMLElement;
    this.statusElement = this.container.querySelector("#gameStatus") as HTMLElement;

    // 게임 초기화 (인증은 이미 앱 레벨에서 확인됨)
    this.initializeGame();
  }

  private initializeGame(): void {
    // this.setupUI();
    this.connectWebSocket();
    this.setupKeyboardControls();
    this.startGameLoop();
  }

  private connectWebSocket(): void {
    this.socket = io(`${SOCKET_BASE_URL}/ws/game`, {
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

    this.socket.on("gameOver", (msg) => {
      const payload = msg?.payload;
      console.log(msg);
      this.showGameResult(payload);
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
      let keycode: string = event.code;
      if (event.repeat) return;
      // w/s를 ArrowUp/ArrowDown으로 변환
      if (keycode === "KeyW") keycode = "ArrowUp";
      if (keycode === "KeyS") keycode = "ArrowDown";
      if (keycode === "KeyA") keycode = "ArrowLeft";
      if (keycode === "KeyD") keycode = "ArrowRight";
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(keycode)) {
        if (this.keyState[keycode as ArrowKey] === true) return;
        this.keyState[keycode as ArrowKey] = true;
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
      let keycode: string = event.code;
      // w/s를 ArrowUp/ArrowDown으로 변환
      if (keycode === "KeyW") keycode = "ArrowUp";
      if (keycode === "KeyS") keycode = "ArrowDown";
      if (keycode === "KeyA") keycode = "ArrowLeft";
      if (keycode === "KeyD") keycode = "ArrowRight";
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(keycode)) {
        this.keyState[keycode as ArrowKey] = false;
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
    
    // 여러 가능한 username 필드를 체크하여 안전하게 접근
    const leftUsername = state.players?.left?.username || "LEFT";
    const rightUsername = state.players?.right?.username || "RIGHT";

    const scores = `${leftUsername}: ${state.score.left} | ${rightUsername}: ${state.score.right}`;
    this.scoresElement.textContent = scores;
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
    console.log("🎮 게임 결과 표시:", gameData);

    // 결과 메시지 생성 및 승패 판단
    let resultMessage = "게임 종료!";
    let isWinner = false;

    if (gameData.winner) {
      const winnerName = gameData.winner;
      const myName = UserManager.getUsername();
      isWinner = winnerName === myName;
      resultMessage = isWinner ? `승리! ${winnerName} 승!` : `패배! ${winnerName} 승!`;
    }

    // 모든 플레이어가 로비로 돌아가는 버튼 표시
    const buttonHtml = '<button class="exit-lobby-button">로비로 돌아가기</button>';

    // 결과 표시
    const resultModal = document.createElement("div");
    resultModal.className = "game-result bg-white border border-gray-200 rounded-lg shadow-lg p-6 mt-4 text-center";
    resultModal.innerHTML = `
      <h3 class="text-2xl font-bold text-primary-700 mb-4">${resultMessage}</h3>
      <p class="text-primary-600 mb-4">최종 점수: ${this.gameState?.score.left || 0} - ${
        this.gameState?.score.right || 0
      }</p>
      ${buttonHtml}
    `;

    const modalElement = document.createElement("div");
    modalElement.appendChild(resultModal);
    modalElement.className = "modal-overlay bg-black bg-opacity-50 fixed inset-0 flex items-center justify-center z-50";

    this.container.appendChild(modalElement);

    const exitLobbyButton = modalElement.querySelector(".exit-lobby-button");
    exitLobbyButton?.addEventListener("click", () => {
      this.container.removeChild(modalElement);
      this.exitToLobby(); // 로비로 나가기
    });
  }

  private exitToLobby() {
    const lobbyId = sessionStorage.getItem("lastLobbyId");
    console.log("🔍 로비로 돌아가기 - lastLobbyId:", lobbyId);
    
    if (lobbyId && lobbyId !== "null") {
      console.log("✅ 저장된 로비 ID로 이동:", lobbyId);
      // 사용된 후 세션에서 제거
      setTimeout(() => {
        sessionStorage.removeItem("lastLobbyId");
      }, 5000);
      window.router.navigate(`/lobby/${lobbyId}`);
    } else {
      console.warn("⚠️ lastLobbyId가 없습니다. 홈으로 이동합니다.");
      // 저장된 로비 ID가 없으면 홈으로 이동
      window.router.navigate(`/`);
    }
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
    this.ctx.arc(ball.x, ball.y, ball.radius * 2, 0, Math.PI * 2);
    this.ctx.fillStyle = "#1f2937";
    this.ctx.fill();

    // 공에 글래스 하이라이트 효과
    this.ctx.beginPath();
    this.ctx.arc(ball.x - ball.radius / 3, ball.y - ball.radius / 3, ball.radius / 3, 0, Math.PI * 2);
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
