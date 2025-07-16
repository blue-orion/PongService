import { WebSocketManager } from "./utils/websocket.js";
import { GameState, KeyboardControls, ConnectionStatus, Player, Ball } from "./types/game.js";

export class PongGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private wsManager: WebSocketManager;
  private gameState: GameState | null = null;
  private keyboardControls: KeyboardControls = { up: false, down: false };
  private lastUpdateTime = 0;
  private animationId: number | null = null;

  // UI 요소들
  private statusElement: HTMLElement;
  private connectionStatusElement: HTMLElement;

  constructor() {
    this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;
    this.statusElement = document.getElementById("gameStatus")!;
    this.connectionStatusElement = document.getElementById("connectionStatus")!;

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
    document.addEventListener("keydown", (event: KeyboardEvent) => {
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
    });

    document.addEventListener("keyup", (event: KeyboardEvent) => {
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
    });
  }

  private setupUI(): void {
    // 재연결 버튼 추가
    const reconnectBtn = document.createElement("button");
    reconnectBtn.textContent = "재연결";
    reconnectBtn.className = "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors";
    reconnectBtn.onclick = () => this.wsManager.connect();

    this.statusElement.appendChild(reconnectBtn);
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
    const statusText = `플레이어: ${playerCount}명 | 게임 상태: ${state.gameStatus}`;

    // 점수 표시
    if (playerCount > 0) {
      const scores = Object.entries(state.players)
        .map(([id, player]) => `${id.substring(0, 8)}: ${player.score}`)
        .join(" | ");
      this.statusElement.querySelector(".scores")?.remove();

      const scoresDiv = document.createElement("div");
      scoresDiv.className = "scores mt-2 text-sm";
      scoresDiv.textContent = scores;
      this.statusElement.appendChild(scoresDiv);
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

      this.render();
      this.animationId = requestAnimationFrame(gameLoop);
    };

    this.animationId = requestAnimationFrame(gameLoop);
  }

  private render(): void {
    // 캔버스 클리어
    this.ctx.fillStyle = "#1a1a2e";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.gameState) {
      this.renderWaitingScreen();
      return;
    }

    this.renderGame();
  }

  private renderWaitingScreen(): void {
    this.ctx.fillStyle = "#e94560";
    this.ctx.font = '24px "Noto Sans KR"';
    this.ctx.textAlign = "center";
    this.ctx.fillText("게임 서버에 연결 중...", this.canvas.width / 2, this.canvas.height / 2);
  }

  private renderGame(): void {
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

  // 정리 메서드
  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.wsManager.disconnect();
  }
}

// 페이지 로드 시 게임 초기화
document.addEventListener("DOMContentLoaded", () => {
  new PongGame();
});
