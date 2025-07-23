import { Component } from "../Component";
import { AuthManager } from "../../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class SignupComponent extends Component {
  private formElement: HTMLFormElement | null = null;

  private getTemplate(): string {
    return `
<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 p-4">
  <div class="w-full max-w-lg mx-auto p-8 bg-white/95 rounded-3xl shadow-xl border border-white/30">
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">회원가입</h2>
      <p class="text-gray-600 mt-2">새로운 계정을 만들어보세요</p>
    </div>

    <form id="signupForm" class="space-y-6">
      <!-- 프로필 이미지 섹션 -->
      <div>
        <label class="block text-sm font-medium mb-2">프로필 이미지</label>
        <div id="profileImageArea" class="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
          <span id="profileImageText" class="text-gray-400">이미지를 클릭하여 선택</span>
          <img id="profileImagePreview" src="" alt="프로필 이미지" class="hidden h-full object-contain rounded-lg" />
          <input type="file" id="profileImage" name="profileImage" accept="image/*" class="hidden" />
        </div>
        <p class="text-xs text-gray-500 mt-1">JPG, PNG 파일 (최대 5MB)</p>
      </div>

      <!-- 사용자명 입력 -->
      <div>
        <label for="username" class="block text-sm font-medium mb-2">사용자명</label>
        <input 
          type="text" 
          id="username" 
          name="username" 
          required 
          class="login-input" 
          placeholder="사용자명을 입력하세요"
          minlength="3" 
          maxlength="20"
        />
        <div class="flex justify-end mt-1">
          <span id="usernameCharCount" class="text-xs text-gray-500">0/20</span>
        </div>
      </div>

      <!-- 닉네임 입력 -->
      <div>
        <label for="nickname" class="block text-sm font-medium mb-2">닉네임</label>
        <input 
          type="text" 
          id="nickname" 
          name="nickname" 
          required 
          class="login-input" 
          placeholder="닉네임을 입력하세요"
          maxlength="20" 
        />
        <div class="flex justify-end mt-1">
          <span id="nicknameCharCount" class="text-xs text-gray-500">0/20</span>
        </div>
      </div>

      <!-- 비밀번호 입력 -->
      <div>
        <label for="password" class="block text-sm font-medium mb-2">비밀번호</label>
        <input 
          type="password" 
          id="password" 
          name="password" 
          required 
          class="login-input" 
          placeholder="비밀번호를 입력하세요"
          minlength="8"
        />
        <p class="text-xs text-gray-500 mt-1">최소 8자 이상 입력해주세요</p>
      </div>

      <!-- 비밀번호 확인 -->
      <div>
        <label for="confirmPassword" class="block text-sm font-medium mb-2">비밀번호 확인</label>
        <input 
          type="password" 
          id="confirmPassword" 
          name="confirmPassword" 
          required 
          class="login-input" 
          placeholder="비밀번호를 다시 입력하세요"
        />
      </div>

      <!-- 회원가입 버튼 -->
      <button type="submit" class="btn-primary w-full">계정 만들기</button>
    </form>

    <!-- 로그인 링크 -->
    <div class="mt-6 text-center">
      <span class="text-gray-600">이미 계정이 있으신가요? </span>
      <a href="#" class="login-link text-indigo-600 hover:text-indigo-800 font-medium">로그인</a>
    </div>

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
        response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          body: multipart,
        });
      } else {
        response = await fetch(`${API_BASE_URL}/auth/register`, {
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
