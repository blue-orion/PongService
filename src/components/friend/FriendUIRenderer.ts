import { Friend, FriendRequest, SentRequest } from "../../types/friend.types";

export class FriendUIRenderer {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public renderFriendItems(friends: Friend[], friendRequests: FriendRequest[], sentRequests: SentRequest[]): void {
    this.renderFriendList(friends);
    this.updateRequestsBox(friendRequests);
    this.updateSentRequestsBox(sentRequests);
  }

  private renderFriendList(friends: Friend[]): void {
    const onlineList = this.container.querySelector("#onlineList") as HTMLElement;
    const offlineList = this.container.querySelector("#offlineList") as HTMLElement;
    const onlineTitle = this.container.querySelector("#onlineTitle") as HTMLElement;
    const offlineTitle = this.container.querySelector("#offlineTitle") as HTMLElement;

    const onlineFriends = friends.filter((friend) => friend.status === "online");
    const offlineFriends = friends.filter((friend) => friend.status !== "online");

    if (onlineTitle) {
      onlineTitle.textContent = `온라인 - ${onlineFriends.length}`;
    }

    if (offlineTitle) {
      offlineTitle.textContent = `오프라인 - ${offlineFriends.length}`;
    }

    if (onlineList) {
      onlineList.innerHTML =
        onlineFriends.length > 0 ? onlineFriends.map((friend) => this.createFriendItemHTML(friend)).join("") : "";
    }

    if (offlineList) {
      offlineList.innerHTML =
        offlineFriends.length > 0 ? offlineFriends.map((friend) => this.createFriendItemHTML(friend)).join("") : "";
    }
  }

  private createFriendItemHTML(friend: Friend): string {
    const isOnline = friend.status === "online";
    const statusText = isOnline ? "온라인" : "오프라인";
    const opacityClass = isOnline ? "" : "opacity-60";

    // 프로필 이미지가 있는지 확인하고 유효한 URL인지 체크
    const hasValidAvatar =
      friend.avatar &&
      friend.avatar.trim() !== "" &&
      (friend.avatar.startsWith("http") || friend.avatar.startsWith("/") || friend.avatar.startsWith("data:"));

    const avatarClass = hasValidAvatar
      ? "friend-avatar-with-image"
      : isOnline
      ? "friend-avatar-online-gradient"
      : "friend-avatar-offline-gradient";

    const statusIndicatorClass = isOnline ? "friend-status-indicator-online" : "friend-status-indicator-offline";
    const statusTextClass = isOnline ? "friend-status-text-online" : "friend-status-text-offline";

    // 배경 이미지 스타일 생성
    const avatarStyle = hasValidAvatar ? `style="background-image: url('${friend.avatar}');"` : "";

    return `
      <div class="friend-item ${opacityClass}" data-friend-id="${friend.id}" data-relation-id="${friend.relationId}">
        <div class="friend-item-avatar ${avatarClass}" ${avatarStyle}>
          <div class="friend-item-status-indicator ${statusIndicatorClass}"></div>
        </div>
        <div class="friend-item-info">
          <div class="friend-item-name">${friend.name}</div>
          <div class="friend-item-username">${friend.username || friend.name}</div>
          <div class="friend-item-status ${statusTextClass}">${statusText}</div>
        </div>
        <div class="friend-item-actions">
          <button class="friend-delete-btn" title="친구 삭제" data-friend-id="${friend.id}" data-relation-id="${
      friend.relationId
    }">🗑️</button>
        </div>
      </div>
    `;
  }

