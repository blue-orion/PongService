import { AuthManager } from "../../../utils/auth";
import { UserManager } from "../../../utils/user";
import { ChatMessage, TypingUser, ChatError, UserConnectionEvent, ChatSocketEventHandlers } from "../../../types/lobby";

const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_BASE_URL;

export class LobbyChatService {
  private lobbyId: string;
  private socket: any = null;
  private handlers: ChatSocketEventHandlers | null = null;
  private typingTimeout: number | null = null;

  constructor(lobbyId: string) {
    this.lobbyId = lobbyId;
  }

  // WebSocket 관련 메서드들 (LobbyDetailService와 동일한 구조)
  async initWebSocket(handlers: ChatSocketEventHandlers): Promise<void> {
    this.handlers = handlers;

    try {
      const userId = Number(UserManager.getUserId());
      if (!userId) {
        console.warn("채팅 WebSocket 연결 실패: 사용자 ID가 없습니다.");
        return;
      }

      // Socket.IO가 로드되었는지 확인
      if (typeof (window as any).io === "undefined") {
        console.error("Socket.IO 라이브러리가 로드되지 않았습니다.");
        await this.loadSocketIO();
      }

      this.connectWebSocket(userId);
    } catch (error) {
      console.error("채팅 WebSocket 초기화 실패:", error);
    }
  }

