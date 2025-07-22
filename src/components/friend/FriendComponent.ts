import { friendService } from "../../utils/friendService";
import { friendWebSocketManager } from "../../utils/friendWebSocket";
import { AuthManager } from "../../utils/auth";

interface Friend {
  id: string;
  name: string;
  status: "online" | "offline" | "in-game";
  avatar?: string;
  relationId?: string;
  username?: string;
}

interface FriendRequest {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  relationId: string;
}

interface SentRequest {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  relationId: string;
}

export class FriendComponent {
  private container: HTMLElement;
  private friends: Friend[] = [];
  private friendRequests: FriendRequest[] = [];
  private sentRequests: SentRequest[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeWebSocket();
  }

  private getTemplate(): string {
    return `
<div class="fixed top-0 right-0 w-80 h-full bg-gradient-to-br from-indigo-900/95 via-purple-900/95 to-pink-900/95 backdrop-blur-xl border-l border-white/20 z-50 shadow-2xl">
  <!-- 친구창 헤더 -->
  <div class="p-4 border-b border-white/20 bg-white/5">
    <h3 class="text-xl font-bold text-white text-center tracking-wide">친구 목록</h3>
  </div>

  <!-- 사용자 프로필 -->
  <div class="p-4 border-b border-white/20 bg-white/5">
    <div class="flex items-center gap-3 mb-3">
      <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 border-2 border-white/30" id="userAvatar"></div>
      <div class="flex-1">
        <div class="text-white font-semibold text-sm" id="userNickname">사용자</div>
        <div class="text-white/60 text-xs" id="userUsername">@username</div>
        <div class="text-green-400 text-xs font-medium">온라인</div>
      </div>
    </div>
    
    <!-- 친구 요청 보관함 -->
    <div class="relative mb-2" id="friendRequestsBox">
      <button class="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 flex items-center justify-between transition-all duration-200 hover:scale-[1.02]" id="requestsToggle">
        <div class="flex items-center gap-2">
          <span class="text-lg">📮</span>
          <span class="text-white text-sm font-medium">받은 요청</span>
        </div>
        <span class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold hidden" id="requestsCount">0</span>
      </button>
      <div class="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 opacity-0 -translate-y-2.5 pointer-events-none transition-all duration-300 z-50" id="requestsDropdown">
        <div class="p-3 border-b border-white/20 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-t-xl">
          <div class="text-gray-800 font-bold text-sm">받은 친구 요청</div>
        </div>
        <div class="max-h-60 overflow-y-auto" id="requestsList">
          <!-- 친구 요청들이 여기에 동적으로 추가됩니다 -->
        </div>
      </div>
    </div>
    
    <!-- 보낸 요청 보관함 -->
    <div class="relative" id="sentRequestsBox">
      <button class="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 flex items-center justify-between transition-all duration-200 hover:scale-[1.02]" id="sentRequestsToggle">
        <div class="flex items-center gap-2">
          <span class="text-lg">📤</span>
          <span class="text-white text-sm font-medium">보낸 요청</span>
        </div>
        <span class="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold hidden" id="sentRequestsCount">0</span>
      </button>
      <div class="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 opacity-0 -translate-y-2.5 pointer-events-none transition-all duration-300 z-50" id="sentRequestsDropdown">
        <div class="p-3 border-b border-white/20 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-t-xl">
          <div class="text-gray-800 font-bold text-sm">보낸 친구 요청</div>
        </div>
        <div class="max-h-60 overflow-y-auto" id="sentRequestsList">
          <!-- 보낸 요청들이 여기에 동적으로 추가됩니다 -->
        </div>
      </div>
    </div>
  </div>

  <!-- 친구창 내용 -->
  <div class="flex-1 overflow-hidden flex flex-col" id="friendContent">
    <!-- 친구 추가 -->
    <div class="p-4 border-b border-white/20 bg-white/5">
      <div class="flex gap-2">
        <input type="text" placeholder="사용자명으로 친구 추가" class="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent min-w-0" id="addFriendInput" />
        <button class="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3 py-2 rounded-lg font-bold transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 flex-shrink-0 min-w-[44px] flex items-center justify-center" id="addFriendBtn">+</button>
      </div>
    </div>

    <!-- 친구 목록 스크롤 영역 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- 온라인 친구들 -->
      <div>
        <div class="text-white/80 text-sm font-semibold mb-2 px-1" id="onlineTitle">온라인 - 0</div>
        <div class="space-y-2" id="onlineList">
          <!-- 온라인 친구들이 여기에 동적으로 추가됩니다 -->
        </div>
      </div>

      <!-- 오프라인 친구들 -->
      <div>
        <div class="text-white/80 text-sm font-semibold mb-2 px-1" id="offlineTitle">오프라인 - 0</div>
        <div class="space-y-2" id="offlineList">
          <!-- 오프라인 친구들이 여기에 동적으로 추가됩니다 -->
        </div>
      </div>
    </div>
  </div>
</div>
    `;
  }

