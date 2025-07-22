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

export class FriendComponent {
  private container: HTMLElement;
  private friends: Friend[] = [];
  private friendRequests: FriendRequest[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    // 웹소켓 연결 활성화
    this.initializeWebSocket();
  }

  private getTemplate(): string {
    return `
<div class="friend-sidebar">
  <!-- 친구창 헤더 -->
  <div class="friend-header">
    <h3>친구 목록</h3>
  </div>

  <!-- 사용자 프로필 -->
  <div class="user-profile">
    <div class="user-avatar" id="userAvatar"></div>
    <div class="user-info">
      <div class="user-nickname" id="userNickname">사용자</div>
      <div class="user-username" id="userUsername">@username</div>
      <div class="user-status">온라인</div>
    </div>
    <!-- 친구 요청 보관함 -->
    <div class="friend-requests-box" id="friendRequestsBox">
      <button class="requests-toggle" id="requestsToggle">
        <span class="requests-icon">📮</span>
        <span class="requests-count" id="requestsCount">0</span>
      </button>
      <div class="requests-dropdown" id="requestsDropdown">
        <div class="requests-header">받은 친구 요청</div>
        <div class="requests-list" id="requestsList">
          <!-- 친구 요청들이 여기에 동적으로 추가됩니다 -->
        </div>
      </div>
    </div>
  </div>

  <!-- 친구창 내용 -->
  <div class="friend-content" id="friendContent">
    <!-- 친구 추가 -->
    <div class="friend-add-section">
      <div class="add-friend-form">
        <input type="text" placeholder="사용자명으로 친구 추가" class="add-friend-input" id="addFriendInput" />
        <button class="add-friend-btn" id="addFriendBtn">+</button>
      </div>
    </div>

    <!-- 온라인 친구들 -->
    <div class="friend-section"></div>

    <!-- 오프라인 친구들 -->
    <div class="friend-section">
      <div class="section-title">오프라인 - 1</div>
      <div class="friend-list">
        <div class="friend-item offline">
          <div class="friend-avatar"></div>
          <div class="friend-info">
            <div class="friend-name">gitkim</div>
            <div class="friend-status">오프라인</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
    `;
  }

  public async render(): Promise<void> {
    this.container.innerHTML = this.getTemplate();

    this.loadStyles();

    // 사용자 프로필 설정
    this.setupUserProfile();
    await this.loadFriendsData();
    this.setupEventListeners();
    this.renderFriendItems();
    this.updateFriendList();
    this.updateRequestsBox(); // 친구 요청 보관함 업데이트 추가

    // 브라우저 알림 권한 요청
    this.requestNotificationPermission();
  }

  private initializeWebSocket(): void {
    // 친구 웹소켓 연결
    friendWebSocketManager.connect();

    // 친구 알림 수신 리스너
    friendWebSocketManager.onFriendNotificationReceived((notification) => {
      this.handleFriendNotification(notification);
    });

    // 연결 상태 변경 리스너
    friendWebSocketManager.onConnectionStatusChange((status) => {
      console.log("친구 웹소켓 연결 상태:", status);
    });

    // 오류 리스너
    friendWebSocketManager.onErrorOccurred((error) => {
      console.error("친구 웹소켓 오류:", error);
    });
  }

  private handleFriendNotification(notification: any): void {
    const { type, payload } = notification;
    console.log(`친구 알림 처리: ${type}`, payload);

    switch (type) {
      case "request":
        // 새로운 친구 요청 수신
        this.showNotification(`새로운 친구 요청: ${payload.message}`);
        this.loadFriendsData(); // 친구 요청 목록 새로고침

        // 친구 요청 개수 업데이트를 위해 UI 새로고침
        this.updateRequestsBox();
        break;

      case "accepted":
        // 친구 요청 수락됨
        this.showNotification(`친구 요청이 수락되었습니다: ${payload.message}`);
        this.loadFriendsData(); // 친구 목록과 요청 목록 모두 새로고침
        break;

      case "rejected":
        // 친구 요청 거절됨
        this.showNotification(`친구 요청이 거절되었습니다: ${payload.message}`);
        this.loadFriendsData(); // 요청 목록 새로고침
        break;

      case "cancelled":
        // 친구 요청 취소됨
        this.showNotification(`친구 요청이 취소되었습니다: ${payload.message}`);
        this.loadFriendsData(); // 친구 요청 목록 새로고침
        break;

      default:
        console.log("알 수 없는 친구 알림:", notification);
    }
  }

