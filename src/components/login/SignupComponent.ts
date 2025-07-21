import { Component } from "../Component";
import { AuthManager } from "../../utils/auth";

export class SignupComponent extends Component {
  private formElement: HTMLFormElement | null = null;

  async render(): Promise<void> {
    this.clearContainer();
    const template = await fetch("/src/components/login/signup.template.html").then(res => res.text());
    this.container.innerHTML = template;
    this.setupEventListeners();
    this.setupProfileImageArea();
  }

  private setupProfileImageArea(): void {
    const area = this.container.querySelector("#profileImageArea") as HTMLElement;
    const fileInput = this.container.querySelector("#profileImage") as HTMLInputElement;
    const previewImg = this.container.querySelector("#profileImagePreview") as HTMLImageElement;
    const textSpan = this.container.querySelector("#profileImageText") as HTMLElement;
    if (!area || !fileInput || !previewImg || !textSpan) return;

    // 클릭 시 파일 선택
    area.addEventListener("click", () => fileInput.click());

    // 파일 선택 시 미리보기
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewImg.src = ev.target?.result as string;
          previewImg.classList.remove("hidden");
          textSpan.classList.add("hidden");
        };
        reader.readAsDataURL(file);
      } else {
        previewImg.src = "";
        previewImg.classList.add("hidden");
        textSpan.classList.remove("hidden");
      }
    });
  }

  private setupEventListeners(): void {
    this.formElement = this.container.querySelector("#signupForm") as HTMLFormElement;
    if (this.formElement) {
      this.formElement.addEventListener("submit", this.handleSignup.bind(this));
    }
  }

  private async handleSignup(event: Event): Promise<void> {
    event.preventDefault();
    const formData = new FormData(this.formElement!);
    const username = formData.get("username") as string;
    const nickname = formData.get("nickname") as string;
    const passwd = formData.get("password") as string;
    const confirmPasswd = formData.get("confirmPassword") as string;
    const profileImageFile = (formData.get("profileImage") as File) || null;

    if (!username || !nickname || !passwd || !confirmPasswd) {
      this.showError("모든 항목을 입력해주세요.");
      return;
    }
    if (passwd !== confirmPasswd) {
      this.showError("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const signupData: any = { username, nickname, passwd, confirmPasswd };
      // 프로필 이미지가 있으면 FormData로 전송, 없으면 JSON
      let response;
      if (profileImageFile && profileImageFile.size > 0) {
        const multipart = new FormData();
        multipart.append("username", username);
        multipart.append("nickname", nickname);
        multipart.append("passwd", passwd);
        multipart.append("confirmPasswd", confirmPasswd);
        multipart.append("profileImage", profileImageFile);
        response = await fetch("http://localhost:3333/v1/auth/register", {
          method: "POST",
          body: multipart,
        });
      } else {
        response = await fetch("http://localhost:3333/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(signupData),
        });
      }
      if (!response.ok) {
        const error = await response.json();
        this.showError(error.message || "회원가입에 실패했습니다.");
        return;
      }
      window.router.navigate("/login");
    } catch (error) {
      this.showError("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }

  private showError(message: string): void {
    // 기존 에러 메시지 제거
    const existingError = this.container.querySelector(".error-message");
    if (existingError) existingError.remove();
    // 새 에러 메시지 표시
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message bg-red-500/10 border border-red-500/20 text-red-700 p-3 rounded-lg mt-4";
    errorDiv.textContent = message;
    this.formElement?.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }

  destroy(): void {
    if (this.formElement) {
      this.formElement.removeEventListener("submit", this.handleSignup.bind(this));
    }
  }
}
