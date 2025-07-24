import { LobbyChatService } from "./LobbyChatService";
import { ChatMessage, TypingUser, UserConnectionEvent } from "../../../types/lobby";

export class LobbyChatComponent {
  private container: HTMLElement;
  private chatService: LobbyChatService;
  private messages: ChatMessage[] = [];
  private typingUsers: Map<string, TypingUser> = new Map();
  private isVisible: boolean = false;

  constructor(container: HTMLElement, lobbyId: string) {
    this.container = container;
    this.chatService = new LobbyChatService(lobbyId);
    this.setupEventHandlers();
    this.render();
  }

  private setupEventHandlers(): void {
    this.chatService.initWebSocket({
      onChatMessage: (message: ChatMessage) => {
        this.addMessage(message);
      },
      onUserConnected: (event: UserConnectionEvent) => {
        this.addSystemMessage(`${event.username || `${event.username}`}님이 로비에 입장했습니다.`);
      },
      onUserDisconnected: (event: UserConnectionEvent) => {
        console.log("User disconnected:", event);
        console.log("User disconnected:", event.username);
        this.addSystemMessage(`${event.username || `${event.username}`}님이 로비에서 나갔습니다.`);
        // 타이핑 사용자 목록에서 제거
        this.typingUsers.delete(event.user_id);
        this.updateTypingIndicator();
      },
      onTyping: (user: TypingUser) => {
        this.typingUsers.set(user.user_id, user);
        this.updateTypingIndicator();
      },
      onStopTyping: (user: TypingUser) => {
        this.typingUsers.delete(user.user_id);
        this.updateTypingIndicator();
      },
      onConnectionStatusChange: (connected: boolean, transport?: string) => {
        this.updateConnectionStatus(connected, transport);
      },
      onError: (error: string) => {
        this.showError(error);
      },
    });
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="lobby-chat-box">
        <!-- 채팅 메시지 영역 -->
        <div class="chat-messages-area" id="chat-messages">
          <div class="welcome-message">
            💬 채팅을 시작해보세요!
          </div>
        </div>

        <!-- 타이핑 인디케이터 -->
        <div class="typing-status" id="typing-indicator"></div>

        <!-- 메시지 입력 영역 -->
        <div class="chat-input-area">
          <div class="input-wrapper">
            <input 
              type="text" 
              id="message-input" 
              placeholder="메시지를 입력하세요..." 
              maxlength="500"
              class="message-input"
            />
            <button 
              id="send-btn" 
              class="send-button"
              disabled
            >
              전송
            </button>
          </div>
          <div class="char-counter">
            <span id="char-count">0</span>/500
            <span class="connection-indicator" id="connection-status">연결 중...</span>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const messageInput = this.container.querySelector("#message-input") as HTMLInputElement;
    const sendBtn = this.container.querySelector("#send-btn") as HTMLButtonElement;
    const charCount = this.container.querySelector("#char-count") as HTMLElement;

    // 메시지 입력 이벤트
    messageInput?.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const length = target.value.length;

      // 글자 수 표시
      charCount.textContent = length.toString();

      // 전송 버튼 활성화/비활성화
      sendBtn.disabled = length === 0 || !this.chatService.isConnected();

      // 타이핑 알림
      if (length > 0) {
        this.chatService.sendTyping();
      } else {
        this.chatService.sendStopTyping();
      }
    });

    // 엔터 키로 전송
    messageInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !sendBtn.disabled) {
        this.sendMessage();
      }
    });

    // 전송 버튼 클릭
    sendBtn?.addEventListener("click", () => {
      this.sendMessage();
    });

    // 입력 필드에서 포커스가 벗어날 때 타이핑 중지
    messageInput?.addEventListener("blur", () => {
      this.chatService.sendStopTyping();
    });
  }

  private sendMessage(): void {
    const messageInput = this.container.querySelector("#message-input") as HTMLInputElement;
    const message = messageInput.value.trim();

    if (message) {
      this.chatService.sendMessage(message);
      messageInput.value = "";

      // UI 업데이트
      const charCount = this.container.querySelector("#char-count") as HTMLElement;
      const sendBtn = this.container.querySelector("#send-btn") as HTMLButtonElement;
      charCount.textContent = "0";
      sendBtn.disabled = true;

      // 타이핑 중지
      this.chatService.sendStopTyping();
    }
  }

  private addMessage(message: ChatMessage): void {
    this.messages.push(message);
    const messagesContainer = this.container.querySelector("#chat-messages");

    if (messagesContainer) {
      // 첫 메시지인 경우 환영 메시지 제거
      if (this.messages.length === 1) {
        messagesContainer.innerHTML = "";
      }

      const messageElement = this.createMessageElement(message);
      messagesContainer.appendChild(messageElement);

      // 스크롤을 맨 아래로
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  private addSystemMessage(message: string): void {
    const messagesContainer = this.container.querySelector("#chat-messages");

    if (messagesContainer) {
      const systemElement = document.createElement("div");
      systemElement.className = "system-message";
      systemElement.textContent = message;

      messagesContainer.appendChild(systemElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  private createMessageElement(message: ChatMessage): HTMLElement {
    const messageDiv = document.createElement("div");
    messageDiv.className = "chat-message-item";

    const timestamp = new Date(message.timestamp).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    messageDiv.innerHTML = `
      <div class="message-content">
        <div class="message-header">
          <span class="username">${this.escapeHtml(message.username)}</span>
          <span class="timestamp">${timestamp}</span>
        </div>
        <div class="message-text">${this.escapeHtml(message.message)}</div>
      </div>
    `;

    return messageDiv;
  }

  private updateTypingIndicator(): void {
    const indicator = this.container.querySelector("#typing-indicator");

    if (indicator) {
      if (this.typingUsers.size === 0) {
        indicator.textContent = "";
      } else {
        const usernames = Array.from(this.typingUsers.values()).map((user) => user.username);
        const text =
          usernames.length === 1
            ? `${usernames[0]}님이 입력 중...`
            : `${usernames.slice(0, 2).join(", ")}${
                usernames.length > 2 ? ` 외 ${usernames.length - 2}명` : ""
              }이 입력 중...`;

        indicator.innerHTML = `
          <span class="typing-text">${text}</span>
          <span class="typing-dots">...</span>
        `;
      }
    }
  }

  private updateConnectionStatus(connected: boolean, transport?: string): void {
    const statusElement = this.container.querySelector("#connection-status");
    const sendBtn = this.container.querySelector("#send-btn") as HTMLButtonElement;
    const messageInput = this.container.querySelector("#message-input") as HTMLInputElement;

    if (statusElement) {
      if (connected) {
        statusElement.textContent = "연결됨";
        statusElement.className = "connection-indicator connected";
      } else {
        statusElement.textContent = "연결 끊어짐";
        statusElement.className = "connection-indicator disconnected";
      }
    }

    // 연결 상태에 따라 입력 필드 활성화/비활성화
    if (messageInput) {
      messageInput.disabled = !connected;
      messageInput.placeholder = connected ? "메시지를 입력하세요..." : "연결이 끊어졌습니다...";
    }

    if (sendBtn) {
      sendBtn.disabled = !connected || messageInput.value.trim().length === 0;
    }
  }

  private showError(error: string): void {
    const messagesContainer = this.container.querySelector("#chat-messages");

    if (messagesContainer) {
      const errorElement = document.createElement("div");
      errorElement.className = "error-message";
      errorElement.textContent = `⚠️ ${error}`;

      messagesContainer.appendChild(errorElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // 3초 후 에러 메시지 제거
      setTimeout(() => {
        errorElement.remove();
      }, 3000);
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // 퍼블릭 메서드들
  public destroy(): void {
    this.chatService.disconnect();
  }

  public getConnectionInfo(): any {
    return this.chatService.getSocketInfo();
  }

  public isConnected(): boolean {
    return this.chatService.isConnected();
  }
}
