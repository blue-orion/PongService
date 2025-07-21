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

  public async render(): Promise<void> {
    const template = await loadTemplate(TEMPLATE_PATHS.FRIEND);
    this.container.innerHTML = template;

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
        // 새로운 친구 요청을 로컬 배열에 추가
        const requestData = payload.requestData || payload;
        const newRequest: FriendRequest = {
          id: requestData.id || requestData.sender_id || Date.now().toString(),
          name:
            requestData.name ||
            requestData.sender?.nickname ||
            requestData.sender?.username ||
            requestData.username ||
            "알 수 없는 사용자",
          username: requestData.username || requestData.sender?.username || requestData.sender?.name || "unknown",
          relationId: requestData.relationId || requestData.id || Date.now().toString(),
        };

        // 중복 체크 후 추가
        const isDuplicate = this.friendRequests.some(
          (req) => req.relationId === newRequest.relationId || req.username === newRequest.username
        );

        if (!isDuplicate) {
          this.friendRequests.push(newRequest);
          console.log("새로운 친구 요청 추가됨:", newRequest);

          // UI 즉시 업데이트
          this.updateRequestsBox();

          // 알림 표시
          this.showNotification(`새로운 친구 요청: ${newRequest.name}`);
        }
        break;

      case "accepted":
        // 친구 요청 수락됨 - 보낸 요청이 수락된 경우
        // 새 친구를 친구 목록에 추가
        const friendData = payload.friendData || payload;
        const newFriend: Friend = {
          id: friendData.id || friendData.friend_id || Date.now().toString(),
          name: friendData.name || friendData.nickname || friendData.username || "새 친구",
          username: friendData.username || friendData.name || "unknown",
          status: "offline" as "online" | "offline" | "in-game",
          relationId: friendData.relationId || friendData.id || Date.now().toString(),
        };

        // 중복 체크 후 추가
        const isDuplicateFriend = this.friends.some(
          (friend) => friend.id === newFriend.id || friend.username === newFriend.username
        );

        if (!isDuplicateFriend) {
          this.friends.push(newFriend);
          console.log("새로운 친구 추가됨:", newFriend);

          // UI 즉시 업데이트
          this.renderFriendItems();
          this.updateFriendList();

          // 알림 표시
          this.showNotification(`${newFriend.name}님이 친구 요청을 수락했습니다.`);
        }
        break;

      case "rejected":
        // 친구 요청 거절됨
        this.showNotification(`친구 요청이 거절되었습니다: ${payload.message || ""}`);
        // 거절된 경우 특별한 UI 변경 없음
        break;

      case "cancelled":
        // 친구 요청 취소됨
        // 취소된 요청을 로컬에서 제거
        const requestId = payload.relationId || payload.requestId || payload.id;
        const username = payload.username || payload.sender?.username;

        if (requestId || username) {
          const beforeCount = this.friendRequests.length;
          this.friendRequests = this.friendRequests.filter(
            (req) => req.relationId !== requestId && req.username !== username && req.id !== requestId
          );

          if (this.friendRequests.length < beforeCount) {
            console.log("친구 요청 취소됨:", { requestId, username });
            // UI 즉시 업데이트
            this.updateRequestsBox();

            // 알림 표시
            this.showNotification(`친구 요청이 취소되었습니다.`);
          }
        }
        break;

      case "deleted":
        // 친구 삭제됨
        this.handleFriendDeleted(payload);
        this.showNotification(`친구가 삭제되었습니다: ${payload.message || ""}`);
        break;

      case "status_changed":
        // 친구 상태 변경 (온라인/오프라인/게임중)
        this.handleFriendStatusChanged(payload);
        break;

      case "online":
        // 친구 온라인 상태
        this.handleFriendStatusChanged({ ...payload, status: "online" });
        break;

      case "offline":
        // 친구 오프라인 상태
        this.handleFriendStatusChanged({ ...payload, status: "offline" });
        break;

      case "in_game":
        // 친구 게임중 상태
        this.handleFriendStatusChanged({ ...payload, status: "in-game" });
        break;

      default:
        console.log("알 수 없는 친구 알림:", notification);
    }
  }

  private showNotification(message: string, updateUI: boolean = false): void {
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

    // UI 업데이트가 필요한 경우에만 호출
    if (updateUI) {
      this.updateRequestsBox();
    }
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

  private handleFriendDeleted(payload: any): void {
    // 삭제된 친구의 ID나 username을 추출
    const deletedFriendId = payload.friendId || payload.deletedFriendId || payload.id;
    const deletedFriendName = payload.friendName || payload.username || payload.nickname;

    if (deletedFriendId) {
      // 로컬 친구 목록에서 해당 친구 제거
      this.friends = this.friends.filter(
        (friend) => friend.id !== deletedFriendId.toString() && friend.username !== deletedFriendName
      );

      // UI 즉시 업데이트 (API 재호출 없이)
      this.renderFriendItems();
      this.updateFriendList();

      console.log(`친구 목록에서 ${deletedFriendName || deletedFriendId} 제거됨`);
    }
  }

  private handleFriendStatusChanged(payload: any): void {
    const friendId = payload.friendId || payload.userId || payload.id;
    const friendUsername = payload.username || payload.name;
    const newStatus = this.convertStatus(payload.status || "OFFLINE");

    if (friendId || friendUsername) {
      // 친구 목록에서 해당 친구 찾아서 상태 업데이트
      const friendIndex = this.friends.findIndex(
        (friend) => friend.id === friendId?.toString() || friend.username === friendUsername
      );

      if (friendIndex !== -1) {
        const oldStatus = this.friends[friendIndex].status;
        this.friends[friendIndex].status = newStatus;

        // 상태가 실제로 변경된 경우에만 UI 업데이트와 알림
        if (oldStatus !== newStatus) {
          const friendName = this.friends[friendIndex].name;

          // UI 즉시 업데이트
          this.renderFriendItems();
          this.updateFriendList();

          // 상태 변경 알림 (조용하게)
          const statusText = newStatus === "online" ? "온라인" : newStatus === "in-game" ? "게임중" : "오프라인";
          console.log(`${friendName}님이 ${statusText} 상태로 변경됨`);

          // 온라인 상태로 변경시에만 알림 표시
          if (newStatus === "online" && oldStatus === "offline") {
            this.showNotification(`${friendName}님이 온라인 상태입니다.`);
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

    console.log("친구 목록 응답:", response);

    if (!response.success || !response.data) {
      this.friends = [];
      console.log("친구 목록 로드 실패 또는 데이터 없음");
      return;
    }

    // 중첩된 응답 구조 처리
    let friendsData: any[] = [];
    if (response.data.friends && Array.isArray(response.data.friends)) {
      friendsData = response.data.friends;
    } else if ((response.data as any).data?.friends && Array.isArray((response.data as any).data.friends)) {
      friendsData = (response.data as any).data.friends;
    }

    console.log("원본 친구 데이터:", friendsData);

    this.friends = friendsData.map((friend: any) => ({
      id: friend.id.toString(),
      name: friend.nickname || friend.username,
      username: friend.username,
      status: this.convertStatus(friend.status),
      avatar: friend.profile_image,
      relationId: friend.relationId?.toString() || friend.id.toString(), // relationId 우선, 없으면 id 사용
    }));

    console.log("변환된 친구 목록:", this.friends);
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
      console.log("Requests toggle clicked");
      e.stopPropagation();

      if (requestsDropdown) {
        const isVisible = requestsDropdown.classList.contains("opacity-100");
        if (isVisible) {
          // 숨기기
          requestsDropdown.classList.remove("opacity-100", "translate-y-0", "pointer-events-auto");
          requestsDropdown.classList.add("opacity-0", "-translate-y-2.5", "pointer-events-none");
        } else {
          // 보이기
          requestsDropdown.classList.remove("opacity-0", "-translate-y-2.5", "pointer-events-none");
          requestsDropdown.classList.add("opacity-100", "translate-y-0", "pointer-events-auto");
        }
      }
    });

    // 드롭다운 외부 클릭시 닫기
    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target as Node) && requestsDropdown) {
        requestsDropdown.classList.remove("opacity-100", "translate-y-0", "pointer-events-auto");
        requestsDropdown.classList.add("opacity-0", "-translate-y-2.5", "pointer-events-none");
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
      console.log("Click event target:", target, "Text content:", target.textContent);

      // 친구 요청 수락/거절 버튼 처리
      if (target.textContent === "✓") {
        console.log("Accept button clicked");
        const requestItem = target.closest("[data-relation-id]");
        const relationId = requestItem?.getAttribute("data-relation-id");
        const nameElement = requestItem?.querySelector(".text-gray-800");
        const requestName = nameElement?.textContent;
        console.log("Request data:", { relationId, requestName });
        if (relationId && requestName) {
          this.acceptFriendRequestById(relationId, requestName);
        }
      }

      if (target.textContent === "✗") {
        console.log("Reject button clicked");
        const requestItem = target.closest("[data-relation-id]");
        const relationId = requestItem?.getAttribute("data-relation-id");
        const nameElement = requestItem?.querySelector(".text-gray-800");
        const requestName = nameElement?.textContent;
        console.log("Request data:", { relationId, requestName });
        if (relationId && requestName) {
          this.rejectFriendRequestById(relationId, requestName);
        }
      }

      // 친구 버튼들 처리
      if (target.textContent === "💬") {
        console.log("Message button clicked");
        const friendItem = target.closest("[data-friend-id]");
        const nameElements = friendItem?.querySelectorAll(".text-white");
        const friendName = nameElements?.[0]?.textContent;
        console.log("Friend data:", { friendName });
        if (friendName) {
          this.sendMessage(friendName);
        }
      }

      if (target.textContent === "🎮") {
        console.log("Game invite button clicked");
        const friendItem = target.closest("[data-friend-id]");
        const nameElements = friendItem?.querySelectorAll(".text-white");
        const friendName = nameElements?.[0]?.textContent;
        console.log("Friend data:", { friendName });
        if (friendName) {
          this.inviteToGame(friendName);
        }
      }

      if (target.textContent === "🗑️") {
        console.log("Delete button clicked", target);
        e.preventDefault();
        e.stopPropagation();

        // 버튼에서 직접 속성 가져오기
        let relationId = target.getAttribute("data-relation-id");
        let friendId = target.getAttribute("data-friend-id");

        // 만약 버튼에 없다면 부모 요소에서 찾기
        if (!relationId || !friendId) {
          const friendItem = target.closest("[data-friend-id]");
          relationId = relationId || friendItem?.getAttribute("data-relation-id") || null;
          friendId = friendId || friendItem?.getAttribute("data-friend-id") || null;
        }

        const friendItem = target.closest("[data-friend-id]");
        const nameElements = friendItem?.querySelectorAll(".text-white");
        const friendName = nameElements?.[0]?.textContent;

        console.log("Delete data:", {
          relationId,
          friendId,
          friendName,
          buttonElement: target,
          friendItem: friendItem,
          nameElements: nameElements,
        });

        if (friendId) {
          this.deleteFriend(friendId, friendName || "알 수 없는 친구");
        } else {
          console.error("삭제에 필요한 데이터가 부족합니다:", { relationId, friendId, friendName });
          alert("삭제에 필요한 정보를 찾을 수 없습니다.");
        }
      }
    });
  }

  private renderFriendItems(): void {
    // 온라인 친구들 렌더링
    const onlineFriends = this.friends.filter((f) => f.status !== "offline");
    const onlineList = this.container.querySelector("#onlineList");
    const onlineTitle = this.container.querySelector("#onlineTitle");

    if (onlineTitle) {
      onlineTitle.textContent = `온라인 - ${onlineFriends.length}`;
    }

    if (onlineList) {
      if (onlineFriends.length === 0) {
        onlineList.innerHTML = '<div class="text-white/60 text-sm text-center p-4 italic">온라인 친구가 없습니다</div>';
      } else {
        const onlineHTML = onlineFriends
          .map(
            (friend) => `
          <div class="group flex items-center p-3 bg-white/10 rounded-lg transition-colors duration-200 cursor-pointer hover:bg-white/15" data-friend-id="${
            friend.id
          }" data-relation-id="${friend.relationId}">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 mr-3 relative after:absolute after:-bottom-0.5 after:-right-0.5 after:w-3 after:h-3 after:bg-green-500 after:border-2 after:border-white after:rounded-full"></div>
            <div class="flex-1">
              <div class="text-white font-medium text-sm mb-0.5">${friend.name}</div>
              <div class="text-white/60 text-xs font-normal mb-0.5">${friend.username || friend.name}</div>
              <div class="text-white/70 text-xs">${friend.status === "in-game" ? "게임 중" : "대기 중"}</div>
            </div>
            <div class="flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <button class="bg-white/20 border-0 text-white w-7 h-7 rounded cursor-pointer flex items-center justify-center text-xs transition-colors duration-200 hover:bg-white/30" title="메시지">💬</button>
              <button class="bg-white/20 border-0 text-white w-7 h-7 rounded cursor-pointer flex items-center justify-center text-xs transition-colors duration-200 hover:bg-white/30" title="게임 초대">🎮</button>
              <button class="bg-white/20 border-0 text-white w-7 h-7 rounded cursor-pointer flex items-center justify-center text-xs transition-all duration-200 hover:bg-red-500/80 hover:scale-110" title="친구 삭제" data-friend-id="${
                friend.id
              }" data-relation-id="${friend.relationId}">🗑️</button>
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
    const offlineList = this.container.querySelector("#offlineList");
    const offlineTitle = this.container.querySelector("#offlineTitle");

    if (offlineTitle) {
      offlineTitle.textContent = `오프라인 - ${offlineFriends.length}`;
    }

    if (offlineList) {
      if (offlineFriends.length === 0) {
        offlineList.innerHTML =
          '<div class="text-white/60 text-sm text-center p-4 italic">오프라인 친구가 없습니다</div>';
      } else {
        const offlineHTML = offlineFriends
          .map(
            (friend) => `
          <div class="group flex items-center p-3 bg-white/10 rounded-lg transition-colors duration-200 cursor-pointer hover:bg-white/15 opacity-60" data-friend-id="${
            friend.id
          }" data-relation-id="${friend.relationId}">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 mr-3 relative after:absolute after:-bottom-0.5 after:-right-0.5 after:w-3 after:h-3 after:bg-gray-500 after:border-2 after:border-white after:rounded-full"></div>
            <div class="flex-1">
              <div class="text-white font-medium text-sm mb-0.5">${friend.name}</div>
              <div class="text-white/60 text-xs font-normal mb-0.5">${friend.username || friend.name}</div>
              <div class="text-white/70 text-xs">오프라인</div>
            </div>
            <div class="flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <button class="bg-white/20 border-0 text-white w-7 h-7 rounded cursor-pointer flex items-center justify-center text-xs transition-all duration-200 hover:bg-red-500/80 hover:scale-110" title="친구 삭제" data-friend-id="${
                friend.id
              }" data-relation-id="${friend.relationId}">🗑️</button>
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

    // 온라인 섹션 업데이트
    const onlineTitle = this.container.querySelector("#onlineTitle");
    if (onlineTitle) {
      onlineTitle.textContent = `온라인 - ${onlineFriends.length}`;
    }

    // 오프라인 섹션 업데이트
    const offlineTitle = this.container.querySelector("#offlineTitle");
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
        requestsList.innerHTML =
          '<div class="p-5 px-4 text-center text-gray-500 text-sm">받은 친구 요청이 없습니다</div>';
      } else {
        const requestsHTML = this.friendRequests
          .map(
            (request) => `
          <div class="p-3 px-4 border-b border-white/10 flex items-center gap-2.5 transition-colors duration-200 hover:bg-indigo-500/5 last:border-b-0 last:rounded-b-xl" data-relation-id="${request.relationId}">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-teal-400 border-2 border-white/30"></div>
            <div class="flex-1">
              <div class="text-gray-800 font-semibold text-sm mb-0.5">${request.name}</div>
              <div class="text-gray-500 text-xs font-normal mb-0.5">${request.username}</div>
              <div class="text-gray-500 text-xs">친구 요청</div>
            </div>
            <div class="flex gap-1.5">
              <button class="w-7 h-7 border-0 rounded-md cursor-pointer flex items-center justify-center text-sm font-semibold transition-all duration-200 bg-green-500 text-white hover:bg-green-600 hover:scale-105" title="수락">✓</button>
              <button class="w-7 h-7 border-0 rounded-md cursor-pointer flex items-center justify-center text-sm font-semibold transition-all duration-200 bg-red-500 text-white hover:bg-red-600 hover:scale-105" title="거절">✗</button>
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
        // 프론트엔드에서 새로운 친구 요청을 보낸 요청 목록에 추가
        const newSentRequest: FriendRequest = {
          id: Date.now().toString(), // 임시 ID
          name: username,
          username: username,
          relationId: Date.now().toString() + "_sent",
        };

        // 보낸 요청 목록에 추가 (별도 배열이 있다면)
        // this.sentRequests.push(newSentRequest);

        // 입력 필드 초기화
        const input = this.container.querySelector("#addFriendInput") as HTMLInputElement;
        if (input) input.value = "";

        // 성공 알림
        this.showNotification(`${username}에게 친구 요청을 보냈습니다.`);

        // API 호출 없이 UI만 업데이트
        console.log(`친구 요청 전송됨: ${username}`);
      } else {
        console.error("친구 요청 실패:", response.message);
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
        console.log(`친구 요청 수락 성공: ${friendName}`);

        // 수락된 요청을 친구 요청 목록에서 제거
        const acceptedRequest = this.friendRequests.find((request) => request.relationId === relationId);
        this.friendRequests = this.friendRequests.filter((request) => request.relationId !== relationId);

        // 수락된 사용자를 친구 목록에 추가
        if (acceptedRequest) {
          const newFriend: Friend = {
            id: acceptedRequest.id,
            name: acceptedRequest.name,
            username: acceptedRequest.username,
            status: "offline" as "online" | "offline" | "in-game",
            relationId: relationId,
          };
          this.friends.push(newFriend);
        }

        // UI 즉시 업데이트 (API 재호출 없이)
        this.renderFriendItems();
        this.updateFriendList();
        this.updateRequestsBox();

        // 드롭다운 닫기
        const requestsDropdown = this.container.querySelector("#requestsDropdown");
        if (requestsDropdown) {
          requestsDropdown.classList.remove("opacity-100", "translate-y-0", "pointer-events-auto");
          requestsDropdown.classList.add("opacity-0", "-translate-y-2.5", "pointer-events-none");
        }

        // 성공 알림 표시
        this.showNotification(`${friendName}님이 친구 목록에 추가되었습니다.`);
        console.log(`친구 목록에 추가됨: ${friendName}`);
      } else {
        console.error("친구 요청 수락 실패:", response.message);
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
        console.log(`친구 요청 거절 성공: ${friendName}`);

        // 친구 요청 목록에서 해당 요청 제거
        this.friendRequests = this.friendRequests.filter((request) => request.relationId !== relationId);

        // UI 즉시 업데이트 (API 재호출 없이)
        this.updateRequestsBox();

        // 드롭다운 닫기
        const requestsDropdown = this.container.querySelector("#requestsDropdown");
        if (requestsDropdown) {
          requestsDropdown.classList.remove("opacity-100", "translate-y-0", "pointer-events-auto");
          requestsDropdown.classList.add("opacity-0", "-translate-y-2.5", "pointer-events-none");
        }

        // 성공 알림 표시
        this.showNotification(`${friendName}님의 친구 요청을 거절했습니다.`);
        console.log(`친구 요청 거절됨: ${friendName}`);
      } else {
        console.error("친구 요청 거절 실패:", response.message);
        this.showNotification(`친구 요청 거절 실패: ${response.message || "알 수 없는 오류"}`);
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

  private async deleteFriend(friendId: string, friendName: string): Promise<void> {
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

      console.log(`친구 삭제 요청:`, {
        friendId,
        friendName,
        currentFriends: this.friends,
      });

      const response = await friendService.deleteFriend(friendId);

      console.log("친구 삭제 응답:", response);

      if (response.success) {
        // 친구 목록에서 제거 (relationId와 id 둘 다 확인)
        const beforeCount = this.friends.length;
        this.friends = this.friends.filter((friend) => friend.id !== friendId);
        const afterCount = this.friends.length;

        console.log(`친구 목록 업데이트: ${beforeCount} -> ${afterCount}`);

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
