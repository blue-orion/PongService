import { AuthManager } from "../../utils/auth";
import { UserManager } from "../../utils/user";
import { UserProfile, UserStatus } from "../../types/friend.types";

export class UserProfileManager {
  private container: HTMLElement;
  private currentUser: UserProfile | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public async setupUserProfile(): Promise<void> {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      this.setDefaultProfile();
      return;
    }

    try {
      const userProfile = await this.fetchUserProfile(currentUserId);

      if (userProfile) {
        this.currentUser = userProfile;
        const userStatus = userProfile.status || "OFFLINE";
        this.updateProfileUI(userProfile, userStatus);
      } else {
        this.setDefaultProfile();
      }
    } catch (error) {
      console.error("사용자 프로필 설정 오류:", error);
      this.setDefaultProfile();
    }
  }

  public getCurrentUserId(): string | null {
    // UserManager에서 저장된 사용자 ID 사용
    return UserManager.getUserId();
  }

  public async fetchUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const tokens = AuthManager.getTokens();
      if (!tokens?.accessToken) return null;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/profile/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("프로필 정보 가져오기 실패:", response.status, response.statusText);
        return null;
      }

      const responseText = await response.text();

      if (!responseText.trim() || responseText.trim().startsWith("<")) {
        console.error("잘못된 응답 형식");
        return null;
      }

      const result = JSON.parse(responseText);

      if (result.success && result.data) {
        return {
          id: result.data.id,
          username: result.data.username,
          nickname: result.data.nickname,
          profileImage: result.data.profileImage,
          status: result.data.status,
          gameRating: result.data.gameRating,
        };
      }
      return null;
    } catch (error) {
      console.error("사용자 프로필 가져오기 오류:", error);
      return null;
    }
  }

  private setDefaultProfile(): void {
    // UserManager에서 사용자 정보 가져오기
    const userId = UserManager.getUserId();
    const username = UserManager.getUsername();
    const nickname = username || "사용자"; // nickname이 없으면 username 사용

    const nicknameElement = this.container.querySelector("#userNickname") as HTMLElement;
    const usernameElement = this.container.querySelector("#userUsername") as HTMLElement;
    const avatarElement = this.container.querySelector("#userAvatar") as HTMLElement;

    if (nicknameElement) nicknameElement.textContent = nickname;
    if (usernameElement) usernameElement.classList.add("friend-hidden");
    if (avatarElement) {
      avatarElement.style.backgroundImage = "";
      avatarElement.className = "friend-user-avatar-default";
    }

    this.updateStatusIndicator("online");
  }

  private updateProfileUI(userProfile: UserProfile, status: string): void {
    const nicknameElement = this.container.querySelector("#userNickname") as HTMLElement;
    const usernameElement = this.container.querySelector("#userUsername") as HTMLElement;
    const avatarElement = this.container.querySelector("#userAvatar") as HTMLElement;

    if (nicknameElement) {
      const displayName = userProfile.nickname || userProfile.username || "사용자";
      nicknameElement.textContent = displayName;
    }

    if (usernameElement) {
      if (userProfile.username && userProfile.nickname) {
        usernameElement.textContent = `@${userProfile.username}`;
        usernameElement.classList.remove("friend-hidden");
        usernameElement.classList.add("friend-visible");
      } else {
        usernameElement.classList.remove("friend-visible");
        usernameElement.classList.add("friend-hidden");
      }
    }

    if (avatarElement) {
      if (userProfile.profileImage) {
        avatarElement.style.backgroundImage = `url('${userProfile.profileImage}')`;
        avatarElement.className = "friend-user-avatar-with-image";
      } else {
        avatarElement.style.backgroundImage = "";
        avatarElement.className = "friend-user-avatar-default";
      }
    }

    const convertedStatus = this.convertStatus(status);
    this.updateStatusIndicator(convertedStatus);
  }

  public updateStatusIndicator(status: UserStatus): void {
    const statusElement = this.container.querySelector("#userStatus") as HTMLElement;
    if (!statusElement) return;

    const statusConfig = {
      online: { text: "온라인", class: "text-green-400" },
      "in-game": { text: "게임 중", class: "text-yellow-400" },
      offline: { text: "오프라인", class: "text-gray-400" },
    };

    const config = statusConfig[status] || statusConfig.offline;
    statusElement.textContent = config.text;
    statusElement.className = `text-xs font-medium ${config.class}`;
  }

  public convertStatus(apiStatus: string): UserStatus {
    switch (apiStatus) {
      case "ONLINE":
        return "online";
      case "IN_GAME":
        return "in-game";
      default:
        return "offline";
    }
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }
}
