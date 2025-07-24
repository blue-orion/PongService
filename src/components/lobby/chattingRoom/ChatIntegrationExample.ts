import { LobbyChatComponent } from "../chattingRoom/LobbyChatComponent";

// LobbyDetailComponent에 추가할 채팅 통합 코드 예시
export class LobbyDetailComponentWithChat {
  private chatComponent: LobbyChatComponent | null = null;

  // 기존 LobbyDetailComponent 초기화 시 호출
  private initializeChat(lobbyId: string): void {
    const chatContainer = document.querySelector("#chat-container");

    if (chatContainer) {
      this.chatComponent = new LobbyChatComponent(chatContainer as HTMLElement, lobbyId);
      console.log("💬 채팅 컴포넌트 초기화 완료");
    }
  }

  // 로비 나갈 때 호출
  private destroyChat(): void {
    if (this.chatComponent) {
      this.chatComponent.destroy();
      this.chatComponent = null;
      console.log("💬 채팅 컴포넌트 정리 완료");
    }
  }

  // 채팅 연결 상태 확인
  private getChatConnectionInfo(): any {
    return this.chatComponent?.getConnectionInfo() || null;
  }

  // HTML 템플릿에 추가할 채팅 영역
  private getChatTemplate(): string {
    return `
      <!-- 채팅 영역 (기존 로비 상세 페이지에 추가) -->
      <div class="chat-section mt-6">
        <div id="chat-container" class="h-96">
          <!-- LobbyChatComponent가 여기에 렌더링됩니다 -->
        </div>
      </div>
    `;
  }
}