  private loadSocketIO(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof (window as any).io !== "undefined") {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = `${SOCKET_BASE_URL}/socket.io/socket.io.js`;
      script.onload = () => {
        console.log("Socket.IO 라이브러리 로드 완료");
        resolve();
      };
      script.onerror = () => {
        console.error("Socket.IO 라이브러리 로드 실패");
        reject(new Error("Socket.IO 라이브러리 로드 실패"));
      };
      document.head.appendChild(script);
    });
  }

  private connectWebSocket(userId: number): void {
    try {
      console.log("💬 채팅 WebSocket 연결 시도:", { userId, lobbyId: this.lobbyId });

      // 채팅 전용 네임스페이스로 연결
      const socket = (window as any).io(`${SOCKET_BASE_URL}/ws/lobby`, {
        query: {
          "user-id": userId,
          "lobby-id": this.lobbyId,
        },
        transports: ["websocket", "polling"],
      });

      if (socket) {
        this.socket = socket;
        this.setupChatEventListeners();
      }
    } catch (error) {
      console.error("💥 채팅 WebSocket 연결 실패:", error);
    }
  }

  private setupChatEventListeners(): void {
    if (!this.socket || !this.handlers) return;

    // 채팅 메시지 수신
    this.socket.on("chat:message", (data: ChatMessage) => {
      console.log("💬 채팅 메시지 수신:", data);
      this.handlers!.onChatMessage(data);
    });

    // 사용자 연결/해제 이벤트
    this.socket.on("user:connected", (data: UserConnectionEvent) => {
      console.log("👋 사용자 입장:", data);
      this.handlers!.onUserConnected(data);
    });

    this.socket.on("user:disconnected", (data: UserConnectionEvent) => {
      console.log("👋 사용자 퇴장:", data);
      this.handlers!.onUserDisconnected(data);
    });

    // 타이핑 이벤트
    this.socket.on("chat:typing", (data: TypingUser) => {
      console.log("⌨️ 타이핑 시작:", data);
      this.handlers!.onTyping(data);
    });

    this.socket.on("chat:stop-typing", (data: TypingUser) => {
      console.log("⌨️ 타이핑 중지:", data);
      this.handlers!.onStopTyping(data);
    });

    // 에러 이벤트
    this.socket.on("chat:error", (data: ChatError) => {
      console.error("💥 채팅 에러:", data);
      this.handlers!.onError(data.error || "채팅 오류가 발생했습니다.");
    });

    // 연결 상태 관리
    this.socket.on("connect", () => {
      console.log("✅ 채팅 WebSocket 연결 성공");
      this.handlers!.onConnectionStatusChange(true, this.socket.io.engine.transport.name);

      // 로비 방에 입장
      this.socket.emit("join-lobby", {
        lobby_id: this.lobbyId,
      });
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log("❌ 채팅 WebSocket 연결 해제:", reason);
      this.handlers!.onConnectionStatusChange(false);
    });

    this.socket.on("connect_error", (error: any) => {
      console.error("💥 채팅 WebSocket 연결 오류:", error);
      this.handlers!.onError("채팅 서버와의 연결이 끊어졌습니다.");

      setTimeout(() => {
        console.log("🔄 채팅 WebSocket 재연결 시도...");
        this.socket.connect();
      }, 3000);
    });

    console.log("💬 채팅 WebSocket 초기화 완료 - 이벤트 리스너 등록됨");
  }

  // 채팅 관련 메서드들
  sendMessage(message: string): void {
    if (!this.socket || !this.socket.connected) {
      this.handlers?.onError("채팅을 보낼 수 없습니다. 연결을 확인해주세요.");
      return;
    }

    if (!message || message.trim().length === 0) {
      this.handlers?.onError("빈 메시지는 보낼 수 없습니다.");
      return;
    }

    if (message.length > 500) {
      this.handlers?.onError("메시지가 너무 깁니다. (최대 500자)");
      return;
    }

    const username = UserManager.getUsername() || `User${UserManager.getUserId()}`;

    console.log("📤 채팅 메시지 전송:", { lobby_id: this.lobbyId, message: message.trim(), username });

    this.socket.emit("chat:message", {
      lobby_id: this.lobbyId,
      message: message.trim(),
      username: username,
    });
  }

  sendTyping(): void {
    if (!this.socket || !this.socket.connected) return;

    const username = UserManager.getUsername() || `User${UserManager.getUserId()}`;

    this.socket.emit("chat:typing", {
      lobby_id: this.lobbyId,
      username: username,
    });

    // 타이핑 상태를 3초 후 자동으로 중지
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.sendStopTyping();
    }, 3000);
  }

  sendStopTyping(): void {
    if (!this.socket || !this.socket.connected) return;

    const username = UserManager.getUsername() || `User${UserManager.getUserId()}`;

    this.socket.emit("chat:stop-typing", {
      lobby_id: this.lobbyId,
      username: username,
    });

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  joinLobby(lobbyId: string): void {
    if (!this.socket || !this.socket.connected) return;

    if (this.lobbyId !== lobbyId) {
      // 기존 로비에서 나가기
      this.leaveLobby();
      this.lobbyId = lobbyId;
    }

    console.log("🚪 채팅 로비 입장:", lobbyId);
    this.socket.emit("join-lobby", { lobby_id: lobbyId });
  }

  leaveLobby(): void {
    if (!this.socket || !this.socket.connected) return;

    console.log("🚪 채팅 로비 퇴장:", this.lobbyId);
    this.socket.emit("leave-lobby", { lobby_id: this.lobbyId });
  }

  // 상태 확인 메서드들 (LobbyDetailService와 동일)
  getSocketInfo(): any {
    if (!this.socket) return null;

    return {
      "연결 상태": this.socket.connected,
      "소켓 ID": this.socket.id,
      네임스페이스: this.socket.nsp.name,
      "전송 방식": this.socket.io.engine?.transport?.name,
      "등록된 이벤트": Object.keys(this.socket._callbacks || {}),
      "쿼리 파라미터": this.socket.io.opts.query,
      "현재 로비": this.lobbyId,
    };
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  disconnect(): void {
    // 타이핑 타이머 정리
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    // 로비에서 나가기
    this.leaveLobby();

    // 소켓 연결 해제
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("💬 채팅 WebSocket 연결 해제됨");
    }
  }

  getCurrentLobbyId(): string {
    return this.lobbyId;
  }
}
