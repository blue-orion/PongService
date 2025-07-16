import { AuthManager } from "./utils/auth";

class LoginManager {
  private form: HTMLFormElement;
  private usernameInput: HTMLInputElement;
  private passwordInput: HTMLInputElement;
  private loginButton: HTMLButtonElement;
  private loginButtonText: HTMLElement;
  private loginSpinner: HTMLElement;
  private messageArea: HTMLElement;

  constructor() {
    this.form = document.getElementById("loginForm") as HTMLFormElement;
    this.usernameInput = document.getElementById("username") as HTMLInputElement;
    this.passwordInput = document.getElementById("password") as HTMLInputElement;
    this.loginButton = document.getElementById("loginButton") as HTMLButtonElement;
    this.loginButtonText = document.getElementById("loginButtonText") as HTMLElement;
    this.loginSpinner = document.getElementById("loginSpinner") as HTMLElement;
    this.messageArea = document.getElementById("messageArea") as HTMLElement;

    this.setupEventListeners();
    this.checkExistingAuth();
  }

  private setupEventListeners(): void {
    // 폼 제출 이벤트
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // 게스트 로그인
    const guestLoginLink = document.getElementById("guestLogin");
    if (guestLoginLink) {
      guestLoginLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleGuestLogin();
      });
    }

    // Enter 키 처리
    [this.usernameInput, this.passwordInput].forEach((input) => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.handleLogin();
        }
      });
    });
  }

  private async checkExistingAuth(): Promise<void> {
    // 이미 로그인된 상태라면 게임 페이지로 리다이렉트
    if (AuthManager.isTokenValid()) {
      this.showMessage("이미 로그인되어 있습니다. 게임 페이지로 이동합니다...", "success");
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 1500);
    }
  }

  private async handleLogin(): Promise<void> {
    const username = this.usernameInput.value.trim();
    const password = this.passwordInput.value;

    if (!username || !password) {
      this.showMessage("사용자명과 비밀번호를 모두 입력해주세요.", "error");
      return;
    }

    this.setLoading(true);
    this.clearMessage();

    try {
      const loginResponse = await AuthManager.login(username, password);

      this.showMessage(`환영합니다, ${loginResponse.user.username}님!`, "success");

      // 1초 후 게임 페이지로 리다이렉트
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 1000);
    } catch (error) {
      console.error("로그인 실패:", error);
      this.showMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.", "error");
    } finally {
      this.setLoading(false);
    }
  }

  private async handleGuestLogin(): Promise<void> {
    this.setLoading(true);
    this.clearMessage();

    try {
      // 게스트 계정으로 로그인 시도
      await AuthManager.login("guest", "guest123");

      this.showMessage("게스트로 로그인되었습니다!", "success");

      setTimeout(() => {
        window.location.href = "/index.html";
      }, 1000);
    } catch (error) {
      console.error("게스트 로그인 실패:", error);
      this.showMessage("게스트 로그인에 실패했습니다.", "error");
    } finally {
      this.setLoading(false);
    }
  }

  private setLoading(loading: boolean): void {
    this.loginButton.disabled = loading;

    if (loading) {
      this.loginButtonText.classList.add("hidden");
      this.loginSpinner.classList.remove("hidden");
    } else {
      this.loginButtonText.classList.remove("hidden");
      this.loginSpinner.classList.add("hidden");
    }
  }

  private showMessage(message: string, type: "success" | "error"): void {
    this.clearMessage();

    const messageDiv = document.createElement("div");
    messageDiv.className = type === "success" ? "success-message" : "error-message";
    messageDiv.textContent = message;

    this.messageArea.appendChild(messageDiv);

    // 5초 후 메시지 자동 제거 (성공 메시지는 제외)
    if (type === "error") {
      setTimeout(() => {
        this.clearMessage();
      }, 5000);
    }
  }

  private clearMessage(): void {
    this.messageArea.innerHTML = "";
  }
}

// 페이지 로드 시 로그인 매니저 초기화
document.addEventListener("DOMContentLoaded", () => {
  new LoginManager();
});
