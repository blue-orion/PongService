import { loadTemplate, TEMPLATE_PATHS } from "../../utils/template-loader";
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
  avatar?: string;
  relationId: string;
}

export class FriendComponent {
  private container: HTMLElement;
  private isCollapsed: boolean = false;
  private friends: Friend[] = [];
  private friendRequests: FriendRequest[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeWebSocket();
  }

  public async render(): Promise<void> {
    const template = await loadTemplate(TEMPLATE_PATHS.FRIEND);
    this.container.innerHTML = template;

    this.loadStyles();
    this.setupUserProfile();
    await this.loadFriendsData();
    this.setupEventListeners();
    this.renderFriendItems();
    this.updateFriendList();
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

    switch (type) {
      case "request":
        // 새로운 친구 요청 수신
        this.showNotification(`새로운 친구 요청: ${payload.message}`);
        this.loadFriendsData(); // 친구 요청 목록 새로고침
        break;

      case "accepted":
        // 친구 요청 수락됨
        this.showNotification(`친구 요청이 수락되었습니다: ${payload.message}`);
        this.loadFriendsData(); // 친구 목록 새로고침
        break;

      case "rejected":
        // 친구 요청 거절됨
        this.showNotification(`친구 요청이 거절되었습니다: ${payload.message}`);
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
    // 간단한 알림 표시 (나중에 토스트 알림으로 개선 가능)
    console.log("친구 알림:", message);

    // 브라우저 알림 API 사용 (권한이 있는 경우)
    if (Notification.permission === "granted") {
      new Notification("친구 알림", {
        body: message,
        icon: "/favicon.ico",
      });
    }
  }

  private setupUserProfile(): void {
    // 토큰에서 사용자 정보 추출 또는 기본값 사용
    const tokens = AuthManager.getTokens();
    let username = "사용자";

    if (tokens?.accessToken) {
      try {
        // JWT 토큰의 payload 부분 디코딩 (간단한 방법)
        const payload = JSON.parse(atob(tokens.accessToken.split(".")[1]));
        username = payload.username || payload.sub || "사용자";
      } catch (error) {
        console.log("토큰 디코딩 실패, 기본 사용자명 사용");
      }
    }

    const nicknameElement = this.container.querySelector("#userNickname") as HTMLElement;
    if (nicknameElement) {
      nicknameElement.textContent = username;
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
    } catch (error) {
      console.error("친구 데이터 로드 실패:", error);
      this.friends = [];
      this.friendRequests = [];
      this.updateFriendList();
      this.renderFriendItems();
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
      relationId: friend.id.toString(),
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
    } else if ((response.data as any).content && Array.isArray((response.data as any).content)) {
      requestsArray = (response.data as any).content;
    }

    this.friendRequests = requestsArray.map((request: any) => ({
      id: request.id || request.relationId || "unknown",
      name: request.name || request.username || request.nickname || "Unknown",
      avatar: request.avatar || request.profile_image,
      relationId: request.relationId || request.id || "unknown",
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
    // 토글 버튼
    const toggleBtn = this.container.querySelector("#friendToggleBtn");
    toggleBtn?.addEventListener("click", () => this.toggleSidebar());

    // 친구 추가
    const addFriendBtn = this.container.querySelector("#addFriendBtn");
    const addFriendInput = this.container.querySelector("#addFriendInput") as HTMLInputElement;

    addFriendBtn?.addEventListener("click", () => this.addFriend(addFriendInput.value));
    addFriendInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.addFriend(addFriendInput.value);
      }
    });

    // 친구 요청 수락/거절
    this.container.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains("accept-btn")) {
        const friendItem = target.closest(".friend-item");
        const friendName = friendItem?.querySelector(".friend-name")?.textContent;
        if (friendName) {
          this.acceptFriendRequest(friendName);
        }
      }

      if (target.classList.contains("reject-btn")) {
        const friendItem = target.closest(".friend-item");
        const friendName = friendItem?.querySelector(".friend-name")?.textContent;
        if (friendName) {
          this.rejectFriendRequest(friendName);
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

  private toggleSidebar(): void {
    const sidebar = this.container.querySelector(".friend-sidebar");

    this.isCollapsed = !this.isCollapsed;

    if (this.isCollapsed) {
      sidebar?.classList.add("collapsed");
    } else {
      sidebar?.classList.remove("collapsed");
    }
  }

  private renderFriendItems(): void {
    console.log("renderFriendItems 호출됨, 친구 수:", this.friends.length);
    console.log("친구 목록 데이터:", this.friends);

    // 온라인 친구들 렌더링
    const onlineFriends = this.friends.filter((f) => f.status !== "offline");
    console.log("온라인 친구 수:", onlineFriends.length);

    // 더 구체적인 선택자 사용
    const friendSections = this.container.querySelectorAll(".friend-section");
    console.log("친구 섹션 개수:", friendSections.length);

    const onlineSection = friendSections[0]; // 첫 번째 섹션 (온라인)
    const onlineList = onlineSection?.querySelector(".friend-list");
    console.log("온라인 리스트 엘리먼트:", onlineList);

    if (onlineList) {
      if (onlineFriends.length === 0) {
        onlineList.innerHTML = '<div class="no-friends">온라인 친구가 없습니다</div>';
      } else {
        const onlineHTML = onlineFriends
          .map(
            (friend) => `
          <div class="friend-item online">
            <div class="friend-avatar"></div>
            <div class="friend-info">
              <div class="friend-name">${friend.name}</div>
              <div class="friend-status">${friend.status === "in-game" ? "게임 중" : "대기 중"}</div>
            </div>
            <div class="friend-actions">
              <button class="action-btn message-btn" title="메시지">💬</button>
              <button class="action-btn invite-btn" title="게임 초대">🎮</button>
            </div>
          </div>
        `
          )
          .join("");
        console.log("온라인 친구 HTML:", onlineHTML);
        onlineList.innerHTML = onlineHTML;
      }
    }

    // 오프라인 친구들 렌더링
    const offlineFriends = this.friends.filter((f) => f.status === "offline");
    console.log("오프라인 친구 수:", offlineFriends.length);
    console.log("오프라인 친구 데이터:", offlineFriends);

    const offlineSection = friendSections[1]; // 두 번째 섹션 (오프라인)
    const offlineList = offlineSection?.querySelector(".friend-list");
    console.log("오프라인 리스트 엘리먼트:", offlineList);
    console.log("오프라인 섹션:", offlineSection);

    if (offlineList) {
      if (offlineFriends.length === 0) {
        console.log("오프라인 친구가 없어서 메시지 표시");
        offlineList.innerHTML = '<div class="no-friends">오프라인 친구가 없습니다</div>';
      } else {
        console.log("오프라인 친구 HTML 생성 시작");
        const offlineHTML = offlineFriends
          .map((friend) => {
            console.log("오프라인 친구 아이템 생성:", friend);
            return `
          <div class="friend-item offline">
            <div class="friend-avatar"></div>
            <div class="friend-info">
              <div class="friend-name">${friend.name}</div>
              <div class="friend-status">오프라인</div>
            </div>
          </div>
        `;
          })
          .join("");
        console.log("오프라인 친구 HTML:", offlineHTML);
        offlineList.innerHTML = offlineHTML;
        console.log("오프라인 친구 HTML 설정 완료");
      }
    } else {
      console.error("오프라인 리스트 엘리먼트를 찾을 수 없음");
    }

    // 친구 요청들 렌더링
    const requestSection = friendSections[2]; // 세 번째 섹션 (친구 요청)
    const requestList = requestSection?.querySelector(".friend-list");
    console.log("친구 요청 리스트 엘리먼트:", requestList);

    if (requestList) {
      if (this.friendRequests.length === 0) {
        requestList.innerHTML = '<div class="no-friends">받은 친구 요청이 없습니다</div>';
      } else {
        const requestHTML = this.friendRequests
          .map(
            (request) => `
          <div class="friend-item request">
            <div class="friend-avatar"></div>
            <div class="friend-info">
              <div class="friend-name">${request.name}</div>
              <div class="friend-status">친구 요청</div>
            </div>
            <div class="friend-actions">
              <button class="action-btn accept-btn" title="수락">✓</button>
              <button class="action-btn reject-btn" title="거절">✗</button>
            </div>
          </div>
        `
          )
          .join("");
        console.log("친구 요청 HTML:", requestHTML);
        requestList.innerHTML = requestHTML;
      }
    }
  }

  private updateFriendList(): void {
    // 온라인/오프라인 친구 목록 업데이트
    const onlineFriends = this.friends.filter((f) => f.status !== "offline");
    const offlineFriends = this.friends.filter((f) => f.status === "offline");

    console.log("updateFriendList 호출됨");
    console.log("온라인 친구 수:", onlineFriends.length);
    console.log("오프라인 친구 수:", offlineFriends.length);

    const friendSections = this.container.querySelectorAll(".friend-section");
    console.log("친구 섹션 개수:", friendSections.length);

    // 온라인 섹션 업데이트
    const onlineSection = friendSections[0];
    const onlineTitle = onlineSection?.querySelector(".section-title");
    if (onlineTitle) {
      onlineTitle.textContent = `온라인 - ${onlineFriends.length}`;
      console.log("온라인 제목 업데이트:", onlineTitle.textContent);
    }

    // 오프라인 섹션 업데이트
    const offlineSection = friendSections[1];
    const offlineTitle = offlineSection?.querySelector(".section-title");
    if (offlineTitle) {
      offlineTitle.textContent = `오프라인 - ${offlineFriends.length}`;
      console.log("오프라인 제목 업데이트:", offlineTitle.textContent);
    }

    // 친구 요청 섹션 업데이트
    const requestSection = friendSections[2];
    const requestTitle = requestSection?.querySelector(".section-title");
    if (requestTitle) {
      requestTitle.textContent = `받은 요청 - ${this.friendRequests.length}`;
      console.log("친구 요청 제목 업데이트:", requestTitle.textContent);
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

  private async acceptFriendRequest(friendName: string): Promise<void> {
    const request = this.friendRequests.find((r) => r.name === friendName);
    if (!request) return;

    try {
      const response = await friendService.acceptFriendRequest(request.relationId);

      if (response.success) {
        // 실제 데이터 다시 로드
        await this.loadFriendsData();
        this.updateFriendList();
        this.renderFriendItems();
        alert(`${friendName}의 친구 요청을 수락했습니다.`);
      } else {
        alert(`친구 요청 수락 실패: ${response.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("친구 요청 수락 오류:", error);
      alert("친구 요청 수락 중 오류가 발생했습니다.");
    }
  }

  private async rejectFriendRequest(friendName: string): Promise<void> {
    const request = this.friendRequests.find((r) => r.name === friendName);
    if (!request) return;

    try {
      const response = await friendService.rejectFriendRequest(request.relationId);

      if (response.success) {
        // 실제 데이터 다시 로드
        await this.loadFriendsData();
        this.updateFriendList();
        this.renderFriendItems();
        alert(`${friendName}의 친구 요청을 거절했습니다.`);
      } else {
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

  private inviteToGame(friendName: string): void {
    console.log(`게임 초대: ${friendName}`);
    // TODO: 게임 초대 로직
    alert(`${friendName}을 게임에 초대했습니다.`);
  }

  public destroy(): void {
    this.container.innerHTML = "";
    // 웹소켓 연결 해제
    friendWebSocketManager.disconnect();
  }
}
