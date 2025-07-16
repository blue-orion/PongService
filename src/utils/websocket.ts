import { io } from "socket.io-client";
import { GameMessage, GameState, ConnectionStatus } from "../types/game";

// Socket.IO 소켓 타입 정의
type SocketIOSocket = ReturnType<typeof io>;

export class WebSocketManager {
  private socket: SocketIOSocket | null = null;
  private connectionStatus: ConnectionStatus = "disconnected";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private onConnectionChange?: (status: ConnectionStatus) => void;
  private onGameStateUpdate?: (state: GameState) => void;
  private onError?: (error: string) => void;

  constructor(
    private serverUrl: string = "http://localhost:3003/ws/game",
    private options = {
      withCredentials: true,
      transports: ["websocket", "polling"] as ["websocket", "polling"],
    }
  ) {}

  connect(): void {
    if (this.socket?.connected) {
      console.log("이미 연결되어 있습니다.");
      return;
    }

    this.updateConnectionStatus("connecting");
    this.socket = io(this.serverUrl, this.options);

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.updateConnectionStatus("disconnected");
  }

  sendMessage(message: GameMessage): void {
    if (this.socket?.connected) {
      this.socket.emit("message", message);
    } else {
      console.warn("소켓이 연결되지 않았습니다.");
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("게임 서버에 연결됨:", this.socket?.id);
      this.updateConnectionStatus("connected");
      this.reconnectAttempts = 0;

      this.sendMessage({
        type: "new",
        msg: "Hi Server!",
        playerId: this.socket?.id,
      });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("서버 연결 해제:", reason);
      this.updateConnectionStatus("disconnected");

      if (reason === "io server disconnect") {
        this.attemptReconnect();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("연결 오류:", error);
      this.onError?.(`연결 오류: ${error.message}`);
      this.attemptReconnect();
    });

    this.socket.on("state", (gameState: GameState) => {
      this.onGameStateUpdate?.(gameState);
    });

    this.socket.on("error", (error) => {
      console.error("소켓 오류:", error);
      this.onError?.(`소켓 오류: ${error}`);
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("최대 재연결 시도 횟수를 초과했습니다.");
      this.onError?.("연결에 실패했습니다. 페이지를 새로고침해주세요.");
      return;
    }

    this.reconnectAttempts++;
    this.updateConnectionStatus("reconnecting");

    setTimeout(() => {
      console.log(`재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private updateConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.onConnectionChange?.(status);
  }

  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.onConnectionChange = callback;
  }

  onGameState(callback: (state: GameState) => void): void {
    this.onGameStateUpdate = callback;
  }

  onErrorOccurred(callback: (error: string) => void): void {
    this.onError = callback;
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get status(): ConnectionStatus {
    return this.connectionStatus;
  }

  get playerId(): string | undefined {
    return this.socket?.id;
  }
}
