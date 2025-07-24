import { Component } from "../Component";
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
        <label class="block text-sm font-medium mb-2">프로필 이미지</label>
        <div id="profileImageArea" class="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition relative group">
          <span id="profileImageText" class="text-gray-400">이미지를 클릭하여 선택</span>
          <img id="profileImagePreview" src="" alt="프로필 이미지" class="hidden max-h-full w-auto object-contain rounded-lg" />
          <input type="file" id="profileImage" name="profileImage" accept="image/*" class="hidden" />
          
          <!-- 간단한 제거 버튼 -->
          <button 
            type="button" 
            id="removeImageBtn" 
            class="hidden absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
            title="이미지 제거"
          >
            ✕
          </button>
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
        <div class="relative">
          <input 
            type="password" 
            id="password" 
            name="password" 
            required 
            class="login-input pr-12" 
            placeholder="비밀번호를 입력하세요"
            minlength="6"
            maxlength="12"
          />
          <button 
            type="button" 
            id="togglePassword" 
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg id="passwordShowIcon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            <svg id="passwordHideIcon" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
            </svg>
          </button>
        </div>
        <div class="mt-2 space-y-1">
          <div id="passwordRequirements" class="text-xs space-y-1">
            <div id="lengthCheck" class="flex items-center gap-2">
              <span class="w-4 h-4 flex items-center justify-center">-</span>
              <span>6-12자 길이</span>
            </div>
            <div id="lowercaseCheck" class="flex items-center gap-2">
              <span class="w-4 h-4 flex items-center justify-center">-</span>
              <span>소문자 포함</span>
            </div>
            <div id="uppercaseCheck" class="flex items-center gap-2">
              <span class="w-4 h-4 flex items-center justify-center">-</span>
              <span>대문자 포함</span>
            </div>
            <div id="numberCheck" class="flex items-center gap-2">
              <span class="w-4 h-4 flex items-center justify-center">-</span>
              <span>숫자 포함</span>
            </div>
            <div id="specialCheck" class="flex items-center gap-2">
              <span class="w-4 h-4 flex items-center justify-center">-</span>
              <span>특수문자 포함</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 비밀번호 확인 -->
      <div>
        <label for="confirmPassword" class="block text-sm font-medium mb-2">비밀번호 확인</label>
        <div class="relative">
          <input 
            type="password" 
            id="confirmPassword" 
            name="confirmPassword" 
            required 
            class="login-input pr-12" 
            placeholder="비밀번호를 다시 입력하세요"
          />
          <button 
            type="button" 
            id="toggleConfirmPassword" 
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg id="confirmPasswordShowIcon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            <svg id="confirmPasswordHideIcon" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
            </svg>
          </button>
        </div>
        <div class="mt-1">
          <p id="passwordMatchStatus" class="text-xs hidden"></p>
        </div>
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
    const removeBtn = this.container.querySelector("#removeImageBtn") as HTMLButtonElement;

    if (!area || !fileInput || !previewImg || !textSpan || !removeBtn) return;

    // 이미지 영역 클릭 시 파일 선택 (제거 버튼이 아닌 경우에만)
    area.addEventListener("click", (e) => {
      if (e.target !== removeBtn && !removeBtn.contains(e.target as Node)) {
        fileInput.click();
      }
    });

    // 제거 버튼 클릭
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.clearProfileImage();
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
        if (!file.type.startsWith("image/")) {
          alert("이미지 파일만 선택할 수 있습니다.");
          fileInput.value = "";
          return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          previewImg.src = ev.target?.result as string;
          this.showImagePreview();
        };
        reader.readAsDataURL(file);
      } else {
        this.clearProfileImage();
      }
    });
  }

  private showImagePreview(): void {
    const previewImg = this.container.querySelector("#profileImagePreview") as HTMLImageElement;
    const textSpan = this.container.querySelector("#profileImageText") as HTMLElement;
    const removeBtn = this.container.querySelector("#removeImageBtn") as HTMLButtonElement;

    if (previewImg && textSpan && removeBtn) {
      previewImg.classList.remove("hidden");
      textSpan.classList.add("hidden");
      removeBtn.classList.remove("hidden");
    }
  }

  private clearProfileImage(): void {
    const fileInput = this.container.querySelector("#profileImage") as HTMLInputElement;
    const previewImg = this.container.querySelector("#profileImagePreview") as HTMLImageElement;
    const textSpan = this.container.querySelector("#profileImageText") as HTMLElement;
    const removeBtn = this.container.querySelector("#removeImageBtn") as HTMLButtonElement;

    if (fileInput && previewImg && textSpan && removeBtn) {
      fileInput.value = "";
      previewImg.src = "";
      previewImg.classList.add("hidden");
      textSpan.classList.remove("hidden");
      removeBtn.classList.add("hidden");
    }
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

    // 사용자명 글자 수 카운터
    const usernameInput = this.container.querySelector("#username") as HTMLInputElement;
    const usernameCharCount = this.container.querySelector("#usernameCharCount") as HTMLElement;
    if (usernameInput && usernameCharCount) {
      const updateUsernameCount = () => {
        const currentLength = usernameInput.value.length;
        usernameCharCount.textContent = `${currentLength}/20`;
      };
      usernameInput.addEventListener("input", updateUsernameCount);
      // 초기 카운트 설정
      updateUsernameCount();
    }

    // 닉네임 글자 수 카운터
    const nicknameInput = this.container.querySelector("#nickname") as HTMLInputElement;
    const nicknameCharCount = this.container.querySelector("#nicknameCharCount") as HTMLElement;
    if (nicknameInput && nicknameCharCount) {
      const updateNicknameCount = () => {
        const currentLength = nicknameInput.value.length;
        nicknameCharCount.textContent = `${currentLength}/20`;
      };
      nicknameInput.addEventListener("input", updateNicknameCount);
      // 초기 카운트 설정
      updateNicknameCount();
    }

    // 비밀번호 일치 검사
    const passwordInput = this.container.querySelector("#password") as HTMLInputElement;
    const confirmPasswordInput = this.container.querySelector("#confirmPassword") as HTMLInputElement;
    const passwordMatchStatus = this.container.querySelector("#passwordMatchStatus") as HTMLElement;

    // 비밀번호 조건 검사 요소들
    const lengthCheck = this.container.querySelector("#lengthCheck") as HTMLElement;
    const lowercaseCheck = this.container.querySelector("#lowercaseCheck") as HTMLElement;
    const uppercaseCheck = this.container.querySelector("#uppercaseCheck") as HTMLElement;
    const numberCheck = this.container.querySelector("#numberCheck") as HTMLElement;
    const specialCheck = this.container.querySelector("#specialCheck") as HTMLElement;

    if (passwordInput && confirmPasswordInput && passwordMatchStatus) {
      const checkPasswordRequirements = () => {
        const password = passwordInput.value;

        // 길이 체크 (6-12자)
        const isValidLength = password.length >= 6 && password.length <= 12;
        this.updateCheckStatus(lengthCheck, isValidLength);

        // 소문자 체크
        const hasLowercase = /[a-z]/.test(password);
        this.updateCheckStatus(lowercaseCheck, hasLowercase);

        // 대문자 체크
        const hasUppercase = /[A-Z]/.test(password);
        this.updateCheckStatus(uppercaseCheck, hasUppercase);

        // 숫자 체크
        const hasNumber = /[0-9]/.test(password);
        this.updateCheckStatus(numberCheck, hasNumber);

        // 특수문자 체크
        const hasSpecial = /[^a-zA-Z0-9]/.test(password);
        this.updateCheckStatus(specialCheck, hasSpecial);
      };

      const checkPasswordMatch = () => {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // 비밀번호 확인 필드가 비어있으면 상태 숨김
        if (!confirmPassword) {
          passwordMatchStatus.classList.add("hidden");
          return;
        }

        passwordMatchStatus.classList.remove("hidden");

        if (password === confirmPassword) {
          passwordMatchStatus.textContent = "✓ 비밀번호가 일치합니다";
          passwordMatchStatus.className = "text-xs text-green-600";
        } else {
          passwordMatchStatus.textContent = "✗ 비밀번호가 일치하지 않습니다";
          passwordMatchStatus.className = "text-xs text-red-600";
        }
      };

      passwordInput.addEventListener("input", () => {
        checkPasswordRequirements();
        checkPasswordMatch();
      });
      confirmPasswordInput.addEventListener("input", checkPasswordMatch);

      // 초기 상태 설정
      checkPasswordRequirements();
    }

    // 비밀번호 보이기/숨기기 토글 기능
    this.setupPasswordToggle("password", "togglePassword", "passwordShowIcon", "passwordHideIcon");
    this.setupPasswordToggle(
      "confirmPassword",
      "toggleConfirmPassword",
      "confirmPasswordShowIcon",
      "confirmPasswordHideIcon"
    );
  }

  private setupPasswordToggle(inputId: string, buttonId: string, showIconId: string, hideIconId: string): void {
    const passwordInput = this.container.querySelector(`#${inputId}`) as HTMLInputElement;
    const toggleButton = this.container.querySelector(`#${buttonId}`) as HTMLButtonElement;
    const showIcon = this.container.querySelector(`#${showIconId}`) as HTMLElement;
    const hideIcon = this.container.querySelector(`#${hideIconId}`) as HTMLElement;

    if (passwordInput && toggleButton && showIcon && hideIcon) {
      toggleButton.addEventListener("click", () => {
        if (passwordInput.type === "password") {
          // 비밀번호 보이기
          passwordInput.type = "text";
          showIcon.classList.add("hidden");
          hideIcon.classList.remove("hidden");
        } else {
          // 비밀번호 숨기기
          passwordInput.type = "password";
          showIcon.classList.remove("hidden");
          hideIcon.classList.add("hidden");
        }
      });
    }
  }

  private updateCheckStatus(element: HTMLElement, isValid: boolean): void {
    const icon = element.querySelector("span") as HTMLElement;
    if (isValid) {
      icon.textContent = "✓";
      icon.className = "w-4 h-4 flex items-center justify-center text-green-600 font-bold";
      element.className = "flex items-center gap-2 text-green-600";
    } else {
      icon.textContent = "✗";
      icon.className = "w-4 h-4 flex items-center justify-center text-red-500 font-bold";
      element.className = "flex items-center gap-2 text-red-500";
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
        passwd: password,
        confirmPasswd: confirmPassword,
        profileImage,
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
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
        throw new Error(errorData.error || "회원가입에 실패했습니다.");
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
