import { Component } from "../Component";
import { AuthManager } from "../../utils/auth";
import { OAuthComponent } from "../auth/OAuthComponent";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
    this.formElement = this.container.querySelector("#loginForm") as HTMLFormElement;

    if (this.formElement) {
      this.formElement.addEventListener("submit", this.handleLogin.bind(this));
    }

    // 소셜 로그인 버튼 이벤트 리스너 추가
    const socialButtons = this.container.querySelectorAll(".social-btn");
    socialButtons.forEach((button) => {
      button.addEventListener("click", this.handleSocialLogin.bind(this));
    });

    // 회원가입 버튼 이벤트 리스너 추가
    const signupLink = this.container.querySelector(".signup-link a");
    if (signupLink) {
      signupLink.addEventListener("click", this.handleSignup.bind(this));
    }
  }

  private async handleSocialLogin(event: Event): Promise<void> {
    event.preventDefault();
    const button = event.target as HTMLButtonElement;
    const provider = button.textContent?.trim();

    if (!provider) {
      this.showError("제공자를 확인할 수 없습니다.");
      return;
    }

    try {
      let result;

      switch (provider) {
        case "Google":
          result = await OAuthComponent.loginWithGoogle();
          break;
        case "42":
          result = await OAuthComponent.loginWith42();
          break;
        default:
          this.showError(`${provider} 로그인은 준비 중입니다.`);
          return;
      }

      if (result.success) {
        // 메인 페이지로 이동
        window.router.navigate("/");
      } else {
        this.showError(result.message || `${provider} 로그인에 실패했습니다.`);
      }
    } catch (error) {
      console.error(`${provider} 로그인 오류:`, error);
      this.showError(`${provider} 로그인 중 오류가 발생했습니다.`);
    }
  }

  private handleSignup(event: Event): void {
    event.preventDefault();
    // 예시: 회원가입 페이지로 이동
    window.router.navigate("/signup");
  }

  private async handleLogin(event: Event): Promise<void> {
    event.preventDefault();

    const formData = new FormData(this.formElement!);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const token = formData.get("token") as string;

    if (!username || !password) {
      this.showError("사용자명과 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      this.setLoading(true);

      // 2FA 입력 필드가 아직 없는 경우 (첫 로그인 시도)
      const has2FAInput = !!this.container.querySelector(".twofa-input-container");

      if (!has2FAInput) {
        // 먼저 2FA 활성화 여부 확인
        const is2FAEnabled = await this.check2FAEnabled(username, password);

        if (is2FAEnabled) {
          // 2FA가 활성화된 경우 입력 필드 표시하고 토큰 요구
          this.show2FAInput();
          this.showError("2FA가 활성화된 계정입니다. 인증 코드를 입력해주세요.");
          this.setLoading(false);
          return;
        } else {
          // 2FA가 비활성화된 경우 바로 로그인 진행
          await AuthManager.login(username, password);

          // 로그인 성공 시 친구 컴포넌트 초기화를 위해 앱에 알림
          // if ((window as any).app) {
          //   await (window as any).app.initializeFriendComponent();
          // }
          // 메인 페이지로 이동
          window.router.navigate("/");
          return;
        }
      }

      // 2FA가 활성화되어 있고 토큰이 입력된 경우 로그인 시도
      if (has2FAInput && token) {
        await AuthManager.login(username, password, token);

        // 로그인 성공 시 친구 컴포넌트 초기화를 위해 앱에 알림
        if ((window as any).app) {
          await (window as any).app.initializeFriendComponent();
        }
        // 메인 페이지로 이동
        window.router.navigate("/");
      } else if (has2FAInput && !token) {
        // 2FA 필드가 있지만 토큰이 입력되지 않은 경우
        this.showError("인증 코드를 입력해주세요.");
        this.setLoading(false);
        return;
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      this.showError(error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      this.setLoading(false);
    }
  }

  // 2FA 활성화 여부 확인
  private async check2FAEnabled(username: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, passwd: password }),
      });

      if (!response.ok) {
        // 사용자명/비밀번호가 잘못된 경우 등
        const error = await response.json();
        throw new Error(error.message || "사용자 확인 중 오류가 발생했습니다.");
      }

      const result = await response.json();

      // API 응답에서 2FA 활성화 여부를 확인
      // API는 { isValid: boolean } 형태로 응답함
      return result.data?.isValid || false;
    } catch (error) {
      // check API 실패 시에는 에러를 다시 던져서 로그인을 중단
      console.error("2FA 확인 중 오류:", error);
      throw error;
    }
  }

  private show2FAInput(): void {
    // 기존 2FA 입력 필드가 있으면 제거
    const existing2FAInput = this.container.querySelector(".twofa-input-container");
    if (existing2FAInput) {
      existing2FAInput.remove();
    }

    // 2FA 입력 필드 HTML 생성
    const twoFAHTML = `
      <div class="twofa-input-container space-y-4 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="text-center">
          <p class="text-sm font-medium text-blue-700 mb-2">2FA 인증 코드 입력</p>
          <p class="text-xs text-blue-600 mb-4">Google Authenticator 앱에서 6자리 코드를 확인하세요</p>
        </div>
        <div>
          <label for="token" class="block text-sm font-medium text-primary-700 mb-2">인증 코드 (6자리)</label>
          <input
            type="text"
            id="token"
            name="token"
            maxlength="6"
            class="login-input text-center text-xl tracking-wider"
            placeholder="000000"
            autocomplete="off"
          />
        </div>
      </div>
    `;

    // 로그인 버튼 앞에 2FA 입력 필드 삽입
    const submitButton = this.container.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.insertAdjacentHTML("beforebegin", twoFAHTML);

      // 2FA 입력 필드에 포커스 및 이벤트 설정
      const tokenInput = this.container.querySelector("#token") as HTMLInputElement;
      if (tokenInput) {
        this.setup2FATokenInput(tokenInput);
      }
    }
  }

  // 2FA 토큰 입력 필드 이벤트 설정
  private setup2FATokenInput(tokenInput: HTMLInputElement): void {
    tokenInput.focus();

    // 숫자만 입력 허용
    tokenInput.addEventListener("input", (e) => {
      const input = e.target as HTMLInputElement;
      input.value = input.value.replace(/[^0-9]/g, "");
    });

    // Enter 키로 로그인
    tokenInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const submitBtn = this.container.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitBtn) {
          submitBtn.click();
        }
      }
    });
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
    const submitButton = this.container.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    const inputs = this.container.querySelectorAll("input") as NodeListOf<HTMLInputElement>;

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
    // 이벤트 리스너 정리
    if (this.formElement) {
      this.formElement.removeEventListener("submit", this.handleLogin.bind(this));
    }

    const socialButtons = this.container.querySelectorAll(".social-btn");
    socialButtons.forEach((button) => {
      button.removeEventListener("click", this.handleSocialLogin.bind(this));
    });

    const signupLink = this.container.querySelector(".signup-link a");
    if (signupLink) {
      signupLink.removeEventListener("click", this.handleSignup.bind(this));
    }

    // 2FA 모달이나 에러 메시지 정리
    const existingError = this.container.querySelector(".error-message");
    if (existingError) {
      existingError.remove();
    }

    const existing2FAInput = this.container.querySelector(".twofa-input-container");
    if (existing2FAInput) {
      existing2FAInput.remove();
    }

    // 컨테이너는 앱에서 관리하므로 여기서는 비우지 않음
    // this.clearContainer();
  }
}
