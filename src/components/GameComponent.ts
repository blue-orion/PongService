import { Component } from "./Component";
import { WebSocketManager } from "../utils/websocket";
import { AuthManager } from "../utils/auth";
import { GameState, KeyboardControls, ConnectionStatus, Player, Ball } from "../types/game";

export class GameComponent extends Component {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private wsManager!: WebSocketManager;
  private gameState: GameState | null = null;
  private keyboardControls: KeyboardControls = { up: false, down: false };
  private lastUpdateTime = 0;
  private animationId: number | null = null;

  // UI 요소들
  private statusElement!: HTMLElement;
  private connectionStatusElement!: HTMLElement;

  render(): void {
    this.clearContainer();

    this.container.innerHTML = `
      <div class="game-container">
        <div id="gameStatus" class="game-status">
          <div id="connectionStatus" class="connection-status status-connecting">연결 중...</div>
          <div class="mt-3 text-2xl font-bold text-primary-800">🏓 Pong Game</div>
          <div class="mt-2 text-sm text-primary-600">실시간 멀티플레이어 핑퐁 게임</div>
        </div>
        <canvas id="gameCanvas" class="game-canvas" width="800" height="600"></canvas>
        <div class="mt-6 text-center text-sm text-primary-600 glass-card p-4">
          <p class="font-medium">게임 조작법</p>
          <p class="mt-1">W/S 또는 ↑/↓ 키로 패들을 조작하세요</p>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector("#gameCanvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;
    this.statusElement = this.container.querySelector("#gameStatus")!;
    this.connectionStatusElement = this.container.querySelector("#connectionStatus")!;

    // 인증 체크 후 게임 초기화
    this.initializeWithAuth();
  }

  private async initializeWithAuth(): Promise<void> {
    try {
      // 인증 상태 확인
      const isAuthenticated = await AuthManager.checkAuthAndRedirect();
      if (!isAuthenticated) {
        // 인증 실패 시 로그인 페이지로 이동
        window.router.navigate("/login");
        return;
      }

      // 인증 성공 시 게임 초기화
      this.initializeGame();
    } catch (error) {
      console.error("인증 확인 중 오류:", error);
      this.showError("인증 확인 중 오류가 발생했습니다.");
    }
  }

  private initializeGame(): void {
    // WebSocket 매니저 초기화
    this.wsManager = new WebSocketManager();
    this.setupWebSocketEvents();
    this.setupKeyboardControls();
    this.setupUI();

    // 서버 연결
    this.wsManager.connect();

    // 게임 루프 시작
    this.startGameLoop();
  }

  private setupWebSocketEvents(): void {
    // 연결 상태 변화 감지
    this.wsManager.onConnectionStatusChange((status: ConnectionStatus) => {
      this.updateConnectionStatus(status);
    });

    // 게임 상태 업데이트
    this.wsManager.onGameState((state: GameState) => {
      this.gameState = state;
      this.updateGameStatus(state);
    });

    // 오류 처리
    this.wsManager.onErrorOccurred((error: string) => {
      this.showError(error);
    });
  }

  private setupKeyboardControls(): void {
    const keydownHandler = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          this.keyboardControls.up = true;
          this.sendPlayerMove("up");
          event.preventDefault();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          this.keyboardControls.down = true;
          this.sendPlayerMove("down");
          event.preventDefault();
          break;
      }
    };

    const keyupHandler = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          this.keyboardControls.up = false;
          event.preventDefault();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          this.keyboardControls.down = false;
          event.preventDefault();
          break;
      }
    };

    document.addEventListener("keydown", keydownHandler);
    document.addEventListener("keyup", keyupHandler);

    // 컴포넌트 정리 시 이벤트 리스너도 제거하기 위해 저장
    this.container.dataset.keydownHandler = keydownHandler.toString();
    this.container.dataset.keyupHandler = keyupHandler.toString();
  }

  private setupUI(): void {
    // 컨트롤 버튼들 컨테이너
    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "flex gap-3 mt-4";

    // 재연결 버튼
    const reconnectBtn = document.createElement("button");
    reconnectBtn.textContent = "재연결";
    reconnectBtn.className = "btn-primary";
    reconnectBtn.onclick = () => this.wsManager.connect();

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
    if (this.wsManager.isConnected) {
      this.wsManager.sendMessage({
        type: "move",
        playerId: this.wsManager.playerId,
        direction,
      });
    }
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
    const playerCount = Object.keys(state.players).length;

    // 점수 표시
    if (playerCount > 0) {
      const scores = Object.entries(state.players)
        .map(([id, player]) => `${id.substring(0, 8)}: ${player.score}`)
        .join(" | ");

      let scoresDiv = this.statusElement.querySelector(".scores") as HTMLElement;
      if (!scoresDiv) {
        scoresDiv = document.createElement("div");
        scoresDiv.className = "scores mt-2 text-sm";
        this.statusElement.appendChild(scoresDiv);
      }
      scoresDiv.textContent = scores;
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
    // 캔버스 클리어
    this.ctx.fillStyle = "#1a1a2e";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.gameState) {
      this.renderWaitingScreen();
      return;
    }

    this.renderGameObjects();
  }
  private renderGameObjects(): void {
    if (!this.gameState) return;

    // 플레이어 렌더링
    this.ctx.fillStyle = "#e94560";
    Object.values(this.gameState.players).forEach((player) => {
      this.ctx.fillRect(player.x, player.y, 10, 80); // 기본 패들 크기
    });

    // 공 렌더링
    const ball = this.gameState.ball;
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fill();

    // 중앙선 렌더링
    this.ctx.strokeStyle = "#0f3460";
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private renderWaitingScreen(): void {
    this.ctx.fillStyle = "#e94560";
    this.ctx.font = '24px "Noto Sans KR"';
    this.ctx.textAlign = "center";
    this.ctx.fillText("게임 서버에 연결 중...", this.canvas.width / 2, this.canvas.height / 2);
  }

  destroy(): void {
    // 애니메이션 정리
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // WebSocket 연결 정리
    if (this.wsManager) {
      this.wsManager.disconnect();
    }

    // 키보드 이벤트 리스너 정리
    // TODO: 실제로는 저장된 핸들러를 제거해야 하지만 간단히 처리
    // 실제 프로덕션에서는 더 정교한 이벤트 관리가 필요
  }
}
