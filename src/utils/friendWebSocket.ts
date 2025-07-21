import { io } from "socket.io-client";
import { AuthManager } from "./auth";

// Socket.IO 소켓 타입 정의
type SocketIOSocket = ReturnType<typeof io>;

interface FriendNotification {
  type: "request" | "accepted" | "rejected" | "cancelled";
  payload: {
    relationId?: string;
    message: string;
    userId?: string;
  };
}

export class FriendWebSocketManager {
  private socket: SocketIOSocket | null = null;
  private connectionStatus: "connected" | "disconnected" | "connecting" | "reconnecting" = "disconnected";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private onFriendNotification?: (notification: FriendNotification) => void;
  private onConnectionChange?: (status: string) => void;
  private onError?: (error: string) => void;

  constructor(
    private serverUrl: string = "http://localhost:3333",
    private options = {
      withCredentials: true,
      transports: ["websocket", "polling"] as ["websocket", "polling"],
    }
  ) {}

  connect(): void {
    if (this.socket?.connected) {
      console.log("친구 웹소켓이 이미 연결되어 있습니다.");
      return;
    }

    const tokens = AuthManager.getTokens();
    if (!tokens || !tokens.accessToken) {
      console.warn("인증 토큰이 없습니다. 친구 웹소켓 연결을 건너뜁니다.");
      return;
    }

    // 토큰 유효성 검사
    if (!AuthManager.isTokenValid()) {
      console.warn("토큰이 만료되었습니다. 친구 웹소켓 연결을 건너뜁니다.");
      return;
    }

    this.updateConnectionStatus("connecting");

    const userId = this.getUserIdFromToken(tokens.accessToken);
    console.log("친구 웹소켓 연결 시도:", {
      serverUrl: this.serverUrl,
      namespace: "/ws/friend",
      userId: userId,
      tokenPrefix: tokens.accessToken.substring(0, 20) + "...",
    });

    // Socket.IO 네임스페이스에 올바르게 연결
    this.socket = io(this.serverUrl + "/ws/friend", {
      ...this.options,
      auth: {
        userId: userId,
        token: tokens.accessToken,
      },
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.updateConnectionStatus("disconnected");
  }

  private getUserIdFromToken(token: string): string | null {
    try {
      // JWT 토큰에서 userId 추출
      const payload = JSON.parse(atob(token.split(".")[1]));
      // 백엔드에서 사용하는 필드명에 맞게 userId 추출
      return payload.userId || payload.id || payload.sub || payload.username;
    } catch (error) {
      console.error("토큰에서 userId 추출 실패:", error);
      return null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("친구 서버에 연결됨:", this.socket?.id);
      console.log("연결된 URL:", this.serverUrl);
      this.updateConnectionStatus("connected");
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("친구 서버 연결 해제:", reason);
      this.updateConnectionStatus("disconnected");

      if (reason === "io server disconnect") {
        this.attemptReconnect();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("친구 웹소켓 연결 오류:", error);
      console.error("오류 상세:", {
        message: error.message,
        stack: error.stack,
      });
      this.onError?.(`친구 연결 오류: ${error.message}`);
      this.attemptReconnect();
    });

    // 친구 관련 이벤트 리스너 - 백엔드에서 "friend_request" 이벤트로 모든 타입의 알림을 전송
    this.socket.on("friend_request", (notification: FriendNotification) => {
      console.log("친구 알림 수신:", notification);

      // 타입별로 다른 처리
      switch (notification.type) {
        case "request":
          console.log("새 친구 요청:", notification.payload.message);
          break;
        case "accepted":
          console.log("친구 요청 수락됨:", notification.payload.message);
          break;
        case "rejected":
          console.log("친구 요청 거절됨:", notification.payload.message);
          break;
        case "cancelled":
          console.log("친구 요청 취소됨:", notification.payload.message);
          break;
        default:
          console.log("알 수 없는 친구 알림 타입:", notification.type);
      }

      // 콜백으로 알림 전달
      this.onFriendNotification?.(notification);
    });

    this.socket.on("error", (error) => {
      console.error("친구 소켓 오류:", error);
      this.onError?.(`친구 소켓 오류: ${error}`);
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("친구 웹소켓 최대 재연결 시도 횟수를 초과했습니다.");
      this.onError?.("친구 연결에 실패했습니다.");
      return;
    }

    this.reconnectAttempts++;
    this.updateConnectionStatus("reconnecting");

    setTimeout(() => {
      console.log(`친구 웹소켓 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private updateConnectionStatus(status: typeof this.connectionStatus): void {
    this.connectionStatus = status;
    this.onConnectionChange?.(status);
  }

  // 콜백 등록 메서드들
  onConnectionStatusChange(callback: (status: string) => void): void {
    this.onConnectionChange = callback;
  }

  onFriendNotificationReceived(callback: (notification: FriendNotification) => void): void {
    this.onFriendNotification = callback;
  }

  onErrorOccurred(callback: (error: string) => void): void {
    this.onError = callback;
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get status(): string {
    return this.connectionStatus;
  }

  get userId(): string | null {
    const tokens = AuthManager.getTokens();
    if (!tokens?.accessToken) return null;
    return this.getUserIdFromToken(tokens.accessToken);
  }
}

// 싱글톤 인스턴스
export const friendWebSocketManager = new FriendWebSocketManager();
