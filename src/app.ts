import { Router } from "./router";
import { LoginComponent } from "./components/login/LoginComponent";
import { GameComponent } from "./components/game/GameComponent";
import { AuthManager } from "./utils/auth";
import "./styles/input.css";
import "./types/global"; // 글로벌 타입 선언

class App {
  private router: Router;
  private appContainer: HTMLElement;
  private currentComponent: any = null;

  constructor() {
    this.appContainer = document.getElementById("app")!;
    this.router = new Router();

    // 글로벌 라우터 참조 설정
    window.router = this.router;

    this.setupRoutes();
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    // 인증 상태 확인 (리다이렉트 없음)
    const isAuthenticated = await AuthManager.checkAuth();

    // 현재 URL 경로 확인
    const currentPath = window.location.pathname;

    if (isAuthenticated) {
      // 인증된 사용자
      if (currentPath === "/login") {
        // 로그인 페이지에 있다면 메인 페이지로 이동
        this.router.navigate("/");
      } else {
        // 현재 경로 유지
        this.router.navigate(currentPath, false);
      }
    } else {
      // 인증되지 않은 사용자는 로그인 페이지로
      this.router.navigate("/login", currentPath !== "/login");
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
  }
}

// 페이지 로드 시 앱 초기화
document.addEventListener("DOMContentLoaded", () => {
  new App();
});
