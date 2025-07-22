// 사용자 정보 관리 유틸리티
export class UserManager {
  private static readonly USER_ID_KEY = "myUserId";
  private static readonly USERNAME_KEY = "myUsername";

  static saveUserInfo(user: { id: string; username: string }): void {
    localStorage.setItem(this.USER_ID_KEY, user.id);
    localStorage.setItem(this.USERNAME_KEY, user.username);
  }

  static getUserId(): string | null {
    return localStorage.getItem(this.USER_ID_KEY);
  }

  static getUsername(): string | null {
    return localStorage.getItem(this.USERNAME_KEY);
  }

  static clearUserInfo(): void {
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
  }
}
