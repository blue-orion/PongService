import { friendService } from "../../utils/friendService";
import { friendWebSocketManager } from "../../utils/friendWebSocket";
import { getFriendComponentTemplate } from "./FriendTemplate";
import { UserProfileManager } from "./UserProfileManager";
import { FriendDataManager } from "./FriendDataManager";
import { FriendUIRenderer } from "./FriendUIRenderer";
import { FriendEventHandler } from "./FriendEventHandler";

export class FriendComponent {
  private container: HTMLElement;
  private userProfileManager!: UserProfileManager;
  private dataManager!: FriendDataManager;
  private uiRenderer!: FriendUIRenderer;
  private eventHandler!: FriendEventHandler;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeComponents();
    this.initialize();
  }

  private showErrorModal(title: string, message: string): void {
    // 기존 에러 모달이 있다면 제거
    const existingModal = document.querySelector(".friend-error-modal-overlay");
    if (existingModal) {
      existingModal.remove();
    }

    // 에러 모달 HTML 생성
    const modalHTML = `
      <div class="friend-error-modal-overlay show">
        <div class="friend-error-modal">
          <div class="friend-error-modal-header">
            <div class="friend-error-modal-title">
              <span>⚠️</span>
              <span>${title}</span>
            </div>
          </div>
          <div class="friend-error-modal-content">
            <div class="friend-error-modal-message">${message}</div>
          </div>
          <div class="friend-error-modal-footer">
            <button class="friend-error-modal-button" onclick="this.closest('.friend-error-modal-overlay').remove()">
              확인
            </button>
          </div>
        </div>
      </div>
    `;

    // body에 모달 추가
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // 5초 후 자동으로 모달 제거
    setTimeout(() => {
      const modal = document.querySelector(".friend-error-modal-overlay");
      if (modal) {
        modal.remove();
      }
    }, 5000);
  }

  private initializeComponents(): void {
    this.userProfileManager = new UserProfileManager(this.container);
    this.dataManager = new FriendDataManager(this.userProfileManager);
    this.uiRenderer = new FriendUIRenderer(this.container);
    this.eventHandler = new FriendEventHandler(
      this.dataManager,
      this.userProfileManager,
      () => this.renderFriendItems(),
      (message: string) => this.showNotification(message)
    );
  }

  private async initialize(): Promise<void> {
    this.render();
    this.setupEventListeners();
    this.setupWebSocket();

    await this.userProfileManager.setupUserProfile();
    await this.loadFriendsData();
  }

  public render(): void {
    this.container.innerHTML = getFriendComponentTemplate();
  }

  private setupWebSocket(): void {
    // WebSocket 연결은 app.ts에서 관리하므로 여기서는 이벤트 리스너만 등록
    friendWebSocketManager.onFriendNotificationReceived(this.handleWebSocketMessage.bind(this));
  }

  private handleWebSocketMessage(data: any): void {
    this.eventHandler.handleFriendNotification(data);
  }

  private showNotification(message: string): void {
    // 알림 권한 없이도 사용자가 볼 수 있도록 팝업으로 표시
    this.showInfoModal("알림", message);
  }

  private showInfoModal(title: string, message: string): void {
    // 기존 모달이 있다면 제거
    const existingModal = document.querySelector(".friend-info-modal-overlay");
    if (existingModal) {
      existingModal.remove();
    }

    // 정보 모달 HTML 생성
    const modalHTML = `
      <div class="friend-info-modal-overlay show">
        <div class="friend-info-modal">
          <div class="friend-info-modal-header">
            <div class="friend-info-modal-title">
              <span>💬</span>
              <span>${title}</span>
            </div>
          </div>
          <div class="friend-info-modal-content">
            <div class="friend-info-modal-message">${message}</div>
          </div>
          <div class="friend-info-modal-footer">
            <button class="friend-info-modal-button" onclick="this.closest('.friend-info-modal-overlay').remove()">
              확인
            </button>
          </div>
        </div>
      </div>
    `;

    // body에 모달 추가
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // 3초 후 자동으로 모달 제거
    setTimeout(() => {
      const modal = document.querySelector(".friend-info-modal-overlay");
      if (modal) {
        modal.remove();
      }
    }, 3000);
  }

  private async loadFriendsData(): Promise<void> {
    try {
      await this.dataManager.loadAllData();
      this.renderFriendItems();
    } catch (error) {
      console.error("친구 데이터 로드 실패:", error);
      this.renderFriendItems();
    }
  }

  private setupEventListeners(): void {
    // DOM이 완전히 렌더링될 때까지 약간 대기
    setTimeout(() => {
      this.setupMobileToggleListeners();
      this.setupDropdownToggleListeners();
      this.setupFriendActionListeners();
      this.setupDocumentClickListener();
    }, 100);
  }

  private setupMobileToggleListeners(): void {
    // container 안에서 찾기
    const toggleButtonInContainer = this.container.querySelector("#mobile-friend-toggle");
    const closeButtonInContainer = this.container.querySelector("#friend-close-btn");
    const overlayInContainer = this.container.querySelector("#friend-overlay");

    // document 전체에서 찾기
    const toggleButtonInDocument = document.querySelector("#mobile-friend-toggle");
    const closeButtonInDocument = document.querySelector("#friend-close-btn");
    const overlayInDocument = document.querySelector("#friend-overlay");

    // 실제 사용할 요소들 (우선순위: container > document)
    const toggleButton = toggleButtonInContainer || toggleButtonInDocument;
    const closeButton = closeButtonInContainer || closeButtonInDocument;
    const overlay = overlayInContainer || overlayInDocument;

    // 토글 버튼 클릭
    if (toggleButton) {
      toggleButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openFriendPanel();
      });
    }

    // 닫기 버튼 클릭
    if (closeButton) {
      closeButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.closeFriendPanel();
      });
    }

    // 오버레이 클릭으로 닫기
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.closeFriendPanel();
      });
    }

    // ESC 키로 닫기 (모바일에서만)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && window.innerWidth < 1024) {
        this.closeFriendPanel();
      }
    });

    // 창 크기 변경 시 처리
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024) {
        this.closeFriendPanel();
      }
    });
  }

  private openFriendPanel(): void {
    // container 안에서 찾기
    const panelInContainer = this.container.querySelector("#friend-panel");
    const overlayInContainer = this.container.querySelector("#friend-overlay");

    // document 전체에서 찾기
    const panelInDocument = document.querySelector("#friend-panel");
    const overlayInDocument = document.querySelector("#friend-overlay");

    // 실제 사용할 요소들
    const panel = panelInContainer || panelInDocument;
    const overlay = overlayInContainer || overlayInDocument;

    if (panel && overlay) {
      panel.classList.add("show");
      overlay.classList.add("show");

      // 스크롤 방지
      document.body.classList.add("friend-overflow-hidden");
    }
  }

  private closeFriendPanel(): void {
    // container 안에서 찾기
    const panelInContainer = this.container.querySelector("#friend-panel");
    const overlayInContainer = this.container.querySelector("#friend-overlay");

    // document 전체에서 찾기
    const panelInDocument = document.querySelector("#friend-panel");
    const overlayInDocument = document.querySelector("#friend-overlay");

    // 실제 사용할 요소들
    const panel = panelInContainer || panelInDocument;
    const overlay = overlayInContainer || overlayInDocument;

    if (panel && overlay) {
      panel.classList.remove("show");
      overlay.classList.remove("show");

      // 스크롤 복원
      document.body.classList.remove("friend-overflow-hidden");
    }
  }

  private setupDropdownToggleListeners(): void {
    // DOM이 완전히 로드될 때까지 대기
    setTimeout(() => {
      const requestsToggle = this.container.querySelector("#requestsToggle");
      const requestsDropdown = this.container.querySelector("#requestsDropdown");
      const sentRequestsToggle = this.container.querySelector("#sentRequestsToggle");
      const sentRequestsDropdown = this.container.querySelector("#sentRequestsDropdown");

      if (requestsToggle) {
        requestsToggle.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.toggleRequestsDropdown(requestsDropdown);
        });
      }

      if (sentRequestsToggle) {
        sentRequestsToggle.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.toggleRequestsDropdown(sentRequestsDropdown);
        });
      }
    }, 100);
  }

  private setupFriendActionListeners(): void {
    this.container.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      // 라우팅 처리 (프로필 페이지로 이동)
      const routeTarget = target.closest("[data-route]") as HTMLElement;
      if (routeTarget) {
        e.preventDefault();
        const route = routeTarget.getAttribute("data-route");
        if (route && window.router) {
          window.router.navigate(route);
        }
        return;
      }

      if (target.id === "addFriendBtn" || target.closest("#addFriendBtn")) {
        e.preventDefault();
        this.handleAddFriendClick();
        return;
      }

      this.handleContainerClick(e);
    });

    this.container.addEventListener("keypress", (e) => {
      if ((e.target as HTMLElement).id === "addFriendInput" && e.key === "Enter") {
        e.preventDefault();
        this.handleAddFriendClick();
      }
    });
  }

  private setupDocumentClickListener(): void {
    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target as Node)) {
        const requestsDropdown = this.container.querySelector("#requestsDropdown");
        const sentRequestsDropdown = this.container.querySelector("#sentRequestsDropdown");
        if (requestsDropdown) this.closeRequestsDropdown(requestsDropdown);
        if (sentRequestsDropdown) this.closeRequestsDropdown(sentRequestsDropdown);
      }
    });
  }

  private handleAddFriendClick(): void {
    const addFriendInput = this.container.querySelector("#addFriendInput") as HTMLInputElement;
    if (addFriendInput?.value.trim()) {
      this.addFriend(addFriendInput.value.trim());
    }
  }

  private toggleRequestsDropdown(dropdown: Element | null): void {
    if (!dropdown) {
      return;
    }

    const isVisible = dropdown.classList.contains("show");

    if (isVisible) {
      this.closeRequestsDropdown(dropdown);
    } else {
      this.openRequestsDropdown(dropdown);
    }
  }

  private openRequestsDropdown(dropdown: Element): void {
    dropdown.classList.add("show");
  }

  private closeRequestsDropdown(dropdown: Element): void {
    dropdown.classList.remove("show");
  }

  private handleContainerClick(e: Event): void {
    const target = e.target as HTMLElement;
    const text = target.textContent;

    if (target.id === "addFriendBtn" || target.closest("#addFriendBtn")) {
      return;
    }

    const requestItem = target.closest("[data-relation-id]");
    const sentRequestsList = this.container.querySelector("#sentRequestsList");

    if (text === "✗" && requestItem && sentRequestsList?.contains(requestItem)) {
      this.handleCancelSentRequest(target);
      return;
    }

    switch (text) {
      case "✓":
        this.handleAcceptRequest(target);
        break;
      case "✗":
        this.handleRejectRequest(target);
        break;
      case "🗑️":
        this.handleDeleteFriend(target, e);
        break;
    }
  }

  private renderFriendItems(): void {
    const friends = this.dataManager.getFriends();
    const friendRequests = this.dataManager.getFriendRequests();
    const sentRequests = this.dataManager.getSentRequests();

    this.uiRenderer.renderFriendItems(friends, friendRequests, sentRequests);
    this.updateNotificationBadge(friendRequests.length);
  }

  private async addFriend(username: string): Promise<void> {
    if (!username.trim()) return;

    try {
      // 자기 자신을 친구로 추가하려는 경우 방지
      if (this.dataManager.isSelfUsername(username.trim())) {
        this.showInfoModal("친구 추가 불가", "자기 자신을 친구로 추가할 수 없습니다.");
        return;
      }

      // 이미 친구인지 확인
      const existingFriend = this.dataManager
        .getFriends()
        .find((friend) => friend.username?.toLowerCase() === username.trim().toLowerCase());

      if (existingFriend) {
        this.showInfoModal("친구 추가 불가", "이미 친구로 등록된 사용자입니다.");
        return;
      }

      // 이미 친구 요청을 보냈는지 확인
      const existingSentRequest = this.dataManager
        .getSentRequests()
        .find((request) => request.username?.toLowerCase() === username.trim().toLowerCase());

      if (existingSentRequest) {
        this.showInfoModal("친구 추가 불가", "이미 친구 요청을 보낸 사용자입니다.");
        return;
      }

      // 받은 친구 요청 중에 해당 사용자가 있는지 확인
      const existingReceivedRequest = this.dataManager
        .getFriendRequests()
        .find((request) => request.username?.toLowerCase() === username.trim().toLowerCase());

      if (existingReceivedRequest) {
        this.showInfoModal(
          "친구 추가 불가",
          "해당 사용자로부터 이미 친구 요청을 받았습니다. 받은 요청에서 수락해주세요."
        );
        return;
      }

      const response = await friendService.requestFriend(username);

      if (response.success) {
        const input = this.container.querySelector("#addFriendInput") as HTMLInputElement;
        if (input) input.value = "";

        // 보낸 요청 데이터 우선 새로고침
        await this.dataManager.loadSentRequests();

        // 전체 데이터 새로고침
        await this.dataManager.loadAllData();

        // UI 새로고침
        this.renderFriendItems();

        this.showInfoModal("친구 요청 완료", `${username}님에게 친구 요청을 보냈습니다.`);
      } else {
        // 500번대 에러는 이미 friendService에서 "서버 오류가 발생했습니다" 메시지로 변환됨
        const errorMsg = response.message || "알 수 없는 오류가 발생했습니다";
        this.showErrorModal("친구 요청 실패", errorMsg);
      }
    } catch (error) {
      console.error("친구 요청 오류:", error);
      this.showErrorModal("친구 요청 오류", "친구 요청을 보내는 중 문제가 발생했습니다.");
    }
  }

  private handleAcceptRequest(target: HTMLElement): void {
    const requestItem = target.closest("[data-relation-id]");
    const relationId = requestItem?.getAttribute("data-relation-id");
    const nameElement = requestItem?.querySelector(".friend-request-name");
    const requestName = nameElement?.textContent;

    if (relationId && requestName) {
      this.acceptFriendRequestById(relationId, requestName);
    }
  }

  private handleRejectRequest(target: HTMLElement): void {
    const requestItem = target.closest("[data-relation-id]");
    const relationId = requestItem?.getAttribute("data-relation-id");
    const nameElement = requestItem?.querySelector(".friend-request-name");
    const requestName = nameElement?.textContent;

    if (relationId && requestName) {
      this.rejectFriendRequestById(relationId, requestName);
    }
  }

  private handleDeleteFriend(target: HTMLElement, e: Event): void {
    e.preventDefault();
    e.stopPropagation();

    const friendItem = target.closest("[data-friend-id]");
    const friendId = friendItem?.getAttribute("data-friend-id");
    const nameElement = friendItem?.querySelector(".friend-item-name");
    const friendName = nameElement?.textContent?.trim();

    let finalFriendName = friendName;
    if (!finalFriendName && friendId) {
      const friend = this.dataManager.getFriend(friendId);
      finalFriendName = friend?.name || friend?.username || `사용자${friendId}`;
    }

    if (friendId && finalFriendName) {
      this.deleteFriend(friendId, finalFriendName);
    }
  }

  private handleCancelSentRequest(target: HTMLElement): void {
    const requestItem = target.closest("[data-relation-id]");
    const relationId = requestItem?.getAttribute("data-relation-id");
    const nameElement = requestItem?.querySelector(".friend-request-name");
    const requestName = nameElement?.textContent;

    if (!relationId || !requestName) return;

    const sentRequest = this.dataManager
      .getSentRequests()
      .find((req) => req.relationId.toString() === relationId.toString());

    if (sentRequest) {
      // sentRequest.id는 실제 받는 사람의 ID (receiverId)
      this.cancelFriendRequest(sentRequest.id, requestName);
    }
  }

  private async acceptFriendRequestById(relationId: string, friendName: string): Promise<void> {
    try {
      const response = await friendService.acceptFriendRequest(relationId);

      if (response.success) {
        await this.dataManager.loadAllData();
        this.renderFriendItems();
        this.closeAllDropdowns();
        this.showInfoModal("친구 요청 수락", `${friendName}님이 친구 목록에 추가되었습니다.`);
      } else {
        const errorMsg = response.message || "알 수 없는 오류가 발생했습니다";
        this.showErrorModal("친구 요청 수락 실패", errorMsg);
      }
    } catch (error) {
      console.error("친구 요청 수락 오류:", error);
      this.showErrorModal("친구 요청 수락 오류", "친구 요청을 수락하는 중 문제가 발생했습니다.");
    }
  }

  private async rejectFriendRequestById(relationId: string, friendName: string): Promise<void> {
    try {
      const response = await friendService.rejectFriendRequest(relationId);

      if (response.success) {
        await this.dataManager.loadAllData();
        this.renderFriendItems();
        this.closeAllDropdowns();
        this.showInfoModal("친구 요청 거절", `${friendName}님의 친구 요청을 거절했습니다.`);
      } else {
        const errorMsg = response.message || "알 수 없는 오류가 발생했습니다";
        this.showErrorModal("친구 요청 거절 실패", errorMsg);
      }
    } catch (error) {
      console.error("친구 요청 거절 오류:", error);
      this.showErrorModal("친구 요청 거절 오류", "친구 요청을 거절하는 중 문제가 발생했습니다.");
    }
  }

  private async deleteFriend(friendId: string, friendName: string): Promise<void> {
    if (!confirm(`정말로 ${friendName}님을 친구에서 삭제하시겠습니까?`)) return;

    try {
      const response = await friendService.deleteFriend(friendId);

      if (response.success) {
        await this.dataManager.loadAllData();
        this.renderFriendItems();
        this.showInfoModal("친구 삭제 완료", `${friendName}님을 친구에서 삭제했습니다.`);
      } else {
        const errorMsg = response.message || "알 수 없는 오류가 발생했습니다";
        this.showErrorModal("친구 삭제 실패", errorMsg);
      }
    } catch (error) {
      console.error("친구 삭제 오류:", error);
      this.showErrorModal("친구 삭제 오류", "친구를 삭제하는 중 문제가 발생했습니다.");
    }
  }

  private async cancelFriendRequest(receiverId: string, receiverName: string): Promise<void> {
    if (!confirm(`정말로 ${receiverName}님에게 보낸 친구 요청을 취소하시겠습니까?`)) return;

    try {
      const response = await friendService.cancelFriendRequest(receiverId, receiverName);

      if (response.success) {
        // 보낸 요청 데이터만 새로고침
        await this.dataManager.loadSentRequests();

        // 전체 데이터도 새로고침 (혹시 모를 동기화 이슈 방지)
        await this.dataManager.loadAllData();

        // UI 강제 새로고침
        this.renderFriendItems();

        // 드롭다운 닫기
        this.closeAllDropdowns();

        this.showInfoModal("친구 요청 취소", `${receiverName}님에게 보낸 친구 요청을 취소했습니다.`);
      } else {
        const errorMsg = response.message || "알 수 없는 오류가 발생했습니다";
        this.showErrorModal("친구 요청 취소 실패", errorMsg);
      }
    } catch (error) {
      console.error("친구 요청 취소 오류:", error);
      this.showErrorModal("친구 요청 취소 오류", "친구 요청을 취소하는 중 문제가 발생했습니다.");
    }
  }

  private closeAllDropdowns(): void {
    const requestsDropdown = this.container.querySelector("#requestsDropdown");
    const sentRequestsDropdown = this.container.querySelector("#sentRequestsDropdown");
    if (requestsDropdown) this.closeRequestsDropdown(requestsDropdown);
    if (sentRequestsDropdown) this.closeRequestsDropdown(sentRequestsDropdown);
  }

  private updateNotificationBadge(count: number): void {
    const badge = document.querySelector("#friend-notification-badge") as HTMLElement;
    if (badge) {
      if (count > 0) {
        badge.textContent = count.toString();
        badge.classList.add("show");
      } else {
        badge.classList.remove("show");
      }
    }
  }

  public destroy(): void {
    friendWebSocketManager.disconnect();

    // 스크롤 복원
    document.body.classList.remove("friend-overflow-hidden");
  }
}
