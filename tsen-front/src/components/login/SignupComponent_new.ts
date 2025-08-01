import { Component } from "../Component";
import { AuthManager } from "../../utils/auth";
import "../../styles/main.css";

export class SignupComponent extends Component {
  private formElement: HTMLFormElement | null = null;

  constructor(container: HTMLElement) {
    super(container);
  }

  private getTemplate(): string {
    return `
<div class="bg-gradient-full min-h-screen flex items-center justify-center p-4">
  <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-primary-800 mb-2">회원가입</h1>
      <p class="text-gray-600 mt-2">새로운 계정을 만들어보세요</p>
    </div>

    <form id="signupForm" class="space-y-6">
      <!-- 프로필 이미지 섹션 -->
      <div>
        <label class="block text-sm font-medium mb-2">프로필 이미지 (선택사항)</label>
        <div class="flex items-center gap-4">
          <div class="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-300 transition-colors border-2 border-gray-300 hover:border-indigo-400" id="profileImageArea">
            <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div class="flex-1">
            <input type="file" id="profileImage" name="profileImage" accept="image/*" class="hidden">
            <div class="text-sm text-gray-500">이미지를 클릭하여 선택하세요</div>
            <div class="text-xs text-gray-400 mt-1">JPG, PNG 파일 (최대 5MB)</div>
          </div>
        </div>
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
          minlength="6"
        />
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
          minlength="6"
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
    
    if (!area || !fileInput) return;

    // 이미지 영역 클릭 시 파일 선택
    area.addEventListener("click", () => {
      fileInput.click();
    });

    // 파일 선택 시 미리보기
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (file) {
        // 파일 크기 체크 (5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert("파일 크기는 5MB 이하여야 합니다.");
          fileInput.value = "";
          return;
        }

        // 파일 타입 체크
        if (!file.type.startsWith('image/')) {
          alert("이미지 파일만 선택할 수 있습니다.");
          fileInput.value = "";
          return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          // 간단한 미리보기 - 원형 이미지로 표시
          area.innerHTML = `
            <img src="${ev.target?.result}" alt="프로필 이미지" class="w-full h-full object-cover rounded-full">
          `;
        };
        reader.readAsDataURL(file);
      } else {
        // 기본 상태로 복원
        area.innerHTML = `
          <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
          </svg>
        `;
      }
    });
  }

  private setupEventListeners(): void {
    this.formElement = this.container.querySelector("#signupForm") as HTMLFormElement;
    if (this.formElement) {
      this.formElement.addEventListener("submit", this.handleSignup.bind(this));
    }

    // 로그인 링크 클릭 시 로그인 화면으로 이동
    const loginLink = this.container.querySelector(".login-link") as HTMLAnchorElement;
    if (loginLink) {
      loginLink.addEventListener("click", (e) => {
        e.preventDefault();
        window.router.navigate("/login");
      });
    }
  }

  private async handleSignup(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.formElement) return;

    const formData = new FormData(this.formElement);
    
    const username = formData.get("username") as string;
    const nickname = formData.get("nickname") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const profileImageFile = formData.get("profileImage") as File;

    // 클라이언트 측 유효성 검사
    if (!username || !nickname || !password || !confirmPassword) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      alert("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    const submitBtn = this.container.querySelector('button[type="submit"]') as HTMLButtonElement;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "계정 생성 중...";
    submitBtn.disabled = true;

    try {
      // 프로필 이미지가 있으면 data URL로 변환
      let profileImage: string | null = null;
      if (profileImageFile && profileImageFile.size > 0) {
        profileImage = await this.fileToDataURL(profileImageFile);
      }

      // JSON 형태로 전송
      const signupData = {
        username,
        nickname,
        password,
        confirmPassword,
        profileImage
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });

      if (response.ok) {
        alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
        window.router.navigate("/login");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "회원가입에 실패했습니다.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert(error instanceof Error ? error.message : "회원가입 중 오류가 발생했습니다.");
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  private fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  destroy(): void {
    this.clearContainer();
  }
}