  private showNotification(message: string): void {
    // 콘솔에 로그
    console.log("친구 알림:", message);

    // 브라우저 알림 권한 확인 및 요청
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          this.displayBrowserNotification(message);
        }
      });
    } else if (Notification.permission === "granted") {
      this.displayBrowserNotification(message);
    }

    // UI에서 시각적 피드백 제공 (예: 친구 요청 개수 뱃지 업데이트)
    this.updateRequestsBox();
  }

  private displayBrowserNotification(message: string): void {
    new Notification("친구 알림", {
      body: message,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "friend-notification", // 같은 태그의 알림은 덮어씀
      requireInteraction: false, // 자동으로 사라짐
      silent: false,
    });
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

  private loadStyles(): void {
    // 이미 로드되었는지 확인
    if (!document.querySelector('link[href*="friend.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/src/styles/friend.css";
      document.head.appendChild(link);
    }
  }

  private async loadFriendsData(): Promise<void> {
    try {
      await this.loadFriends();
      await this.loadFriendRequests();
      this.renderFriendItems();
      this.updateFriendList();
      this.updateRequestsBox(); // 친구 요청 보관함 업데이트 추가
    } catch (error) {
      console.error("친구 데이터 로드 실패:", error);
      this.friends = [];
      this.friendRequests = [];
      this.updateFriendList();
      this.renderFriendItems();
      this.updateRequestsBox(); // 에러 시에도 보관함 업데이트
    }
  }

  private async loadFriends(): Promise<void> {
    const response = await friendService.getFriendsList();

    if (!response.success || !response.data) {
      this.friends = [];
      return;
    }

    // 중첩된 응답 구조 처리
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
      relationId: friend.relationId?.toString() || friend.id.toString(), // relationId 우선, 없으면 id 사용
    }));
  }

  private async loadFriendRequests(): Promise<void> {
    const response = await friendService.getReceivedRequests();

    if (!response.success || !response.data) {
      this.friendRequests = [];
      return;
    }

    // 다양한 응답 구조 처리
    let requestsArray: any[] = [];
    if (Array.isArray(response.data)) {
      requestsArray = response.data;
    } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
      requestsArray = (response.data as any).data;
    } else if ((response.data as any).content && Array.isArray((response.data as any).content)) {
      requestsArray = (response.data as any).content;
    } else {
      console.warn("친구 요청 데이터 구조를 인식할 수 없음:", response.data);
      requestsArray = [];
    }

    this.friendRequests = requestsArray.map((request: any) => ({
      id: request.id?.toString() || "unknown",
      name:
        request.sender?.nickname || request.sender?.username || request.sender?.name || `사용자 ${request.sender_id}`,
      username: request.sender?.username || request.sender?.name || `사용자 ${request.sender_id}`,
      avatar: request.sender?.profile_image || request.sender?.avatar || null,
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
      requestsDropdown?.classList.toggle("active");
    });

    // 드롭다운 외부 클릭시 닫기
    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target as Node)) {
        requestsDropdown?.classList.remove("active");
      }
    });

    // 친구 추가
    const addFriendBtn = this.container.querySelector("#addFriendBtn");
    const addFriendInput = this.container.querySelector("#addFriendInput") as HTMLInputElement;

    addFriendBtn?.addEventListener("click", () => this.addFriend(addFriendInput.value));
    addFriendInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.addFriend(addFriendInput.value);
      }
    });

    // 친구 요청 수락/거절 (새로운 보관함 방식)
    this.container.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains("accept-btn")) {
        const requestItem = target.closest(".request-item");
        const relationId = requestItem?.getAttribute("data-relation-id");
        const requestName = requestItem?.querySelector(".request-name")?.textContent;
        if (relationId && requestName) {
          this.acceptFriendRequestById(relationId, requestName);
        }
      }

      if (target.classList.contains("reject-btn")) {
        const requestItem = target.closest(".request-item");
        const relationId = requestItem?.getAttribute("data-relation-id");
        const requestName = requestItem?.querySelector(".request-name")?.textContent;
        if (relationId && requestName) {
          this.rejectFriendRequestById(relationId, requestName);
        }
      }

      if (target.classList.contains("message-btn")) {
        const friendItem = target.closest(".friend-item");
        const friendName = friendItem?.querySelector(".friend-name")?.textContent;
        if (friendName) {
          this.sendMessage(friendName);
        }
      }

      if (target.classList.contains("invite-btn")) {
        const friendItem = target.closest(".friend-item");
        const friendName = friendItem?.querySelector(".friend-name")?.textContent;
        if (friendName) {
          this.inviteToGame(friendName);
        }
      }

      if (target.classList.contains("delete-btn")) {
        e.preventDefault();
        e.stopPropagation();

        const relationId = target.getAttribute("data-relation-id");
        const friendId = target.getAttribute("data-friend-id");
        const friendItem = target.closest(".friend-item");
        const friendName = friendItem?.querySelector(".friend-name")?.textContent;

        if (relationId && friendId && friendName) {
          this.deleteFriend(relationId, friendId, friendName);
        }
      }
    });

    // 섹션 제목 클릭으로 토글
    this.container.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("section-title")) {
        const section = target.closest(".friend-section");
        const friendList = section?.querySelector(".friend-list");
        friendList?.classList.toggle("collapsed");
      }
    });
  }

  private renderFriendItems(): void {
    // 온라인 친구들 렌더링
    const onlineFriends = this.friends.filter((f) => f.status !== "offline");
    const friendSections = this.container.querySelectorAll(".friend-section");

    const onlineSection = friendSections[0]; // 첫 번째 섹션 (온라인)
    const onlineList = onlineSection?.querySelector(".friend-list");

    if (onlineList) {
      if (onlineFriends.length === 0) {
        onlineList.innerHTML = '<div class="no-friends">온라인 친구가 없습니다</div>';
      } else {
        const onlineHTML = onlineFriends
          .map(
            (friend) => `
          <div class="friend-item online" data-friend-id="${friend.id}" data-relation-id="${friend.relationId}">
            <div class="friend-avatar"></div>
            <div class="friend-info">
              <div class="friend-name">${friend.name}</div>
              <div class="friend-username">${friend.username || friend.name}</div>
              <div class="friend-status">${friend.status === "in-game" ? "게임 중" : "대기 중"}</div>
            </div>
            <div class="friend-actions">
              <button class="action-btn message-btn" title="메시지">💬</button>
              <button class="action-btn invite-btn" title="게임 초대">🎮</button>
              <button class="action-btn delete-btn" title="친구 삭제" data-friend-id="${friend.id}" data-relation-id="${
              friend.relationId
            }">🗑️</button>
            </div>
          </div>
        `
          )
          .join("");
        onlineList.innerHTML = onlineHTML;
      }
    }

    // 오프라인 친구들 렌더링
    const offlineFriends = this.friends.filter((f) => f.status === "offline");
    const offlineSection = friendSections[1]; // 두 번째 섹션 (오프라인)
    const offlineList = offlineSection?.querySelector(".friend-list");

    if (offlineList) {
      if (offlineFriends.length === 0) {
        offlineList.innerHTML = '<div class="no-friends">오프라인 친구가 없습니다</div>';
      } else {
        const offlineHTML = offlineFriends
          .map(
            (friend) => `
          <div class="friend-item offline" data-friend-id="${friend.id}" data-relation-id="${friend.relationId}">
            <div class="friend-avatar"></div>
            <div class="friend-info">
              <div class="friend-name">${friend.name}</div>
              <div class="friend-username">${friend.username || friend.name}</div>
              <div class="friend-status">오프라인</div>
            </div>
            <div class="friend-actions">
              <button class="action-btn delete-btn" title="친구 삭제" data-friend-id="${friend.id}" data-relation-id="${
              friend.relationId
            }">🗑️</button>
            </div>
          </div>
        `
          )
          .join("");
        offlineList.innerHTML = offlineHTML;
      }
    }

    // 친구 요청 보관함 업데이트
    this.updateRequestsBox();
  }

  private updateFriendList(): void {
    // 온라인/오프라인 친구 목록 업데이트
    const onlineFriends = this.friends.filter((f) => f.status !== "offline");
    const offlineFriends = this.friends.filter((f) => f.status === "offline");
    const friendSections = this.container.querySelectorAll(".friend-section");

    // 온라인 섹션 업데이트
    const onlineSection = friendSections[0];
    const onlineTitle = onlineSection?.querySelector(".section-title");
    if (onlineTitle) {
      onlineTitle.textContent = `온라인 - ${onlineFriends.length}`;
    }

    // 오프라인 섹션 업데이트
    const offlineSection = friendSections[1];
    const offlineTitle = offlineSection?.querySelector(".section-title");
    if (offlineTitle) {
      offlineTitle.textContent = `오프라인 - ${offlineFriends.length}`;
    }
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
        requestsList.innerHTML = '<div class="no-requests">받은 친구 요청이 없습니다</div>';
      } else {
        const requestsHTML = this.friendRequests
          .map(
            (request) => `
          <div class="request-item" data-relation-id="${request.relationId}">
            <div class="request-avatar"></div>
            <div class="request-info">
              <div class="request-name">${request.name}</div>
              <div class="request-username">${request.username}</div>
              <div class="request-status">친구 요청</div>
            </div>
            <div class="request-actions">
              <button class="request-btn accept-btn" title="수락">✓</button>
              <button class="request-btn reject-btn" title="거절">✗</button>
            </div>
          </div>
        `
          )
          .join("");
        requestsList.innerHTML = requestsHTML;
      }
    }
  }

  private async addFriend(username: string): Promise<void> {
    if (!username.trim()) return;

    try {
      const response = await friendService.requestFriend(username);

      if (response.success) {
        // 입력 필드 초기화
        const input = this.container.querySelector("#addFriendInput") as HTMLInputElement;
        if (input) input.value = "";

        alert(`${username}에게 친구 요청을 보냈습니다.`);
      } else {
        alert(`친구 요청 실패: ${response.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("친구 요청 오류:", error);
      alert("친구 요청 중 오류가 발생했습니다.");
    }
  }

  private async acceptFriendRequestById(relationId: string, friendName: string): Promise<void> {
    try {
      const response = await friendService.acceptFriendRequest(relationId);

      if (response.success) {
        console.log(`친구 요청 수락 성공: ${friendName}`);

        // 친구 요청 목록에서 해당 요청 제거
        this.friendRequests = this.friendRequests.filter((request) => request.relationId !== relationId);

        // 전체 데이터 다시 로드하여 새 친구를 친구 목록에 추가
        await this.loadFriendsData();

        // 드롭다운 닫기
        const requestsDropdown = this.container.querySelector("#requestsDropdown");
        requestsDropdown?.classList.remove("active");

        // 성공 알림 표시
        this.showNotification(`${friendName}님이 친구 목록에 추가되었습니다.`);
        console.log(`친구 목록에 추가됨: ${friendName}`);
      } else {
        console.error("친구 요청 수락 실패:", response.message);
        alert(`친구 요청 수락 실패: ${response.message || "알 수 없는 오류"}`);
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
        console.log(`친구 요청 거절 성공: ${friendName}`);

        // 친구 요청 목록에서 해당 요청 제거
        this.friendRequests = this.friendRequests.filter((request) => request.relationId !== relationId);

        // 전체 데이터 다시 로드
        await this.loadFriendsData();

        // 드롭다운 닫기
        const requestsDropdown = this.container.querySelector("#requestsDropdown");
        requestsDropdown?.classList.remove("active");

        // 성공 알림 표시
        this.showNotification(`${friendName}님의 친구 요청을 거절했습니다.`);
        console.log(`친구 요청 거절됨: ${friendName}`);
      } else {
        console.error("친구 요청 거절 실패:", response.message);
        alert(`친구 요청 거절 실패: ${response.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("친구 요청 거절 오류:", error);
      alert("친구 요청 거절 중 오류가 발생했습니다.");
    }
  }

  private sendMessage(friendName: string): void {
    console.log(`메시지 보내기: ${friendName}`);
    // TODO: 메시지 창 열기
    alert(`${friendName}에게 메시지를 보냅니다.`);
  }

  private async deleteFriend(relationId: string, friendId: string, friendName: string): Promise<void> {
    // 확인 대화상자
    const confirmed = confirm(`정말로 ${friendName}님을 친구에서 삭제하시겠습니까?`);
    if (!confirmed) {
      return;
    }

    try {
      // 인증 확인
      const tokens = AuthManager.getTokens();
      if (!tokens?.accessToken) {
        alert("인증 정보가 없습니다. 다시 로그인해주세요.");
        return;
      }

      console.log(`친구 삭제 요청: friendId=${friendId}, friendName=${friendName}`);
      const response = await friendService.deleteFriend(friendId);

      if (response.success) {
        // 친구 목록에서 제거
        this.friends = this.friends.filter((friend) => friend.relationId !== relationId);

        // UI 새로고침
        this.renderFriendItems();
        this.updateFriendList();

        // 성공 알림
        this.showNotification(`${friendName}님을 친구에서 삭제했습니다.`);
        console.log(`친구 삭제 성공: ${friendName}`);
      } else {
        console.error("친구 삭제 실패:", response.message);
        alert(`친구 삭제 실패: ${response.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("친구 삭제 오류:", error);
      alert("친구 삭제 중 오류가 발생했습니다.");
    }
  }

  private inviteToGame(friendName: string): void {
    console.log(`게임 초대: ${friendName}`);
    // TODO: 게임 초대 로직
    alert(`${friendName}을 게임에 초대했습니다.`);
  }

  public destroy(): void {
    // 웹소켓 연결만 해제하고 UI는 유지
    friendWebSocketManager.disconnect();
  }
}
