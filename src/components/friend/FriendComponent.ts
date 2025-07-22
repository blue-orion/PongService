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
    this.requestNotificationPermission();

    await this.userProfileManager.setupUserProfile();
    await this.loadFriendsData();
  }

  private render(): void {
    this.container.innerHTML = getFriendComponentTemplate();
  }

  private setupWebSocket(): void {
    friendWebSocketManager.connect();
    friendWebSocketManager.onFriendNotificationReceived(this.handleWebSocketMessage.bind(this));
  }

  private handleWebSocketMessage(data: any): void {
    this.eventHandler.handleFriendNotification(data);
  }

  private requestNotificationPermission(): void {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }

  private showNotification(message: string): void {
    if (Notification.permission === "granted") {
      new Notification("친구 알림", {
        body: message,
        icon: "/favicon.ico",
        tag: "friend-notification",
        requireInteraction: false,
        silent: false,
      });
    }
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
    console.log("setupMobileToggleListeners 호출됨");

    // container 안에서 찾기
    const toggleButtonInContainer = this.container.querySelector("#mobile-friend-toggle");
    const closeButtonInContainer = this.container.querySelector("#friend-close-btn");
    const overlayInContainer = this.container.querySelector("#friend-overlay");

    // document 전체에서 찾기
    const toggleButtonInDocument = document.querySelector("#mobile-friend-toggle");
    const closeButtonInDocument = document.querySelector("#friend-close-btn");
    const overlayInDocument = document.querySelector("#friend-overlay");

    console.log("Container에서 찾은 요소들:", {
      toggleButton: toggleButtonInContainer,
      closeButton: closeButtonInContainer,
      overlay: overlayInContainer,
    });

    console.log("Document에서 찾은 요소들:", {
      toggleButton: toggleButtonInDocument,
      closeButton: closeButtonInDocument,
      overlay: overlayInDocument,
    });

    // 실제 사용할 요소들 (우선순위: container > document)
    const toggleButton = toggleButtonInContainer || toggleButtonInDocument;
    const closeButton = closeButtonInContainer || closeButtonInDocument;
    const overlay = overlayInContainer || overlayInDocument;

    console.log("최종 사용할 요소들:", {
      toggleButton,
      closeButton,
      overlay,
      containerHTML: this.container.innerHTML.substring(0, 300) + "...",
    });

    // 토글 버튼 클릭
    if (toggleButton) {
      console.log("토글 버튼 이벤트 리스너 추가");
      toggleButton.addEventListener("click", (e) => {
        console.log("토글 버튼 클릭됨!");
        e.preventDefault();
        e.stopPropagation();
        this.openFriendPanel();
      });
    } else {
      console.error("토글 버튼을 찾을 수 없습니다!");
    }

    // 닫기 버튼 클릭
    if (closeButton) {
      console.log("닫기 버튼 이벤트 리스너 추가");
      closeButton.addEventListener("click", (e) => {
        console.log("닫기 버튼 클릭됨!");
        e.preventDefault();
        e.stopPropagation();
        this.closeFriendPanel();
      });
    } else {
      console.error("닫기 버튼을 찾을 수 없습니다!");
    }

    // 오버레이 클릭으로 닫기
    if (overlay) {
      console.log("오버레이 이벤트 리스너 추가");
      overlay.addEventListener("click", (e) => {
        console.log("오버레이 클릭됨!");
        e.preventDefault();
        e.stopPropagation();
        this.closeFriendPanel();
      });
    } else {
      console.error("오버레이를 찾을 수 없습니다!");
    }

    // ESC 키로 닫기 (모바일에서만)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && window.innerWidth < 1024) {
        console.log("ESC 키로 친구 패널 닫기");
        this.closeFriendPanel();
      }
    });

    // 창 크기 변경 시 처리
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024) {
        console.log("창 크기 변경으로 친구 패널 닫기");
        this.closeFriendPanel();
      }
    });
  }

  private openFriendPanel(): void {
    console.log("openFriendPanel 호출됨");

    // container 안에서 찾기
    const panelInContainer = this.container.querySelector("#friend-panel");
    const overlayInContainer = this.container.querySelector("#friend-overlay");

    // document 전체에서 찾기
    const panelInDocument = document.querySelector("#friend-panel");
    const overlayInDocument = document.querySelector("#friend-overlay");

    // 실제 사용할 요소들
    const panel = panelInContainer || panelInDocument;
    const overlay = overlayInContainer || overlayInDocument;

    console.log("패널 열기 - 찾은 요소들:", {
      panelInContainer,
      overlayInContainer,
      panelInDocument,
      overlayInDocument,
      panel,
      overlay,
    });

    if (panel && overlay) {
      console.log("패널 열기 실행");
      panel.classList.remove("translate-x-full");
      panel.classList.add("translate-x-0");

      overlay.classList.remove("opacity-0", "pointer-events-none");
      overlay.classList.add("opacity-100", "pointer-events-auto");

      // 스크롤 방지
      document.body.style.overflow = "hidden";
      console.log("패널 열기 완료");
    } else {
      console.error("패널 또는 오버레이를 찾을 수 없습니다!", { panel, overlay });
    }
  }

  private closeFriendPanel(): void {
    console.log("closeFriendPanel 호출됨");

    // container 안에서 찾기
    const panelInContainer = this.container.querySelector("#friend-panel");
    const overlayInContainer = this.container.querySelector("#friend-overlay");

    // document 전체에서 찾기
    const panelInDocument = document.querySelector("#friend-panel");
    const overlayInDocument = document.querySelector("#friend-overlay");

    // 실제 사용할 요소들
    const panel = panelInContainer || panelInDocument;
    const overlay = overlayInContainer || overlayInDocument;

    console.log("패널 닫기 - 찾은 요소들:", {
      panelInContainer,
      overlayInContainer,
      panelInDocument,
      overlayInDocument,
      panel,
      overlay,
    });

    if (panel && overlay) {
      console.log("패널 닫기 실행");
      panel.classList.remove("translate-x-0");
      panel.classList.add("translate-x-full");

      overlay.classList.remove("opacity-100", "pointer-events-auto");
      overlay.classList.add("opacity-0", "pointer-events-none");

      // 스크롤 복원
      document.body.style.overflow = "";
      console.log("패널 닫기 완료");
    } else {
      console.error("패널 또는 오버레이를 찾을 수 없습니다!", { panel, overlay });
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

    const isVisible = dropdown.classList.contains("opacity-100");

    if (isVisible) {
      this.closeRequestsDropdown(dropdown);
    } else {
      this.openRequestsDropdown(dropdown);
    }
  }

  private openRequestsDropdown(dropdown: Element): void {
    dropdown.classList.remove("opacity-0", "-translate-y-2.5", "pointer-events-none");
    dropdown.classList.add("opacity-100", "translate-y-0", "pointer-events-auto");
  }

  private closeRequestsDropdown(dropdown: Element): void {
    dropdown.classList.remove("opacity-100", "translate-y-0", "pointer-events-auto");
    dropdown.classList.add("opacity-0", "-translate-y-2.5", "pointer-events-none");
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

        this.showNotification(`${username}님에게 친구 요청을 보냈습니다.`);
      } else {
        const errorMsg = response.message || "네트워크 오류가 발생했습니다";
        this.showNotification(`친구 요청 실패: ${errorMsg}`);
      }
    } catch (error) {
      console.error("친구 요청 오류:", error);
      this.showNotification("친구 요청 중 오류가 발생했습니다.");
    }
  }

  private handleAcceptRequest(target: HTMLElement): void {
    const requestItem = target.closest("[data-relation-id]");
    const relationId = requestItem?.getAttribute("data-relation-id");
    const nameElement = requestItem?.querySelector(".text-gray-800");
    const requestName = nameElement?.textContent;

    if (relationId && requestName) {
      this.acceptFriendRequestById(relationId, requestName);
    }
  }

  private handleRejectRequest(target: HTMLElement): void {
    const requestItem = target.closest("[data-relation-id]");
    const relationId = requestItem?.getAttribute("data-relation-id");
    const nameElement = requestItem?.querySelector(".text-gray-800");
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
    const nameElement = friendItem?.querySelector(".text-white");
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
    const nameElement = requestItem?.querySelector(".text-gray-800");
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
        this.showNotification(`${friendName}님이 친구 목록에 추가되었습니다.`);
      } else {
        this.showNotification(`친구 요청 수락 실패: ${response.message || "서버 오류"}`);
      }
    } catch (error) {
      console.error("친구 요청 수락 오류:", error);
      this.showNotification("친구 요청 수락 중 오류가 발생했습니다.");
    }
  }

  private async rejectFriendRequestById(relationId: string, friendName: string): Promise<void> {
    try {
      const response = await friendService.rejectFriendRequest(relationId);

      if (response.success) {
        await this.dataManager.loadAllData();
        this.renderFriendItems();
        this.closeAllDropdowns();
        this.showNotification(`${friendName}님의 친구 요청을 거절했습니다.`);
      } else {
        this.showNotification(`친구 요청 거절 실패: ${response.message || "서버 오류"}`);
      }
    } catch (error) {
      console.error("친구 요청 거절 오류:", error);
      this.showNotification("친구 요청 거절 중 오류가 발생했습니다.");
    }
  }

  private async deleteFriend(friendId: string, friendName: string): Promise<void> {
    if (!confirm(`정말로 ${friendName}님을 친구에서 삭제하시겠습니까?`)) return;

    try {
      const response = await friendService.deleteFriend(friendId);

      if (response.success) {
        await this.dataManager.loadAllData();
        this.renderFriendItems();
        this.showNotification(`${friendName}님을 친구에서 삭제했습니다.`);
      } else {
        this.showNotification(`친구 삭제 실패: ${response.message || "서버 오류"}`);
      }
    } catch (error) {
      console.error("친구 삭제 오류:", error);
      this.showNotification("친구 삭제 중 오류가 발생했습니다.");
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

        this.showNotification(`${receiverName}님에게 보낸 친구 요청을 취소했습니다.`);
      } else {
        this.showNotification(`친구 요청 취소 실패: ${response.message || "서버 오류"}`);
      }
    } catch (error) {
      console.error("친구 요청 취소 오류:", error);
      this.showNotification("친구 요청 취소 중 오류가 발생했습니다.");
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
        badge.classList.remove("hidden", "opacity-0", "scale-0");
        badge.classList.add("opacity-100", "scale-100");
      } else {
        badge.classList.add("hidden", "opacity-0", "scale-0");
        badge.classList.remove("opacity-100", "scale-100");
      }
    }
  }

  public destroy(): void {
    friendWebSocketManager.disconnect();

    // 스크롤 복원
    document.body.style.overflow = "";
  }
}
