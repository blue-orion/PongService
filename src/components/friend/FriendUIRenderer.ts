import { Friend, FriendRequest, SentRequest } from "../../types/friend.types";

export class FriendUIRenderer {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public renderFriendItems(friends: Friend[], friendRequests: FriendRequest[], sentRequests: SentRequest[]): void {
    this.renderOnlineFriends(friends);
    this.renderOfflineFriends(friends);
    this.updateRequestsBox(friendRequests);
    this.updateSentRequestsBox(sentRequests);
  }
  private renderOnlineFriends(friends: Friend[]): void {
    const onlineFriends = friends.filter((f) => f.status !== "offline");
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

  private renderOfflineFriends(friends: Friend[]): void {
    const offlineFriends = friends.filter((f) => f.status === "offline");
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
    const statusText = friend.status === "in-game" ? "게임 중" : isOnline ? "온라인" : "오프라인";
    const opacity = isOnline ? "" : "opacity-70";

    const avatarStyle = friend.avatar
      ? `background-image: url('${friend.avatar}'); background-size: cover; background-position: center;`
      : `background: linear-gradient(135deg, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%);`;

    return `
      <div class="group flex items-center p-3 bg-white/10 rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/20 ${opacity}" data-friend-id="${
      friend.id
    }" data-relation-id="${friend.relationId}">
        <div class="w-10 h-10 rounded-full ${
          friend.avatar
            ? "border-2 border-white/30"
            : `bg-gradient-to-br from-${statusColor}-400 to-${statusColor === "green" ? "blue" : "gray"}-${
                statusColor === "green" ? "500" : "600"
              } border-2 border-white/30`
        } mr-3 relative" 
             style="${friend.avatar ? avatarStyle : ""}">
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

  public updateRequestsBox(friendRequests: FriendRequest[]): void {
    const requestsCount = this.container.querySelector("#requestsCount") as HTMLElement;
    const requestsList = this.container.querySelector("#requestsList") as HTMLElement;

    if (requestsCount) {
      requestsCount.textContent = friendRequests.length.toString();
      if (friendRequests.length === 0) {
        requestsCount.classList.add("hidden");
      } else {
        requestsCount.classList.remove("hidden");
      }
    }

    if (requestsList) {
      if (friendRequests.length === 0) {
        requestsList.innerHTML = '<div class="p-6 text-center text-gray-500 text-sm">받은 친구 요청이 없습니다</div>';
      } else {
        const requestsHTML = friendRequests
          .map((request) => {
            const avatarContent = request.avatar
              ? `<div class="w-10 h-10 rounded-full border-2 border-white/50" style="background-image: url('${request.avatar}'); background-size: cover; background-position: center;"></div>`
              : `<div class="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-teal-400 border-2 border-white/50"></div>`;

            return `
          <div class="p-3 border-b border-white/10 flex items-center gap-3 transition-colors duration-200 hover:bg-indigo-50 last:border-b-0" data-relation-id="${request.relationId}">
            ${avatarContent}
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
        sentRequestsCount.classList.add("hidden");
      } else {
        sentRequestsCount.classList.remove("hidden");
      }
    }

    if (sentRequestsList) {
      if (sentRequests.length === 0) {
        sentRequestsList.innerHTML =
          '<div class="p-6 text-center text-gray-500 text-sm">보낸 친구 요청이 없습니다</div>';
      } else {
        const sentRequestsHTML = sentRequests
          .map((request) => {
            const avatarContent = request.avatar
              ? `<div class="w-10 h-10 rounded-full border-2 border-white/50" style="background-image: url('${request.avatar}'); background-size: cover; background-position: center;"></div>`
              : `<div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-green-400 border-2 border-white/50"></div>`;

            return `
          <div class="p-3 border-b border-white/10 flex items-center gap-3 transition-colors duration-200 hover:bg-blue-50 last:border-b-0" data-relation-id="${request.relationId}">
            ${avatarContent}
            <div class="flex-1 min-w-0">
              <div class="text-gray-800 font-bold text-sm truncate">${request.name}</div>
              <div class="text-gray-600 text-xs truncate">${request.username}</div>
              <div class="text-gray-500 text-xs">요청 대기 중</div>
            </div>
            <div class="flex gap-2">
              <button class="w-8 h-8 border-0 rounded-lg cursor-pointer flex items-center justify-center text-sm font-bold transition-all duration-200 bg-gray-500 text-white hover:bg-red-600 hover:scale-105" title="취소">✗</button>
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

    const isVisible = dropdown.classList.contains("opacity-100");
    if (isVisible) {
      this.closeRequestsDropdown(dropdown);
    } else {
      this.openRequestsDropdown(dropdown);
    }
  }

  public openRequestsDropdown(dropdown: Element): void {
    dropdown.classList.remove("opacity-0", "-translate-y-2.5", "pointer-events-none");
    dropdown.classList.add("opacity-100", "translate-y-0", "pointer-events-auto");
  }

  public closeRequestsDropdown(dropdown: Element): void {
    dropdown.classList.remove("opacity-100", "translate-y-0", "pointer-events-auto");
    dropdown.classList.add("opacity-0", "-translate-y-2.5", "pointer-events-none");
  }
}