  public async render(): Promise<void> {
    this.container.innerHTML = this.getTemplate();

    // 사용자 프로필 설정
    this.setupUserProfile();
    await this.loadFriendsData();
    this.setupEventListeners();
    this.renderFriendItems();
    this.updateRequestsBox();
    this.updateSentRequestsBox();

    // 브라우저 알림 권한 요청
    this.requestNotificationPermission();
  }

  private initializeWebSocket(): void {
    friendWebSocketManager.connect();

    friendWebSocketManager.onFriendNotificationReceived((notification) => {
      this.handleFriendNotification(notification);
    });

    friendWebSocketManager.onConnectionStatusChange((status) => {
      console.log("친구 웹소켓 연결 상태:", status);
    });

    friendWebSocketManager.onErrorOccurred((error) => {
      console.error("친구 웹소켓 오류:", error);
    });
  }

  private handleFriendNotification(notification: any): void {
    const { type, payload } = notification;

    switch (type) {
      case "request":
        this.handleFriendRequestReceived(payload);
        break;
      case "accepted":
        this.handleFriendRequestAccepted(payload);
        break;
      case "rejected":
        this.handleFriendRequestRejected(payload);
        break;
      case "cancelled":
        this.handleFriendRequestCancelled(payload);
        break;
      case "deleted":
        this.handleFriendDeleted(payload);
        break;
      case "status_changed":
        this.handleFriendStatusChanged(payload);
        break;
      default:
        console.log("알 수 없는 친구 알림:", notification);
    }
  }

  private getCurrentUserId(): string | null {
    const tokens = AuthManager.getTokens();
    if (!tokens?.accessToken) return null;

    try {
      const tokenPayload = JSON.parse(atob(tokens.accessToken.split(".")[1]));
      return tokenPayload.sub || tokenPayload.userId || tokenPayload.id || tokenPayload.user_id || null;
    } catch (error) {
      console.error("토큰 파싱 실패:", error);
      return null;
    }
  }

  private handleFriendRequestReceived(payload: any): void {
    const requestData = payload.requestData || payload;
    const currentUserId = this.getCurrentUserId();

    // 자신이 보낸 요청인지 확인
    if (requestData.senderId?.toString() === currentUserId?.toString()) {
      // 보낸 요청 목록에 추가
      const newSentRequest: SentRequest = {
        id: requestData.receiverId || Date.now().toString(),
        name: requestData.receiverUsername || "알 수 없는 사용자",
        username: requestData.receiverUsername || "unknown",
        relationId: requestData.relationId || requestData.id || Date.now().toString(),
      };

      const isDuplicate = this.sentRequests.some((req) => req.relationId === newSentRequest.relationId);
      if (!isDuplicate) {
        this.sentRequests.push(newSentRequest);
        this.updateSentRequestsBox();
        this.showNotification(`${newSentRequest.name}님에게 친구 요청을 보냈습니다.`);
      }
    } else {
      // 받은 요청 목록에 추가
      const newRequest: FriendRequest = {
        id: requestData.senderId || requestData.sender_id || Date.now().toString(),
        name:
          requestData.senderUsername ||
          requestData.sender?.nickname ||
          requestData.sender?.username ||
          requestData.name ||
          "알 수 없는 사용자",
        username: requestData.senderUsername || requestData.sender?.username || requestData.username || "unknown",
        relationId: requestData.relationId || requestData.id || Date.now().toString(),
      };

      const isDuplicate = this.friendRequests.some((req) => req.relationId === newRequest.relationId);
      if (!isDuplicate) {
        this.friendRequests.push(newRequest);
        this.updateRequestsBox();
        this.showNotification(`새로운 친구 요청: ${newRequest.name}`);
      }
    }
  }

