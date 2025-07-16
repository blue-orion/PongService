// 라우터 시스템
export class Router {
  private routes: Map<string, () => void> = new Map();
  private currentRoute: string = "";

  constructor() {
    // 브라우저 뒤로가기/앞으로가기 처리
    window.addEventListener("popstate", () => {
      this.navigate(window.location.pathname, false);
    });
  }

  // 라우트 등록
  addRoute(path: string, handler: () => void): void {
    this.routes.set(path, handler);
  }

  // 페이지 이동
  navigate(path: string, pushState: boolean = true): void {
    const handler = this.routes.get(path);

    if (handler) {
      this.currentRoute = path;

      if (pushState) {
        window.history.pushState({}, "", path);
      }

      handler();
    } else {
      console.warn(`Route not found: ${path}`);
      // 기본 페이지로 리다이렉트
      this.navigate("/", pushState);
    }
  }

  // 현재 라우트 확인
  getCurrentRoute(): string {
    return this.currentRoute;
  }

  // 초기화 - 현재 URL에 맞는 페이지 로드
  init(): void {
    const currentPath = window.location.pathname;
    this.navigate(currentPath, false);
  }
}
