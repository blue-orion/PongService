import { Component } from "../Component";
import { AuthManager } from "../../utils/auth";
import { loadTemplate, TEMPLATE_PATHS } from "../../utils/template-loader";

export class LoginComponent extends Component {
  private formElement: HTMLFormElement | null = null;

  async render(): Promise<void> {
    this.clearContainer();

    const template = await loadTemplate(TEMPLATE_PATHS.LOGIN);
    this.container.innerHTML = template;
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
        // 로그인 성공 시 메인 페이지로 이동
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