  private handleFriendRequestAccepted(payload: any): void {
    const requestData = payload.requestData || payload;
    const currentUserId = this.getCurrentUserId();

    // 수락된 요청을 보관함에서 제거 (relationId로 매칭)
    this.friendRequests = this.friendRequests.filter((request) => request.relationId !== requestData.relationId);
    this.sentRequests = this.sentRequests.filter((request) => request.relationId !== requestData.relationId);

    // 상대방 ID 결정 (senderId나 receiverId 중 현재 사용자가 아닌 것)
    const friendId = requestData.senderId === currentUserId ? requestData.receiverId : requestData.senderId;

    // 친구 목록 다시 로드해서 정확한 정보 가져오기
    this.loadFriends()
      .then(() => {
        this.renderFriendItems();
        this.updateRequestsBox();
        this.updateSentRequestsBox();
        this.showNotification("친구 요청이 수락되었습니다.");
      })
      .catch((error) => {
        console.error("친구 목록 재로드 실패:", error);
        // 실패시 임시로 추가
        const tempFriend: Friend = {
          id: friendId?.toString() || Date.now().toString(),
          name: `사용자${friendId}`,
          username: "unknown",
          status: "offline",
          relationId: requestData.relationId || Date.now().toString(),
        };
        this.addFriendToList(tempFriend);
        this.updateRequestsBox();
        this.updateSentRequestsBox();
      });
  }

  private handleFriendRequestRejected(payload: any): void {
    const requestData = payload.requestData || payload;

    // 거절된 요청을 보낸 요청 목록에서 제거 (relationId로 매칭)
    const removedRequest = this.sentRequests.find((request) => request.relationId === requestData.relationId);
    this.sentRequests = this.sentRequests.filter((request) => request.relationId !== requestData.relationId);

    // UI 업데이트
    this.updateSentRequestsBox();

    // 알림 표시
    if (removedRequest) {
      this.showNotification(`${removedRequest.name}님이 친구 요청을 거절했습니다.`);
    } else {
      this.showNotification("친구 요청이 거절되었습니다.");
    }
  }

  private handleFriendRequestCancelled(payload: any): void {
    const requestData = payload.requestData || payload;
    const currentUserId = this.getCurrentUserId();

    // 취소된 요청을 적절한 목록에서 제거
    if (requestData.senderId?.toString() === currentUserId?.toString()) {
      // 자신이 취소한 경우 - 보낸 요청 목록에서 제거
      const removedRequest = this.sentRequests.find((request) => request.relationId === requestData.relationId);
      this.sentRequests = this.sentRequests.filter((request) => request.relationId !== requestData.relationId);
      this.updateSentRequestsBox();

      if (removedRequest) {
        this.showNotification(`${removedRequest.name}님에게 보낸 친구 요청을 취소했습니다.`);
      }
    } else {
      // 상대방이 취소한 경우 - 받은 요청 목록에서 제거
      const removedRequest = this.friendRequests.find((request) => request.relationId === requestData.relationId);
      this.friendRequests = this.friendRequests.filter((request) => request.relationId !== requestData.relationId);
      this.updateRequestsBox();

      if (removedRequest) {
        this.showNotification(`${removedRequest.name}님이 친구 요청을 취소했습니다.`);
      } else {
        this.showNotification("친구 요청이 취소되었습니다.");
      }
    }
  }

