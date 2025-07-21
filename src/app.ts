import { Router } from "./router";
import { LoginComponent } from "./components/login/LoginComponent";
import { GameComponent } from "./components/game/GameComponent";
import { AuthManager } from "./utils/auth";
import "./types/global"; // 글로벌 타입 선언
import { Layout } from "./pages/Layout";
import { LobbyListComponent } from "./components/lobby/lobbyList/LobbyListComponent";
import { LobbyDetailComponent } from "./components/lobby/lobbyDetail/LobbyDetailComponent";
import { UserInfoComponent } from "./components/user/UserInfoComponent";

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

    // if (isAuthenticated) {
    //   // 인증된 사용자
    //   if (currentPath === "/login") {
    //     // 로그인 페이지에 있다면 메인 페이지로 이동
    //     this.router.navigate("/");
    //   } else {
    //     // 현재 경로 유지
    //     this.router.navigate(currentPath, false);
    //   }
    // } else {
    //   // 인증되지 않은 사용자는 로그인 페이지로
    //   this.router.navigate("/login", currentPath !== "/login");
    // }

    this.router.navigate(currentPath, false);
  }

  private setupRoutes(): void {
    console.log('라우트 설정 중...');
    
    // 로그인 페이지
    this.router.addRoute("/login", async () => {
      console.log('로그인 페이지 라우트 실행');
      await this.loadComponent(LoginComponent);
    });

    // 메인 페이지 (로비 리스트) - Layout 내에서 LobbyListComponent 렌더링
    this.router.addRoute("/", async () => {
      console.log('메인 페이지 (로비 리스트) 라우트 실행');
      await this.loadLayoutWithComponent(LobbyListComponent);
    });

    // 로비 목록 페이지 (헤더에서 접근)
    this.router.addRoute("/lobby", async () => {
      console.log('로비 목록 페이지 라우트 실행');
      await this.loadLayoutWithComponent(LobbyListComponent);
    });

    // 대시보드 페이지
    this.router.addRoute("/dashboard", async () => {
      console.log('대시보드 페이지 라우트 실행');
      // 대시보드 컴포넌트가 있다면 사용, 없으면 로비 리스트로 리다이렉트
      await this.loadLayoutWithComponent(LobbyListComponent);
    });

    // 프로필 페이지
    this.router.addRoute("/profile", async () => {
      console.log('프로필 페이지 라우트 실행');
      // 프로필 컴포넌트가 있다면 사용, 없으면 로비 리스트로 리다이렉트
      await this.loadLayoutWithComponent(LobbyListComponent);
    });

    // 로비 상세 페이지 - 동적 라우트
    this.router.addDynamicRoute("/lobby/:id", async (params: any) => {
      console.log('로비 상세 페이지 라우트 실행, ID:', params.id);
      await this.loadLayoutWithComponent(LobbyDetailComponent, params.id);
    });

    // 사용자 정보 페이지 - 동적 라우트
    this.router.addDynamicRoute("/info/:id", async (params: any) => {
      console.log('사용자 정보 페이지 라우트 실행, ID:', params.id);
      await this.loadLayoutWithComponent(UserInfoComponent, params.id);
    });
    
    console.log('라우트 설정 완료');
  }

  private async loadComponent(ComponentClass: any): Promise<void> {
    console.log('컴포넌트 로딩 시작:', ComponentClass.name);
    
    // 기존 컴포넌트 정리
    if (this.currentComponent) {
      this.currentComponent.destroy();
    }

    // 새 컴포넌트 로드
    this.currentComponent = new ComponentClass(this.appContainer);
    console.log('컴포넌트 생성 완료, 렌더링 시작...');
    await this.currentComponent.render();
    console.log('컴포넌트 렌더링 완료');
  }

  private async loadLayoutWithComponent(ComponentClass: any, ...args: any[]): Promise<void> {
    console.log('레이아웃과 함께 컴포넌트 로딩 시작:', ComponentClass.name);
    
    // 기존 컴포넌트 정리
    if (this.currentComponent) {
      this.currentComponent.destroy();
    }

    // Layout 컴포넌트 생성
    this.currentComponent = new Layout(this.appContainer);
    await this.currentComponent.render();

    // 메인 콘텐츠 영역에 특정 컴포넌트 렌더링
    const mainContentContainer = document.getElementById('main-content');
    if (mainContentContainer) {
      const mainComponent = new ComponentClass(mainContentContainer, ...args);
      await mainComponent.render();
      
      // Layout 컴포넌트에 메인 컴포넌트 저장 (나중에 정리하기 위해)
      if (this.currentComponent && this.currentComponent.setMainComponent) {
        this.currentComponent.setMainComponent(mainComponent);
      }
    }
    
    console.log('레이아웃과 컴포넌트 렌더링 완료');
  }
}

// 페이지 로드 시 앱 초기화
document.addEventListener("DOMContentLoaded", () => {
  new App();
});
