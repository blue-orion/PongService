import { Component } from "../Component";
import { AuthManager } from "../../utils/auth";

export class LoginComponent extends Component {
  private formElement: HTMLFormElement | null = null;

  private getTemplate(): string {
    return `
<div class="bg-gradient-full min-h-screen flex items-center justify-center relative overflow-hidden">
  <!-- 배경 플로팅 요소들 -->
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-20 left-20 w-20 h-20 bg-primary-300/30 rounded-full floating"></div>
    <div
      class="absolute top-40 right-40 w-16 h-16 bg-secondary-300/30 rounded-full floating"
      style="animation-delay: -2s"
    ></div>
    <div
      class="absolute bottom-32 left-32 w-12 h-12 bg-neutral-300/30 rounded-full floating"
      style="animation-delay: -4s"
    ></div>
    <div
      class="absolute bottom-20 right-20 w-24 h-24 bg-primary-200/20 rounded-full floating"
      style="animation-delay: -1s"
    ></div>
  </div>

  <!-- 메인 로그인 컨테이너 -->
  <div class="login-container w-full max-w-md mx-4">
    <!-- 헤더 -->
    <div class="logo">
      <h1>pong</h1>
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

      <div class="form-options">
        <div></div>
        <a href="#" class="forgot-password">비밀번호 찾기</a>
      </div>

      <button type="submit" class="btn-primary w-full">로그인</button>
    </form>

    <div class="divider">
      <span>또는</span>
    </div>

    <div class="social-login">
      <button class="social-btn" type="button">Google</button>
      <button class="social-btn" type="button">42</button>
    </div>

    <div class="signup-link">아직 계정이 없으신가요? <a href="#">회원가입</a></div>

    <!-- 푸터 -->
    <div class="mt-8 text-center text-xs text-gray-400">
      <p>2025 Transcendence Pong</p>
    </div>
  </div>
</div>
    `;
  }

  async render(): Promise<void> {
    this.clearContainer();

    this.container.innerHTML = this.getTemplate();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.formElement = this.container.querySelector(
      "#loginForm",
    ) as HTMLFormElement;

    if (this.formElement) {
      this.formElement.addEventListener("submit", this.handleLogin.bind(this));
    }

    // 소셜 로그인 버튼 이벤트 리스너 추가
    const socialButtons = this.container.querySelectorAll(".social-btn");
    socialButtons.forEach((button) => {
      button.addEventListener("click", this.handleSocialLogin.bind(this));
    });

    // 회원가입 버튼 이벤트 리스너 추가
    const signupLink = this.container.querySelector('.signup-link a');
    if (signupLink) {
      signupLink.addEventListener('click', this.handleSignup.bind(this));
    }
  }

  private handleSocialLogin(event: Event): void {
    event.preventDefault();
    const button = event.target as HTMLButtonElement;
    const provider = button.textContent?.trim();

    let socialUrl = "";
    if (provider === "Google") {
      socialUrl = "http://localhost:3333/v1/auth/google";
    } else if (provider === "42") {
      socialUrl = "http://localhost:3333/v1/auth/42";
    } else {
      this.showError(`${provider} 로그인은 준비 중입니다.`);
      return;
    }
    window.location.href = socialUrl;
  }
  
  private handleSignup(event: Event): void {
    event.preventDefault();
    // 예시: 회원가입 페이지로 이동
    window.router.navigate('/signup');
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
        // 로그인 성공 시 친구 컴포넌트 초기화를 위해 앱에 알림
        if ((window as any).app) {
          await (window as any).app.initializeFriendComponent();
        }
        // 메인 페이지로 이동
        window.router.navigate("/");
      } else {
        this.showError(
          "로그인에 실패했습니다. 사용자명과 비밀번호를 확인해주세요.",
        );
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
    errorDiv.className =
      "error-message bg-red-500/10 border border-red-500/20 text-red-700 p-3 rounded-lg mt-4";
    errorDiv.textContent = message;

    this.formElement?.appendChild(errorDiv);

    // 5초 후 자동 제거
    setTimeout(() => errorDiv.remove(), 5000);
  }

  private setLoading(loading: boolean): void {
    const submitButton = this.container.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;
    const inputs = this.container.querySelectorAll(
      "input",
    ) as NodeListOf<HTMLInputElement>;

    if (!submitButton) return;

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
      this.formElement.removeEventListener(
        "submit",
        this.handleLogin.bind(this),
      );
    }
  }
}
