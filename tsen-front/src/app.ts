import { Router } from "./router";
import { LoginComponent } from "./components/login/LoginComponent";
import { SignupComponent } from "./components/login/SignupComponent";
import { GameComponent } from "./components/game/GameComponent";
import { AuthManager } from "./utils/auth";
import { UserManager } from "./utils/user";
import "./styles/input.css";
import "./styles/friend.css";
import { FriendComponent } from "./components/friend/FriendComponent";
import { friendWebSocketManager } from "./utils/friendWebSocket";
import "./types/global"; // 글로벌 타입 선언
import { Layout } from "./pages/Layout";
import { LobbyListComponent } from "./components/lobby/lobbyList/LobbyListComponent";
import { LobbyDetailComponent } from "./components/lobby/lobbyDetail/LobbyDetailComponent";
import { UserInfoComponent } from "./components/user/UserInfoComponent";
import { DashboardComponent } from "./components/dashboard/DashboardComponent";
import { HomeComponent } from "./components/home/HomeComponent";
import { EditProfileComponent } from "./components/user/EditProfileComponent";
import { StatsComponent } from "./components/user/StatsComponent";
import { GameHistoryComponent } from "./components/user/GameHistoryComponent";

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

      // 친구창 숨기기
      this.hideFriendComponent();

      // 로그인 페이지로 이동
      this.router.navigate("/login");
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  }

  private async initializeApp(): Promise<void> {
    const isAuthenticated = await AuthManager.checkAuth();
    const currentPath = window.location.pathname;

    if (isAuthenticated) {
      if (currentPath === "/login") {
        this.router.navigate("/");
      } else {
        // 현재 경로 유지
        this.requestNotificationPermission();
        this.router.navigate(currentPath, false);
      }
    } else {
      // 인증되지 않은 사용자는 로그인 페이지로
      // 친구창 숨기기
      this.hideFriendComponent();
      this.router.navigate("/login", currentPath !== "/login");
    }
  }

  private async requestNotificationPermission(): Promise<void> {
    if ("Notification" in window && Notification.permission === "default") {
      try {
        const permission = await Notification.requestPermission();
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

    // 회원가입 페이지
    this.router.addRoute("/signup", async () => {
      await this.loadComponent(SignupComponent);
    });

    // 메인 페이지 (홈 화면) - Layout 내에서 HomeComponent 렌더링
    this.router.addRoute("/", async () => {
      await this.loadLayoutWithComponent(LobbyListComponent);
    });

    // 로비 목록 페이지 (헤더에서 접근)
    this.router.addRoute("/lobby", async () => {
      await this.loadLayoutWithComponent(LobbyListComponent);
    });

    // 대시보드 페이지 (랭킹 시스템)
    this.router.addRoute("/dashboard", async () => {
      await this.loadLayoutWithComponent(DashboardComponent);
    });

    // 로비 상세 페이지 - 동적 라우트
    this.router.addDynamicRoute("/lobby/:id", async (params: any) => {
      await this.loadLayoutWithComponent(LobbyDetailComponent, params.id);
    });

    // 사용자 정보 페이지 - 동적 라우트
    this.router.addDynamicRoute("/user/:id", async (params: any) => {
      await this.loadLayoutWithComponent(UserInfoComponent, params.id);
    });

    // 사용자 전적 페이지 - 동적 라우트
    this.router.addDynamicRoute("/user/:id/stats", async (params: any) => {
      await this.loadLayoutWithComponent(StatsComponent, params.id);
    });

    // 사용자 게임 기록 페이지 - 동적 라우트
    this.router.addDynamicRoute("/user/:id/games", async (params: any) => {
      await this.loadLayoutWithComponent(GameHistoryComponent, params.id);
    });

    // 사용자 정보 페이지 - 동적 라우트 (/info/:id 경로 추가)
    this.router.addDynamicRoute("/info/:id", async (params: any) => {
      await this.loadLayoutWithComponent(UserInfoComponent, params.id);
    });

    // 프로필 편집 페이지 (프로필 변경 + 비밀번호 변경 통합)
    this.router.addRoute("/profile/edit", async () => {
      // 인증된 사용자만 접근 가능
      const isAuthenticated = await AuthManager.checkAuth();
      if (!isAuthenticated) {
        this.router.navigate("/login");
        return;
      }
      await this.loadComponent(EditProfileComponent);
    });

    // 비밀번호 변경 페이지 (프로필 편집으로 리다이렉트)
    this.router.addRoute("/profile/password", async () => {
      this.router.navigate("/profile/edit");
    });

    // 게임 페이지 - 동적 라우트
    this.router.addDynamicRoute("/game/:gameId/:tournamentId", async (params: any) => {
      await this.loadLayoutWithComponent(GameComponent, params);
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
  }

  public async loadMainComponent(ComponentClass: any, ...args: any[]): Promise<void> {
    if (!this.currentComponent || !this.currentComponent.setMainComponent) {
      console.warn("현재 Layout이 없습니다. Layout부터 로드하세요.");
      this.loadLayoutWithComponent(ComponentClass);
      return;
    }

    // 메인 콘텐츠 영역에 특정 컴포넌트 렌더링
    const mainContentContainer = document.getElementById("main-content");
    if (mainContentContainer) {
      // 기존 메인 컴포넌트 정리 (Layout에 저장된 것)
      const existingMainComponent = this.currentComponent.getMainComponent?.();
      if (existingMainComponent && existingMainComponent.destroy) {
        existingMainComponent.destroy();
      }

      // 메인 콘텐츠 컨테이너 초기화
      mainContentContainer.innerHTML = "";

      // 새 메인 컴포넌트 생성 및 렌더링
      const mainComponent = new ComponentClass(mainContentContainer, ...args);
      await mainComponent.render();

      // Layout 컴포넌트에 메인 컴포넌트 저장 (나중에 정리하기 위해)
      if (this.currentComponent && this.currentComponent.setMainComponent) {
        this.currentComponent.setMainComponent(mainComponent);
      }

      console.log(`[App] 메인 컴포넌트 교체 완료: ${ComponentClass.name}`, args);
    }
  }

  public async loadLayoutWithComponent(ComponentClass: any, ...args: any[]): Promise<void> {
    const layoutAlreadyRendered = this.currentComponent instanceof Layout;

    // Layout이 이미 있다면, MainComponent만 교체
    if (layoutAlreadyRendered) {
      await this.loadMainComponent(ComponentClass, ...args);
      return;
    }

    // 기존 컴포넌트 정리
    if (this.currentComponent) {
      this.currentComponent.destroy();
    }

    // Layout 컴포넌트 생성
    this.currentComponent = new Layout(this.appContainer);
    await this.currentComponent.render();

    // 메인 콘텐츠 영역에 특정 컴포넌트 렌더링
    const mainContentContainer = document.getElementById("main-content");
    if (mainContentContainer) {
      const mainComponent = new ComponentClass(mainContentContainer, ...args);
      await mainComponent.render();

      // Layout 컴포넌트에 메인 컴포넌트 저장 (나중에 정리하기 위해)
      if (this.currentComponent && this.currentComponent.setMainComponent) {
        this.currentComponent.setMainComponent(mainComponent);
      }
    }

    // 친구창 초기화
    await this.initializeFriendComponent();

    console.log("레이아웃과 컴포넌트 렌더링 완료");
  }

  public async initializeFriendComponent(): Promise<void> {
    // 기존 친구창이 있는지 확인
    const existingFriendContainer = document.getElementById("friend-container");

    if (!existingFriendContainer || existingFriendContainer.children.length === 0) {
      let friendContainer = existingFriendContainer as HTMLDivElement | null;

      // 컨테이너가 없으면 새로 생성
      if (!friendContainer) {
        friendContainer = document.createElement("div");
        friendContainer.id = "friend-container";
        document.body.appendChild(friendContainer);
      }

      // 친구 컴포넌트 초기화
      this.friendComponent = new FriendComponent(friendContainer);
      await this.friendComponent.render();

      // 웹소켓 연결 (친구 컴포넌트 초기화 후에 한 번만)
      friendWebSocketManager.connect();
    } else {
      // 기존 친구 컴포넌트가 있으면 웹소켓 상태만 확인
      if (!friendWebSocketManager.isConnected) {
        friendWebSocketManager.connect();
      }
    }

    // 친구창 보이기
    this.showFriendComponent();
  }

  private hideFriendComponent(): void {
    // 친구창 숨기기
    const friendContainer = document.getElementById("friend-container");
    if (friendContainer) {
      friendContainer.style.display = "none";
    }

    // 웹소켓 연결 해제
    if (this.friendComponent) {
      friendWebSocketManager.disconnect();
    }
  }

  private showFriendComponent(): void {
    // 친구창 보이기
    const friendContainer = document.getElementById("friend-container");
    if (friendContainer) {
      friendContainer.style.display = "block";
    }
  }
}

// 페이지 로드 시 앱 초기화
document.addEventListener("DOMContentLoaded", () => {
  new App();
});
