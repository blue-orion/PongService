import { Router } from "./router";
import { LoginComponent } from "./components/LoginComponent";
import { GameComponent } from "./components/GameComponent";
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
    this.router.init();
  }

  private setupRoutes(): void {
    // 로그인 페이지
    this.router.addRoute("/login", () => {
      this.loadComponent(LoginComponent);
    });

    // 메인 게임 페이지
    this.router.addRoute("/", () => {
      this.loadComponent(GameComponent);
    });
  }

  private loadComponent(ComponentClass: any): void {
    // 기존 컴포넌트 정리
    if (this.currentComponent) {
      this.currentComponent.destroy();
    }

    // 새 컴포넌트 로드
    this.currentComponent = new ComponentClass(this.appContainer);
    this.currentComponent.render();
  }
}

// 페이지 로드 시 앱 초기화
document.addEventListener("DOMContentLoaded", () => {
  new App();
});
