import { Router } from "./router";
import { LoginComponent } from "./components/login/LoginComponent";
import { SignupComponent } from "./components/login/SignupComponent";
import { SocialCallbackComponent } from "./components/login/SocialCallback";
import { GameComponent } from "./components/game/GameComponent";
import { AuthManager } from "./utils/auth";
import "./styles/input.css";
import { FriendComponent } from "./components/friend/FriendComponent";
import { friendWebSocketManager } from "./utils/friendWebSocket";
import "./types/global"; // 글로벌 타입 선언
import { Layout } from "./pages/Layout";
import { LobbyListComponent } from "./components/lobby/lobbyList/LobbyListComponent";
import { LobbyDetailComponent } from "./components/lobby/lobbyDetail/LobbyDetailComponent";
import { UserInfoComponent } from "./components/user/UserInfoComponent";
import { DashboardComponent } from "./components/dashboard/DashboardComponent";

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

      console.log("로그아웃 완료");
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  }

  private async initializeApp(): Promise<void> {
    const isAuthenticated = await AuthManager.checkAuth();
    const currentPath = window.location.pathname;

    // 소셜 콜백 경로는 인증 예외
    if (currentPath === "/social-callback") {
      this.router.navigate("/social-callback", false);
      return;
    }

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
        console.log("알림 권한:", permission);
      } catch (error) {
        console.error("알림 권한 요청 실패:", error);
      }
    }
  }

  private setupRoutes(): void {
    console.log("라우트 설정 중...");

    // 로그인 페이지
    this.router.addRoute("/login", async () => {
      console.log("로그인 페이지 라우트 실행");
      await this.loadComponent(LoginComponent);
    });

    // 회원가입 페이지
    this.router.addRoute("/signup", async () => {
      await this.loadComponent(SignupComponent);
    });

    // 소셜 로그인 콜백 페이지
    this.router.addRoute("/social-callback", async () => {
      await this.loadComponent(SocialCallbackComponent);
    });

    // 메인 페이지 (로비 리스트) - Layout 내에서 LobbyListComponent 렌더링
    this.router.addRoute("/", async () => {
      console.log("메인 페이지 (로비 리스트) 라우트 실행");
      await this.loadLayoutWithComponent(LobbyListComponent);
    });

    // 로비 목록 페이지 (헤더에서 접근)
    this.router.addRoute("/lobby", async () => {
      console.log("로비 목록 페이지 라우트 실행");
      await this.loadLayoutWithComponent(LobbyListComponent);
    });

    // 대시보드 페이지
    this.router.addRoute("/dashboard", async () => {
      console.log("대시보드 페이지 라우트 실행");
      // 대시보드 컴포넌트가 있다면 사용, 없으면 로비 리스트로 리다이렉트
      await this.loadLayoutWithComponent(DashboardComponent);
    });

    // 프로필 페이지
    this.router.addRoute("/profile", async () => {
      console.log("프로필 페이지 라우트 실행");
      // 프로필 컴포넌트가 있다면 사용, 없으면 로비 리스트로 리다이렉트
      await this.loadLayoutWithComponent(LobbyListComponent);
    });

    // 로비 상세 페이지 - 동적 라우트
    this.router.addDynamicRoute("/lobby/:id", async (params: any) => {
      console.log("로비 상세 페이지 라우트 실행, ID:", params.id);
      await this.loadLayoutWithComponent(LobbyDetailComponent, params.id);
    });

    // 사용자 정보 페이지 - 동적 라우트
    this.router.addDynamicRoute("/info/:id", async (params: any) => {
      console.log("사용자 정보 페이지 라우트 실행, ID:", params.id);
      await this.loadLayoutWithComponent(UserInfoComponent, params.id);
    });

    // 사용자 정보 페이지 - 동적 라우트
    this.router.addDynamicRoute("/game/:gameId/:tournamentId", async (params: any) => {
      console.log("사용자 정보 페이지 라우트 실행, ID:", params.gameId, params.tournamentId);
      await this.loadLayoutWithComponent(GameComponent, params);
    });

    console.log("라우트 설정 완료");
  }

  private async loadComponent(ComponentClass: any): Promise<void> {
    console.log("컴포넌트 로딩 시작:", ComponentClass.name);

    // 기존 컴포넌트 정리
    if (this.currentComponent) {
      this.currentComponent.destroy();
    }

    // 새 컴포넌트 로드
    this.currentComponent = new ComponentClass(this.appContainer);
    console.log("컴포넌트 생성 완료, 렌더링 시작...");
    await this.currentComponent.render();
    console.log("컴포넌트 생성 완료, 렌더링 완료");
  }

  public async loadMainComponent(ComponentClass: any, ...args: any[]): Promise<void> {
    console.log("메인 컴포넌트 로딩 시작:", ComponentClass.name);

    console.log(this.currentComponent);
    if (!this.currentComponent || !this.currentComponent.setMainComponent) {
      console.warn("현재 Layout이 없습니다. Layout부터 로드하세요.");
      this.loadLayoutWithComponent(ComponentClass);
      return;
    }

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

    console.log("메인 컴포넌트 렌더링 완료");
  }

  public async loadLayoutWithComponent(ComponentClass: any, ...args: any[]): Promise<void> {
    console.log("레이아웃과 함께 컴포넌트 로딩 시작:", ComponentClass.name);

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
    const isAuthenticated = await AuthManager.checkAuth();
    if (isAuthenticated) {
      await this.initializeFriendComponent?.();
    }
    console.log(isAuthenticated);

    console.log("레이아웃과 컴포넌트 렌더링 완료");
  }

  private async initializeFriendComponent(): Promise<void> {
    // 기존 친구창이 있는지 확인
    const existingFriendContainer = document.getElementById("friend-container");

    if (!this.friendComponent) {
      let friendContainer = existingFriendContainer;

      // 컨테이너가 없으면 새로 생성
      if (!friendContainer) {
        friendContainer = document.createElement("div");
        friendContainer.id = "friend-container";
        document.body.appendChild(friendContainer);
      }

      // 친구 컴포넌트 초기화
      this.friendComponent = new FriendComponent(friendContainer);
      await this.friendComponent.render();
    } else {
      // 기존 친구 컴포넌트가 있으면 웹소켓만 재연결
      friendWebSocketManager.connect();
      console.log("기존 친구창 재사용 및 웹소켓 재연결");
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