  private addFriendToList(newFriend: Friend): void {
    const isDuplicate = this.friends.some((friend) => friend.id === newFriend.id);
    if (!isDuplicate) {
      this.friends.push(newFriend);
      this.renderFriendItems();
      this.showNotification(`${newFriend.name}님이 친구 요청을 수락했습니다.`);
    }
  }

  private showNotification(message: string): void {
    console.log("친구 알림:", message);

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

  private handleFriendDeleted(payload: any): void {
    const requestData = payload.requestData || payload;
    const currentUserId = this.getCurrentUserId();

    // 삭제할 친구 ID 결정 (senderId나 receiverId 중 현재 사용자가 아닌 것)
    const deletedFriendId = requestData.senderId === currentUserId ? requestData.receiverId : requestData.senderId;

    if (deletedFriendId) {
      // 친구 목록에서 해당 친구 제거
      this.friends = this.friends.filter((friend) => friend.id !== deletedFriendId.toString());
      this.renderFriendItems();
      this.showNotification("친구가 삭제되었습니다.");
    }
  }

  private handleFriendStatusChanged(payload: any): void {
    const friendId = payload.friendId || payload.userId || payload.id;
    const newStatus = this.convertStatus(payload.status || "OFFLINE");

    if (friendId) {
      const friendIndex = this.friends.findIndex((friend) => friend.id === friendId?.toString());
      if (friendIndex !== -1) {
        const oldStatus = this.friends[friendIndex].status;
        this.friends[friendIndex].status = newStatus;

        if (oldStatus !== newStatus) {
          this.renderFriendItems();

          // 온라인 상태로 변경시에만 알림
          if (newStatus === "online" && oldStatus === "offline") {
            this.showNotification(`${this.friends[friendIndex].name}님이 온라인 상태입니다.`);
          }
        }
      }
    }
  }

  private requestNotificationPermission(): void {
    // 브라우저가 알림을 지원하는지 확인
    if (!("Notification" in window)) {
      console.log("이 브라우저는 데스크톱 알림을 지원하지 않습니다.");
      return;
    }

    // 이미 권한이 허용되었거나 거부된 경우
    if (Notification.permission !== "default") {
      return;
    }

    // 권한 요청
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("알림 권한이 허용되었습니다.");
      } else {
        console.log("알림 권한이 거부되었습니다.");
      }
    });
  }

  private setupUserProfile(): void {
    // 토큰에서 사용자 정보 추출 또는 기본값 사용
    const tokens = AuthManager.getTokens();
    let nickname = "사용자";

    if (tokens?.accessToken) {
      try {
        const payload = JSON.parse(atob(tokens.accessToken.split(".")[1]));
        const username = payload.username || payload.sub || "사용자";
        nickname = payload.nickname || username;
      } catch (error) {
        console.log("토큰 디코딩 실패, 기본 사용자명 사용");
      }
    }

    const nicknameElement = this.container.querySelector("#userNickname") as HTMLElement;
    const usernameElement = this.container.querySelector("#userUsername") as HTMLElement;

    if (nicknameElement) {
      nicknameElement.textContent = nickname;
    }

    if (usernameElement) {
      usernameElement.style.display = "none";
    }
  }

  private async loadFriendsData(): Promise<void> {
    try {
      await this.loadFriends();
      await this.loadFriendRequests();
      await this.loadSentRequests(); // 보낸 요청도 로드
      this.renderFriendItems();
      this.updateRequestsBox();
      this.updateSentRequestsBox();
    } catch (error) {
      console.error("친구 데이터 로드 실패:", error);
      this.friends = [];
      this.friendRequests = [];
      this.sentRequests = [];
      this.renderFriendItems();
      this.updateRequestsBox();
      this.updateSentRequestsBox();
    }
  }

  private async loadFriends(): Promise<void> {
    const response = await friendService.getFriendsList();

    if (!response.success || !response.data) {
      this.friends = [];
      return;
    }

    // 응답 구조 처리
    let friendsData: any[] = [];
    if (response.data.friends && Array.isArray(response.data.friends)) {
      friendsData = response.data.friends;
    } else if ((response.data as any).data?.friends && Array.isArray((response.data as any).data.friends)) {
      friendsData = (response.data as any).data.friends;
    }

    this.friends = friendsData.map((friend: any) => ({
      id: friend.id.toString(),
      name: friend.nickname || friend.username,
      username: friend.username,
      status: this.convertStatus(friend.status),
      avatar: friend.profile_image,
      relationId: friend.relationId?.toString() || friend.id.toString(),
    }));
  }

  private async loadFriendRequests(): Promise<void> {
    const response = await friendService.getReceivedRequests();

    if (!response.success || !response.data) {
      this.friendRequests = [];
      return;
    }

    // 응답 구조 처리
    let requestsArray: any[] = [];
    if (Array.isArray(response.data)) {
      requestsArray = response.data;
    } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
      requestsArray = (response.data as any).data;
    } else if ((response.data as any).content && Array.isArray((response.data as any).content)) {
      requestsArray = (response.data as any).content;
    }

    this.friendRequests = requestsArray.map((request: any) => ({
      id: request.id?.toString() || "unknown",
      name: request.sender?.nickname || request.sender?.username || `사용자 ${request.sender_id}`,
      username: request.sender?.username || `사용자 ${request.sender_id}`,
      avatar: request.sender?.profile_image || null,
      relationId: request.id?.toString() || "unknown",
    }));
  }

  private async loadSentRequests(): Promise<void> {
    const response = await friendService.getSentRequests();

    if (!response.success || !response.data) {
      this.sentRequests = [];
      return;
    }

    // 응답 구조 처리
    let requestsArray: any[] = [];

    if (Array.isArray(response.data)) {
      requestsArray = response.data;
    } else if ((response.data as any).data?.content && Array.isArray((response.data as any).data.content)) {
      requestsArray = (response.data as any).data.content;
    } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
      requestsArray = (response.data as any).data;
    } else if ((response.data as any).content && Array.isArray((response.data as any).content)) {
      requestsArray = (response.data as any).content;
    }

    this.sentRequests = requestsArray.map((request: any) => ({
      id: request.receiver_id?.toString() || request.receiver?.id?.toString() || "unknown",
      name: request.receiver?.nickname || request.receiver?.username || `사용자 ${request.receiver_id || "unknown"}`,
      username: request.receiver?.username || `사용자 ${request.receiver_id || "unknown"}`,
      avatar: request.receiver?.profile_image || undefined,
      relationId: request.id?.toString() || "unknown",
    }));
  }

  private convertStatus(apiStatus: string): "online" | "offline" | "in-game" {
    switch (apiStatus) {
      case "ONLINE":
        return "online";
      case "IN_GAME":
        return "in-game";
      default:
        return "offline";
    }
  }

  private setupEventListeners(): void {
    // 친구 요청 보관함 토글
    const requestsToggle = this.container.querySelector("#requestsToggle");
    const requestsDropdown = this.container.querySelector("#requestsDropdown");
    requestsToggle?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleRequestsDropdown(requestsDropdown);
    });

    // 보낸 요청 보관함 토글
    const sentRequestsToggle = this.container.querySelector("#sentRequestsToggle");
    const sentRequestsDropdown = this.container.querySelector("#sentRequestsDropdown");
    sentRequestsToggle?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleRequestsDropdown(sentRequestsDropdown);
    });

    // 드롭다운 외부 클릭시 닫기
    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target as Node)) {
        if (requestsDropdown) this.closeRequestsDropdown(requestsDropdown);
        if (sentRequestsDropdown) this.closeRequestsDropdown(sentRequestsDropdown);
      }
    });

    // 친구 추가
    const addFriendBtn = this.container.querySelector("#addFriendBtn");
    const addFriendInput = this.container.querySelector("#addFriendInput") as HTMLInputElement;
    addFriendBtn?.addEventListener("click", () => this.addFriend(addFriendInput.value));
    addFriendInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addFriend(addFriendInput.value);
    });

    // 클릭 이벤트 위임
    this.container.addEventListener("click", (e) => this.handleContainerClick(e));
  }

  private toggleRequestsDropdown(dropdown: Element | null): void {
    if (!dropdown) return;

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

    // 보낸 요청함의 취소 버튼인지 확인
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
    const friendName = nameElement?.textContent?.trim() || "알 수 없는 친구";

    if (friendId) {
      this.deleteFriend(friendId, friendName);
    }
  }

  private handleCancelSentRequest(target: HTMLElement): void {
    const requestItem = target.closest("[data-relation-id]");
    const relationId = requestItem?.getAttribute("data-relation-id");
    const nameElement = requestItem?.querySelector(".text-gray-800");
    const requestName = nameElement?.textContent;

    if (!relationId || !requestName) return;

    const sentRequest = this.sentRequests.find((req) => req.relationId.toString() === relationId.toString());

    if (sentRequest) {
      this.cancelFriendRequest(sentRequest.id, requestName);
    }
  }

  private renderFriendItems(): void {
    this.renderOnlineFriends();
    this.renderOfflineFriends();
    this.updateRequestsBox();
    this.updateSentRequestsBox();
  }

  private renderOnlineFriends(): void {
    const onlineFriends = this.friends.filter((f) => f.status !== "offline");
    const onlineList = this.container.querySelector("#onlineList");
    const onlineTitle = this.container.querySelector("#onlineTitle");

    if (onlineTitle) {
      onlineTitle.textContent = `온라인 - ${onlineFriends.length}`;
    }

    if (onlineList) {
      onlineList.innerHTML =
        onlineFriends.length === 0
          ? '<div class="text-white/60 text-sm text-center p-4 italic">온라인 친구가 없습니다</div>'
          : onlineFriends.map((friend) => this.createFriendHTML(friend, true)).join("");
    }
  }

  private renderOfflineFriends(): void {
    const offlineFriends = this.friends.filter((f) => f.status === "offline");
    const offlineList = this.container.querySelector("#offlineList");
    const offlineTitle = this.container.querySelector("#offlineTitle");

    if (offlineTitle) {
      offlineTitle.textContent = `오프라인 - ${offlineFriends.length}`;
    }

    if (offlineList) {
      offlineList.innerHTML =
        offlineFriends.length === 0
          ? '<div class="text-white/60 text-sm text-center p-4 italic">오프라인 친구가 없습니다</div>'
          : offlineFriends.map((friend) => this.createFriendHTML(friend, false)).join("");
    }
  }

  private createFriendHTML(friend: Friend, isOnline: boolean): string {
    const statusColor = isOnline ? "green" : "gray";
    const statusText = friend.status === "in-game" ? "게임 중" : isOnline ? "대기 중" : "오프라인";
    const opacity = isOnline ? "" : "opacity-70";

    return `
      <div class="group flex items-center p-3 bg-white/10 rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/20 ${opacity}" data-friend-id="${
      friend.id
    }" data-relation-id="${friend.relationId}">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-${statusColor}-400 to-${
      statusColor === "green" ? "blue" : "gray"
    }-${statusColor === "green" ? "500" : "600"} mr-3 border-2 border-white/30 relative">
          <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-${statusColor}-500 border-2 border-white rounded-full"></div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-white font-semibold text-sm truncate">${friend.name}</div>
          <div class="text-white/70 text-xs truncate">${friend.username || friend.name}</div>
          <div class="text-${statusColor === "green" ? "green" : "gray"}-400 text-xs font-medium">${statusText}</div>
        </div>
        <div class="flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button class="bg-white/20 hover:bg-red-500 border-0 text-white w-8 h-8 rounded-lg cursor-pointer flex items-center justify-center text-sm transition-all duration-200 hover:scale-110" title="친구 삭제" data-friend-id="${
            friend.id
          }" data-relation-id="${friend.relationId}">🗑️</button>
        </div>
      </div>
    `;
  }

  // 친구 요청 보관함 업데이트
  private updateRequestsBox(): void {
    const requestsCount = this.container.querySelector("#requestsCount") as HTMLElement;
    const requestsList = this.container.querySelector("#requestsList") as HTMLElement;

    if (requestsCount) {
      requestsCount.textContent = this.friendRequests.length.toString();
      if (this.friendRequests.length === 0) {
        requestsCount.classList.add("hidden");
      } else {
        requestsCount.classList.remove("hidden");
      }
    }

    if (requestsList) {
      if (this.friendRequests.length === 0) {
        requestsList.innerHTML = '<div class="p-6 text-center text-gray-500 text-sm">받은 친구 요청이 없습니다</div>';
      } else {
        const requestsHTML = this.friendRequests
          .map(
            (request) => `
          <div class="p-3 border-b border-white/10 flex items-center gap-3 transition-colors duration-200 hover:bg-indigo-50 last:border-b-0" data-relation-id="${request.relationId}">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-teal-400 border-2 border-white/50"></div>
            <div class="flex-1 min-w-0">
              <div class="text-gray-800 font-bold text-sm truncate">${request.name}</div>
              <div class="text-gray-600 text-xs truncate">${request.username}</div>
              <div class="text-gray-500 text-xs">친구 요청</div>
            </div>
            <div class="flex gap-2">
              <button class="w-8 h-8 border-0 rounded-lg cursor-pointer flex items-center justify-center text-sm font-bold transition-all duration-200 bg-green-500 text-white hover:bg-green-600 hover:scale-105" title="수락">✓</button>
              <button class="w-8 h-8 border-0 rounded-lg cursor-pointer flex items-center justify-center text-sm font-bold transition-all duration-200 bg-red-500 text-white hover:bg-red-600 hover:scale-105" title="거절">✗</button>
            </div>
          </div>
        `
          )
          .join("");
        requestsList.innerHTML = requestsHTML;
      }
    }
  }

  // 보낸 요청 보관함 업데이트
  private updateSentRequestsBox(): void {
    const sentRequestsCount = this.container.querySelector("#sentRequestsCount") as HTMLElement;
    const sentRequestsList = this.container.querySelector("#sentRequestsList") as HTMLElement;

    if (sentRequestsCount) {
      sentRequestsCount.textContent = this.sentRequests.length.toString();
      if (this.sentRequests.length === 0) {
        sentRequestsCount.classList.add("hidden");
      } else {
        sentRequestsCount.classList.remove("hidden");
      }
    }

    if (sentRequestsList) {
      if (this.sentRequests.length === 0) {
        sentRequestsList.innerHTML =
          '<div class="p-6 text-center text-gray-500 text-sm">보낸 친구 요청이 없습니다</div>';
      } else {
        const sentRequestsHTML = this.sentRequests
          .map(
            (request) => `
          <div class="p-3 border-b border-white/10 flex items-center gap-3 transition-colors duration-200 hover:bg-blue-50 last:border-b-0" data-relation-id="${request.relationId}">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-green-400 border-2 border-white/50"></div>
            <div class="flex-1 min-w-0">
              <div class="text-gray-800 font-bold text-sm truncate">${request.name}</div>
              <div class="text-gray-600 text-xs truncate">${request.username}</div>
              <div class="text-gray-500 text-xs">요청 대기 중</div>
            </div>
            <div class="flex gap-2">
              <button class="w-8 h-8 border-0 rounded-lg cursor-pointer flex items-center justify-center text-sm font-bold transition-all duration-200 bg-gray-500 text-white hover:bg-red-600 hover:scale-105" title="취소">✗</button>
            </div>
          </div>
        `
          )
          .join("");
        sentRequestsList.innerHTML = sentRequestsHTML;
      }
    }
  }

  private async addFriend(username: string): Promise<void> {
    if (!username.trim()) return;

    try {
      const response = await friendService.requestFriend(username);

      if (response.success) {
        const input = this.container.querySelector("#addFriendInput") as HTMLInputElement;
        if (input) input.value = "";

        this.showNotification(`${username}에게 친구 요청을 보냈습니다.`);
      } else {
        this.showNotification(`친구 요청 실패: ${response.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("친구 요청 오류:", error);
      this.showNotification("친구 요청 중 오류가 발생했습니다.");
    }
  }

  private async acceptFriendRequestById(relationId: string, friendName: string): Promise<void> {
    try {
      const response = await friendService.acceptFriendRequest(relationId);

      if (response.success) {
        // 수락된 요청을 목록에서 제거하고 친구로 추가
        const acceptedRequest = this.friendRequests.find((request) => request.relationId === relationId);
        this.friendRequests = this.friendRequests.filter((request) => request.relationId !== relationId);

        if (acceptedRequest) {
          const newFriend: Friend = {
            id: acceptedRequest.id,
            name: acceptedRequest.name,
            username: acceptedRequest.username,
            status: "offline",
            relationId: relationId,
          };

          const isDuplicate = this.friends.some((friend) => friend.id === newFriend.id);
          if (!isDuplicate) {
            this.friends.push(newFriend);
          }
        }

        this.renderFriendItems();
        this.updateRequestsBox();

        const requestsDropdown = this.container.querySelector("#requestsDropdown");
        if (requestsDropdown) {
          this.closeRequestsDropdown(requestsDropdown);
        }

        this.showNotification(`${friendName}님이 친구 목록에 추가되었습니다.`);
      } else {
        this.showNotification(`친구 요청 수락 실패: ${response.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("친구 요청 수락 오류:", error);
      alert("친구 요청 수락 중 오류가 발생했습니다.");
    }
  }

  private async rejectFriendRequestById(relationId: string, friendName: string): Promise<void> {
    try {
      const response = await friendService.rejectFriendRequest(relationId);

      if (response.success) {
        this.friendRequests = this.friendRequests.filter((request) => request.relationId !== relationId);
        this.updateRequestsBox();

        const requestsDropdown = this.container.querySelector("#requestsDropdown");
        if (requestsDropdown) {
          this.closeRequestsDropdown(requestsDropdown);
        }

        this.showNotification(`${friendName}님의 친구 요청을 거절했습니다.`);
      } else {
        this.showNotification(`친구 요청 거절 실패: ${response.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("친구 요청 거절 오류:", error);
      alert("친구 요청 거절 중 오류가 발생했습니다.");
    }
  }

  private async deleteFriend(friendId: string, friendName: string): Promise<void> {
    const confirmed = confirm(`정말로 ${friendName}님을 친구에서 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      const tokens = AuthManager.getTokens();
      if (!tokens?.accessToken) {
        alert("인증 정보가 없습니다. 다시 로그인해주세요.");
        return;
      }

      const response = await friendService.deleteFriend(friendId);

      if (response.success) {
        this.friends = this.friends.filter((friend) => friend.id !== friendId);
        this.renderFriendItems();
        this.showNotification(`${friendName}님을 친구에서 삭제했습니다.`);
      } else {
        alert(`친구 삭제 실패: ${response.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("친구 삭제 오류:", error);
      alert("친구 삭제 중 오류가 발생했습니다.");
    }
  }

  private async cancelFriendRequest(receiverId: string, receiverName: string): Promise<void> {
    const confirmed = confirm(`정말로 ${receiverName}님에게 보낸 친구 요청을 취소하시겠습니까?`);
    if (!confirmed) return;

    try {
      const response = await friendService.cancelFriendRequest(receiverId, receiverName);

      if (response.success) {
        this.sentRequests = this.sentRequests.filter((request) => request.id !== receiverId);
        this.updateSentRequestsBox();
        this.showNotification(`${receiverName}님에게 보낸 친구 요청을 취소했습니다.`);
      } else {
        this.showNotification(`친구 요청 취소 실패: ${response.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("친구 요청 취소 오류:", error);
      this.showNotification("친구 요청 취소 중 오류가 발생했습니다.");
    }
  }

  public destroy(): void {
    friendWebSocketManager.disconnect();
  }
}
