import { Component } from "./Component";
import { AuthManager } from "../utils/auth";

export class LoginComponent extends Component {
  private formElement: HTMLFormElement | null = null;

  render(): void {
    this.clearContainer();

    this.container.innerHTML = `
      <div class="bg-gradient-full min-h-screen flex items-center justify-center relative overflow-hidden">
        <!-- 배경 플로팅 요소들 -->
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute top-20 left-20 w-20 h-20 bg-primary-300/30 rounded-full floating"></div>
          <div class="absolute top-40 right-40 w-16 h-16 bg-secondary-300/30 rounded-full floating" style="animation-delay: -2s"></div>
          <div class="absolute bottom-32 left-32 w-12 h-12 bg-neutral-300/30 rounded-full floating" style="animation-delay: -4s"></div>
          <div class="absolute bottom-20 right-20 w-24 h-24 bg-primary-200/20 rounded-full floating" style="animation-delay: -1s"></div>
        </div>

        <!-- 메인 로그인 컨테이너 -->
        <div class="login-container w-full max-w-md mx-4">
          <!-- 헤더 -->
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4 shadow-glow-primary">
              <span class="text-3xl">🏓</span>
            </div>
            <h1 class="text-3xl font-bold text-primary-800 mb-2">Pong Game</h1>
            <p class="text-primary-600">실시간 멀티플레이어 핑퐁 게임에 오신 것을 환영합니다</p>
          </div>

          <!-- 로그인 폼 -->
          <form id="loginForm" class="space-y-6">
            <div class="space-y-4">
              <div>
                <label for="username" class="block text-sm font-medium text-primary-700 mb-2">사용자명</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  class="login-input"
                  placeholder="사용자명을 입력하세요"
                  autocomplete="username"
                />
              </div>

              <div>
                <label for="password" class="block text-sm font-medium text-primary-700 mb-2">비밀번호</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  class="login-input"
                  placeholder="비밀번호를 입력하세요"
                  autocomplete="current-password"
                />
              </div>
            </div>

            <button type="submit" class="btn-primary w-full">
              로그인
            </button>
          </form>

          <!-- 추가 정보 -->
          <div class="mt-8 text-center">
            <div class="flex items-center justify-center space-x-2 text-sm text-primary-600">
              <div class="w-2 h-2 bg-secondary-400 rounded-full animate-pulse"></div>
              <span>실시간 매칭 시스템</span>
            </div>
            <div class="flex items-center justify-center space-x-2 text-sm text-primary-600 mt-2">
              <div class="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
              <span>글로벌 리더보드</span>
            </div>
          </div>

          <!-- 푸터 -->
          <div class="mt-8 text-center text-xs text-primary-500">
            <p>© 2024 Pong Game. 최고의 게임 경험을 제공합니다.</p>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.formElement = this.container.querySelector("#loginForm") as HTMLFormElement;

    if (this.formElement) {
      this.formElement.addEventListener("submit", this.handleLogin.bind(this));
    }
  }

  private async handleLogin(event: Event): Promise<void> {
    event.preventDefault();

    const formData = new FormData(this.formElement!);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
      this.showError("사용자명과 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      this.setLoading(true);
      const success = await AuthManager.login(username, password);

      if (success) {
        // 로그인 성공 시 메인 페이지로 이동
        window.router.navigate("/");
      } else {
        this.showError("로그인에 실패했습니다. 사용자명과 비밀번호를 확인해주세요.");
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      this.showError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      this.setLoading(false);
    }
  }

  private showError(message: string): void {
    // 기존 에러 메시지 제거
    const existingError = this.container.querySelector(".error-message");
    if (existingError) {
      existingError.remove();
    }

    // 새 에러 메시지 표시
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message bg-red-500/10 border border-red-500/20 text-red-700 p-3 rounded-lg mt-4";
    errorDiv.textContent = message;

    this.formElement?.appendChild(errorDiv);

    // 5초 후 자동 제거
    setTimeout(() => errorDiv.remove(), 5000);
  }

  private setLoading(loading: boolean): void {
    const submitButton = this.container.querySelector('button[type="submit"]') as HTMLButtonElement;
    const inputs = this.container.querySelectorAll("input") as NodeListOf<HTMLInputElement>;

    if (loading) {
      submitButton.disabled = true;
      submitButton.textContent = "로그인 중...";
      inputs.forEach((input) => (input.disabled = true));
    } else {
      submitButton.disabled = false;
      submitButton.textContent = "로그인";
      inputs.forEach((input) => (input.disabled = false));
    }
  }

  destroy(): void {
    if (this.formElement) {
      this.formElement.removeEventListener("submit", this.handleLogin.bind(this));
    }
  }
}