  public updateRequestsBox(friendRequests: FriendRequest[]): void {
    const requestsCount = this.container.querySelector("#requestsCount") as HTMLElement;
    const requestsList = this.container.querySelector("#requestsList") as HTMLElement;

    if (requestsCount) {
      requestsCount.textContent = friendRequests.length.toString();
      if (friendRequests.length === 0) {
        requestsCount.classList.remove("show");
      } else {
        requestsCount.classList.add("show");
      }
    }

    if (requestsList) {
      if (friendRequests.length === 0) {
        requestsList.innerHTML = '<div class="friend-empty-message">받은 친구 요청이 없습니다</div>';
      } else {
        const requestsHTML = friendRequests
          .map((request) => {
            // 프로필 이미지가 있는지 확인하고 유효한 URL인지 체크
            const hasValidAvatar =
              request.avatar &&
              request.avatar.trim() !== "" &&
              (request.avatar.startsWith("http") ||
                request.avatar.startsWith("/") ||
                request.avatar.startsWith("data:"));

            const avatarContent = hasValidAvatar
              ? `<div class="friend-request-avatar-with-image" style="background-image: url('${request.avatar}');"></div>`
              : `<div class="friend-request-avatar-default"></div>`;

            return `
          <div class="friend-request-item" data-relation-id="${request.relationId}">
            ${avatarContent}
            <div class="friend-request-info">
              <div class="friend-request-name">${request.name}</div>
              <div class="friend-request-username">${request.username}</div>
              <div class="friend-request-status">친구 요청</div>
            </div>
            <div class="friend-request-actions">
              <button class="friend-request-accept-btn" title="수락">✓</button>
              <button class="friend-request-reject-btn" title="거절">✗</button>
            </div>
          </div>
        `;
          })
          .join("");
        requestsList.innerHTML = requestsHTML;
      }
    }
  }

  public updateSentRequestsBox(sentRequests: SentRequest[]): void {
    const sentRequestsCount = this.container.querySelector("#sentRequestsCount") as HTMLElement;
    const sentRequestsList = this.container.querySelector("#sentRequestsList") as HTMLElement;

    if (sentRequestsCount) {
      sentRequestsCount.textContent = sentRequests.length.toString();
      if (sentRequests.length === 0) {
        sentRequestsCount.classList.remove("show");
      } else {
        sentRequestsCount.classList.add("show");
      }
    }

    if (sentRequestsList) {
      if (sentRequests.length === 0) {
        sentRequestsList.innerHTML = '<div class="friend-empty-message">보낸 친구 요청이 없습니다</div>';
      } else {
        const sentRequestsHTML = sentRequests
          .map((request) => {
            // 프로필 이미지가 있는지 확인하고 유효한 URL인지 체크
            const hasValidAvatar =
              request.avatar &&
              request.avatar.trim() !== "" &&
              (request.avatar.startsWith("http") ||
                request.avatar.startsWith("/") ||
                request.avatar.startsWith("data:"));

            const avatarContent = hasValidAvatar
              ? `<div class="friend-request-avatar-with-image" style="background-image: url('${request.avatar}');"></div>`
              : `<div class="friend-sent-request-avatar-default"></div>`;

            return `
          <div class="friend-sent-request-item" data-relation-id="${request.relationId}">
            ${avatarContent}
            <div class="friend-request-info">
              <div class="friend-request-name">${request.name}</div>
              <div class="friend-request-username">${request.username}</div>
              <div class="friend-request-status">요청 대기 중</div>
            </div>
            <div class="friend-request-actions">
              <button class="friend-sent-request-cancel-btn" title="취소">✗</button>
            </div>
          </div>
        `;
          })
          .join("");
        sentRequestsList.innerHTML = sentRequestsHTML;
      }
    }
  }

  public toggleRequestsDropdown(dropdown: Element | null): void {
    if (!dropdown) return;

    const isVisible = dropdown.classList.contains("show");
    if (isVisible) {
      this.closeRequestsDropdown(dropdown);
    } else {
      this.openRequestsDropdown(dropdown);
    }
  }

  public openRequestsDropdown(dropdown: Element): void {
    dropdown.classList.add("show");
  }

  public closeRequestsDropdown(dropdown: Element): void {
    dropdown.classList.remove("show");
  }
}
