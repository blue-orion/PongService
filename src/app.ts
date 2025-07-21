import { Router } from "./router";
import { LoginComponent } from "./components/login/LoginComponent";
import { GameComponent } from "./components/game/GameComponent";
import { AuthManager } from "./utils/auth";
import { FriendComponent } from "./components/friend/FriendComponent";
import { friendWebSocketManager } from "./utils/friendWebSocket";
import "./types/global"; // 글로벌 타입 선언

class App {
  private router: Router;
  private appContainer: HTMLElement;
  private currentComponent: any = null;
  private friendComponent: FriendComponent | null = null;

  constructor() {
    this.appContainer = document.getElementById("app")!;
    this.router = new Router();

    // 글로벌 라우터 참조 설정
    window.router = this.router;

    // 글로벌 앱 인스턴스 참조 설정 (로그아웃을 위해)
    (window as any).app = this;

    this.setupRoutes();
    this.initializeApp();
  }

  // 글로벌 로그아웃 메서드
  public async logout(): Promise<void> {
    try {
      // 토큰 정리
      AuthManager.clearTokens();

      // 친구 컴포넌트 정리
      this.cleanupFriendComponent();

      // 로그인 페이지로 이동
      this.router.navigate("/login");

      console.log("로그아웃 완료");
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  }

  private async initializeApp(): Promise<void> {
    // 인증 상태 확인
    const isAuthenticated = await AuthManager.checkAuth();

    // 현재 URL 경로 확인
    const currentPath = window.location.pathname;

    if (isAuthenticated) {
      // 인증된 사용자
      if (currentPath === "/login") {
        // 로그인 페이지에 있다면 메인 페이지로 이동
        this.router.navigate("/");
      } else {
        // 현재 경로 유지하고 친구창 초기화
        this.initializeFriendComponent();
        this.requestNotificationPermission();
        this.router.navigate(currentPath, false);
      }
    } else {
      // 인증되지 않은 사용자는 로그인 페이지로
      this.cleanupFriendComponent(); // 친구창 정리
      this.router.navigate("/login", currentPath !== "/login");
    }
  }

  private async requestNotificationPermission(): Promise<void> {
    if ("Notification" in window && Notification.permission === "default") {
      try {
        const permission = await Notification.requestPermission();
        console.log("알림 권한:", permission);
      } catch (error) {
        console.error("알림 권한 요청 실패:", error);
      }
    }
  }

  private setupRoutes(): void {
    // 로그인 페이지
    this.router.addRoute("/login", async () => {
      await this.loadComponent(LoginComponent);
    });

    // 메인 게임 페이지
    this.router.addRoute("/", async () => {
      await this.loadComponent(GameComponent);
    });
  }

  private async loadComponent(ComponentClass: any): Promise<void> {
    // 기존 컴포넌트 정리
    if (this.currentComponent) {
      this.currentComponent.destroy();
    }

    // 새 컴포넌트 로드
    this.currentComponent = new ComponentClass(this.appContainer);
    await this.currentComponent.render();

    // 인증 상태 확인하여 친구창 관리
    const isAuthenticated = await AuthManager.checkAuth();
    const currentPath = window.location.pathname;

    if (isAuthenticated && currentPath !== "/login" && !this.friendComponent) {
      this.initializeFriendComponent();
    } else if (!isAuthenticated && this.friendComponent) {
      this.cleanupFriendComponent();
    }
  }

  private async initializeFriendComponent(): Promise<void> {
    if (!this.friendComponent) {
      // 친구창 컨테이너 생성
      const friendContainer = document.createElement("div");
      friendContainer.id = "friend-container";
      document.body.appendChild(friendContainer);

      // 친구 컴포넌트 초기화
      this.friendComponent = new FriendComponent(friendContainer);
      await this.friendComponent.render();
    }
  }

  private cleanupFriendComponent(): void {
    if (this.friendComponent) {
      this.friendComponent.destroy();
      this.friendComponent = null;

      // 친구창 컨테이너 제거
      const friendContainer = document.getElementById("friend-container");
      if (friendContainer) {
        friendContainer.remove();
      }
    }
  }
}

// 페이지 로드 시 앱 초기화
document.addEventListener("DOMContentLoaded", () => {
  new App();
});
