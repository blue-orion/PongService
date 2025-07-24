// 라우터 시스템
export class Router {
  private routes: Map<string, (params?: any) => void | Promise<void>> = new Map();
  private dynamicRoutes: Array<{ pattern: RegExp; handler: (params: any) => void | Promise<void> }> = [];
  private currentRoute: string = "";

  constructor() {
    // 브라우저 뒤로가기/앞으로가기 처리
    window.addEventListener("popstate", () => {
      this.navigate(window.location.pathname, false);
    });
  }

  // 정적 라우트 등록
  addRoute(path: string, handler: (params?: any) => void | Promise<void>): void {
    this.routes.set(path, handler);
  }

  // 동적 라우트 등록 (매개변수 포함)
  addDynamicRoute(pattern: string, handler: (params: any) => void | Promise<void>): void {
    // /lobby/:id 형태를 정규식으로 변환
    const regexPattern = pattern.replace(/:[^/]+/g, "([^/]+)");
    const regex = new RegExp(`^${regexPattern}$`);

    // 매개변수 이름 추출
    const paramNames = pattern.match(/:[^/]+/g)?.map((param) => param.substring(1)) || [];

    this.dynamicRoutes.push({
      pattern: regex,
      handler: (path: string) => {
        const matches = path.match(regex);
        if (matches) {
          const params: any = {};
          paramNames.forEach((name, index) => {
            params[name] = matches[index + 1];
          });
          return handler(params);
        }
      },
    });
  }

  // 페이지 이동
  async navigate(path: string, pushState: boolean = true): Promise<void> {
    console.trace("navigate 호출됨:", path);
    // 먼저 정적 라우트 확인
    const staticHandler = this.routes.get(path);
    if (staticHandler) {
      this.currentRoute = path;

      if (pushState) {
        window.history.pushState({}, "", path);
      }

      await staticHandler();
      return;
    }

    // 동적 라우트 확인
    for (const dynamicRoute of this.dynamicRoutes) {
      if (dynamicRoute.pattern.test(path)) {
        this.currentRoute = path;

        if (pushState) {
          window.history.pushState({}, "", path);
        }

        await dynamicRoute.handler(path);
        return;
      }
    }

    // 라우트를 찾지 못한 경우
    console.warn(`Route not found: ${path}`);
    // 로비 리스트로 리다이렉트 (기본 페이지)
    await this.navigate("/", pushState);
  }

  // 현재 라우트 확인
  getCurrentRoute(): string {
    return this.currentRoute;
  }

  // 초기화 - 현재 URL에 맞는 페이지 로드
  async init(): Promise<void> {
    const currentPath = window.location.pathname;
    await this.navigate(currentPath, false);
  }

  // 뒤로가기
  goBack(): void {
    window.history.back();
  }

  // 앞으로가기
  goForward(): void {
    window.history.forward();
  }

  // 히스토리 길이 확인 (뒤로갈 페이지가 있는지)
  canGoBack(): boolean {
    return window.history.length > 1;
  }
}
