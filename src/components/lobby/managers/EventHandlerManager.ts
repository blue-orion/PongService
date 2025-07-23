import { UIEventHandlers } from "../../../types/lobby";

export class EventHandlerManager {
  private container: HTMLElement;
  private handlers: UIEventHandlers | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  setHandlers(handlers: UIEventHandlers): void {
    this.handlers = handlers;
  }

  setupAllEventListeners(): void {
    if (!this.handlers) return;

    this.setupNavigationEvents();
    this.setupLobbyActionEvents();
    this.setupMatchEvents();
    this.setupPlayerEvents();
  }

  private setupNavigationEvents(): void {
    if (!this.handlers) return;

    // 뒤로가기 버튼
    this.addEventListenerSafely(".back-btn", "click", this.handlers.onBackToList);
    this.addEventListenerSafely(".back-to-list-btn", "click", this.handlers.onBackToList);
  }

  private setupLobbyActionEvents(): void {
    if (!this.handlers) return;

    // 준비 버튼
    this.addEventListenerSafely("#ready-btn", "click", this.handlers.onToggleReady);

    // 게임 시작 버튼
    this.addEventListenerSafely("#start-game-btn", "click", this.handlers.onStartGame);

    // 새로고침 버튼
    this.addEventListenerSafely("#refresh-btn", "click", this.handlers.onRefresh);

    // 로비 나가기 버튼
    this.addEventListenerSafely(".leave-lobby-btn", "click", this.handlers.onLeaveLobby);

    // 소켓 디버깅 버튼
    this.addEventListenerSafely(".debug-socket-btn", "click", this.handlers.onDebugSocket);
  }

  private setupMatchEvents(): void {
    if (!this.handlers) return;

    // 매칭 생성 버튼
    this.addEventListenerSafely("#create-match-btn", "click", this.handlers.onCreateMatch);

    // 매칭 정보 확인 버튼
    this.addEventListenerSafely("#view-match-btn", "click", this.handlers.onViewMatchInfo);

    // 게임 참여 버튼
    this.addEventListenerSafely(".play-game-btn", "click", this.handlers.onPlayGame);
  }

  private setupPlayerEvents(): void {
    // 방장 위임 버튼들은 동적으로 생성되므로 별도 메서드로 처리
    this.setupTransferLeadershipButtons();
  }

  setupTransferLeadershipButtons(): void {
    if (!this.handlers) return;

    const transferButtons = this.container.querySelectorAll(".transfer-leadership-btn");
    transferButtons.forEach((button) => {
      // 기존 이벤트 리스너 제거 (중복 방지)
      const newButton = button.cloneNode(true) as HTMLElement;
      button.parentNode?.replaceChild(newButton, button);

      // 새 이벤트 리스너 추가
      newButton.addEventListener("click", (e) => {
        const targetUserId = (e.target as HTMLElement).getAttribute("data-user-id");
        const targetUsername = (e.target as HTMLElement).getAttribute("data-username");
        if (targetUserId && this.handlers) {
          this.handlers.onTransferLeadership(parseInt(targetUserId), targetUsername || "");
        }
      });
    });
  }

  private addEventListenerSafely(selector: string, event: string, handler: () => void): void {
    const element = this.container.querySelector(selector);
    if (element) {
      // 기존 이벤트 리스너 제거
      element.removeEventListener(event, handler);
      // 새 이벤트 리스너 추가
      element.addEventListener(event, handler);
    }
  }

  // 특정 이벤트 리스너만 다시 설정하는 메서드들
  setupViewMatchButtonListener(): void {
    if (!this.handlers) return;
    this.addEventListenerSafely("#view-match-btn", "click", this.handlers.onViewMatchInfo);
  }

  setupReadyButtonListener(): void {
    if (!this.handlers) return;
    this.addEventListenerSafely("#ready-btn", "click", this.handlers.onToggleReady);
  }

  setupCreateMatchButtonListener(): void {
    if (!this.handlers) return;
    this.addEventListenerSafely("#create-match-btn", "click", this.handlers.onCreateMatch);
  }

  removeAllEventListeners(): void {
    // 컨테이너의 innerHTML을 변경하면 자동으로 이벤트 리스너가 제거됨
    // 명시적으로 정리가 필요한 경우를 위한 메서드
  }
}

export class ModalEventManager {
  static setupMatchResultModalListeners(modalElement: HTMLElement, matchData: any, routeStartGame: () => void): void {
    // 모달 닫기 버튼들
    const closeButtons = modalElement.querySelectorAll(".close-modal-btn");
    closeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        document.body.removeChild(modalElement);
      });
    });

    // 게임 시작 버튼
    // const startMatchBtn = modalElement.querySelector(".start-match-btn");
    // if (startMatchBtn) {
    //   startMatchBtn.addEventListener("click", () => {
    //     document.body.removeChild(modalElement);
    //     routeStartGame();
    //   });
    // }

    // 모달 외부 클릭 시 닫기
    modalElement.addEventListener("click", (e) => {
      if (e.target === modalElement) {
        document.body.removeChild(modalElement);
      }
    });
  }
}
