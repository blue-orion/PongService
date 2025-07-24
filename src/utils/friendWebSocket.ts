import { io } from "socket.io-client";
import { AuthManager } from "./auth";
import { UserManager } from "./user";

// Socket.IO 소켓 타입 정의
type SocketIOSocket = ReturnType<typeof io>;

interface FriendNotification {
  type: "request" | "accepted" | "rejected" | "cancelled" | "status_update" | "user_status";
  payload: {
    relationId?: string;
    message?: string;
    userId?: string;
    status?: string;
    [key: string]: any;
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
    private serverUrl: string = import.meta.env.VITE_API_BASE_URL?.replace("/v1", "") || "http://localhost:3333",
    private options = {
      withCredentials: true,
      transports: ["websocket", "polling"] as ["websocket", "polling"],
    }
  ) {}

  connect(): void {
    // 이미 연결되어 있거나 연결 중인 경우 중복 연결 방지
    if (this.socket?.connected || this.connectionStatus === "connecting") {
      return;
    }

    const tokens = AuthManager.getTokens();
    if (!tokens || !tokens.accessToken) {
      console.warn("인증 토큰이 없습니다. 친구 웹소켓 연결을 건너뜁니다.");
      return;
    }

    if (!AuthManager.isTokenValid()) {
      console.warn("토큰이 만료되었습니다. 친구 웹소켓 연결을 건너뜁니다.");
      return;
    }

    // 기존 소켓이 있다면 완전히 정리
    if (this.socket && !this.socket.connected) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.updateConnectionStatus("connecting");

    const userId = this.getUserIdFromToken(tokens.accessToken);

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
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0; // 재연결 시도 횟수 초기화
    this.updateConnectionStatus("disconnected");
  }

  private getUserIdFromToken(token: string): number | null {
    // UserManager에서 저장된 사용자 ID 사용
    return UserManager.getUserId();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.updateConnectionStatus("connected");
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      this.updateConnectionStatus("disconnected");

      // 서버에서 강제로 연결을 끊은 경우에만 재연결 시도
      // 클라이언트에서 의도적으로 disconnect()를 호출한 경우는 재연결하지 않음
      if (reason === "io server disconnect" || reason === "transport close") {
        // 약간의 지연 후 재연결 시도 (즉시 재연결 방지)
        setTimeout(() => {
          this.attemptReconnect();
        }, 1000);
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("친구 웹소켓 연결 오류:", error.message);
      this.onError?.(`친구 연결 오류: ${error.message}`);

      // 인증 오류인 경우 재연결 시도하지 않음
      if (error.message?.includes("authentication") || error.message?.includes("401")) {
        console.warn("인증 오류로 인한 연결 실패. 재연결을 시도하지 않습니다.");
        return;
      }

      // 다른 오류의 경우에만 재연결 시도
      setTimeout(() => {
        this.attemptReconnect();
      }, 2000);
    });

    // 친구 관련 이벤트 리스너 - 백엔드에서 "friend_request" 이벤트로 모든 타입의 알림을 전송
    this.socket.on("friend_request", (notification: FriendNotification) => {
      // 콜백으로 알림 전달
      this.onFriendNotification?.(notification);
    });

    // 사용자 상태 업데이트 이벤트 리스너 추가
    this.socket.on("user_status", (notification: FriendNotification) => {
      // 콜백으로 알림 전달
      this.onFriendNotification?.(notification);
    });

    this.socket.on("error", (error) => {
      console.error("친구 소켓 오류:", error);
      this.onError?.(`친구 소켓 오류: ${error}`);
    });
  }

  private attemptReconnect(): void {
    // 이미 연결되어 있거나 최대 재연결 시도 횟수를 초과한 경우 중단
    if (this.socket?.connected || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.onError?.("친구 연결에 실패했습니다.");
      }
      return;
    }

    this.reconnectAttempts++;
    this.updateConnectionStatus("reconnecting");

    setTimeout(() => {
      // 재연결 시도 전에 상태 재확인
      if (!this.socket?.connected && this.connectionStatus !== "connected") {
        this.connect();
      }
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

  get userId(): number | null {
    const tokens = AuthManager.getTokens();
    if (!tokens?.accessToken) return null;
    return this.getUserIdFromToken(tokens.accessToken);
  }
}

// 싱글톤 인스턴스
export const friendWebSocketManager = new FriendWebSocketManager();
