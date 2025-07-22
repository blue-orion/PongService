import { Component } from "../Component";
import { UserManager } from "../../utils/user";
import { AuthManager } from "../../utils/auth";
import { loadTemplate, loadCSS, renderTemplate, TEMPLATE_PATHS } from "../../utils/template-loader";

export class EditProfileComponent extends Component {
    private currentUserData: any = null;
    private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    constructor(container: HTMLElement) {
        super(container);
    }

    async render(): Promise<void> {
        this.clearContainer();

        // 현재 사용자 정보 가져오기
        await this.loadCurrentUserData();

        try {
            // 템플릿과 CSS 로드
            const [template, styles] = await Promise.all([
                loadTemplate(TEMPLATE_PATHS.EDIT_PROFILE),
                loadCSS('/src/components/user/userInfo.styles.css') // 공통 스타일 사용
            ]);

            // 템플릿 데이터 준비
            const templateData = {
                currentNickname: this.currentUserData?.nickname || '',
                profileImage: this.currentUserData?.profileImage || ''
            };

            // 템플릿 렌더링
            const renderedTemplate = renderTemplate(template, templateData);
            
            // HTML 설정 (스타일 포함)
            this.container.innerHTML = renderedTemplate + styles;

            // 프로필 이미지 초기화
            this.initializeProfileImage();

            // 탭 초기 상태 설정
            this.initializeTabState();

            this.setupEventListeners();
        } catch (templateError) {
            console.error('[EditProfileComponent] 템플릿 로드 오류:', templateError);
            // 템플릿 로드 실패 시 기본 에러 메시지
            this.container.innerHTML = `<div class="error-message">페이지를 로드하는 중 오류가 발생했습니다.</div>`;
            return;
        }
    }

    private initializeProfileImage(): void {
        const profileImagePreview = this.container.querySelector('#profileImagePreview') as HTMLImageElement;
        const profileImageText = this.container.querySelector('#profileImageText');
        
        if (this.currentUserData?.profileImage) {
            if (profileImagePreview) {
                profileImagePreview.src = this.currentUserData.profileImage;
                profileImagePreview.classList.remove('hidden');
            }
            if (profileImageText) {
                profileImageText.classList.add('hidden');
            }
        }

        // 닉네임 글자수 카운터 초기화
        const nicknameInput = this.container.querySelector('#nickname') as HTMLInputElement;
        const charCount = this.container.querySelector('#charCount');
        if (nicknameInput && charCount) {
            charCount.textContent = `${nicknameInput.value.length}/20`;
            nicknameInput.addEventListener('input', () => {
                charCount.textContent = `${nicknameInput.value.length}/20`;
            });
        }
    }

    private async loadCurrentUserData(): Promise<void> {
        try {
            const userId = UserManager.getUserId();
            if (!userId) {
                throw new Error('사용자 ID가 없습니다.');
            }

            const response = await AuthManager.authenticatedFetch(`${EditProfileComponent.API_BASE_URL}/users/profile/${userId}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`사용자 정보 로드 실패: ${response.status}`);
            }

            const userData = await response.json();
            this.currentUserData = userData.data || {};

        } catch (error) {
            console.error('[EditProfileComponent] 사용자 데이터 로드 오류:', error);
            this.currentUserData = {};
        }
    }

    private setupEventListeners(): void {
        // 뒤로가기 버튼
        const backBtn = this.container.querySelector('#backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                const userId = UserManager.getUserId();
                if (window.router && userId) {
                    window.router.navigate(`/user/${userId}`);
                }
            });
        }

        // 탭 전환 기능
        const profileTab = this.container.querySelector('#profileTab');
        const passwordTab = this.container.querySelector('#passwordTab');
        const profileSection = this.container.querySelector('#profileSection');
        const passwordSection = this.container.querySelector('#passwordSection');

        if (profileTab && passwordTab && profileSection && passwordSection) {
            profileTab.addEventListener('click', () => {
                // 프로필 탭 활성화 - 더 현대적인 Tailwind CSS
                profileTab.className = 'tab-button flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 bg-blue-600 text-white shadow-lg hover:bg-blue-700 transform hover:scale-105';
                // 비밀번호 탭 비활성화
                passwordTab.className = 'tab-button flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 text-gray-600 bg-transparent hover:bg-gray-50 hover:text-gray-800';
                
                profileSection.classList.remove('hidden');
                passwordSection.classList.add('hidden');
            });

            passwordTab.addEventListener('click', () => {
                // 비밀번호 탭 활성화 - 더 현대적인 Tailwind CSS
                passwordTab.className = 'tab-button flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 bg-blue-600 text-white shadow-lg hover:bg-blue-700 transform hover:scale-105';
                // 프로필 탭 비활성화
                profileTab.className = 'tab-button flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 text-gray-600 bg-transparent hover:bg-gray-50 hover:text-gray-800';
                
                passwordSection.classList.remove('hidden');
                profileSection.classList.add('hidden');
            });
        }

        // 프로필 이미지 업로드
        const profileImageArea = this.container.querySelector('#profileImageArea');
        const profileImageInput = this.container.querySelector('#profileImage') as HTMLInputElement;
        const profileImagePreview = this.container.querySelector('#profileImagePreview') as HTMLImageElement;
        const profileImageText = this.container.querySelector('#profileImageText');

        if (profileImageArea && profileImageInput) {
            profileImageArea.addEventListener('click', () => {
                profileImageInput.click();
            });

            profileImageInput.addEventListener('change', (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    if (!file.type.startsWith('image/')) {
                        alert('이미지 파일만 업로드할 수 있습니다.');
                        return;
                    }

                    if (file.size > 5 * 1024 * 1024) {
                        alert('파일 크기는 5MB 이하여야 합니다.');
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const result = e.target?.result as string;
                        if (profileImagePreview && profileImageText) {
                            profileImagePreview.src = result;
                            profileImagePreview.classList.remove('hidden');
                            profileImageText.classList.add('hidden');
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // 프로필 변경 폼 제출
        const editProfileForm = this.container.querySelector('#editProfileForm');
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileSubmit();
            });
        }

        // 비밀번호 변경 폼 제출
        const changePasswordForm = this.container.querySelector('#changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordSubmit();
            });
        }
    }

    private async handleProfileSubmit(): Promise<void> {
        const nicknameInput = this.container.querySelector('#nickname') as HTMLInputElement;
        const fileInput = this.container.querySelector('#profileImage') as HTMLInputElement;
        const submitBtn = this.container.querySelector('#editProfileForm button[type="submit"]') as HTMLButtonElement;

        const newNickname = nicknameInput?.value.trim();
        const uploadedFile = fileInput?.files?.[0];

        // 닉네임이 현재 닉네임과 동일하면 변경할 필요 없음
        const isNicknameChanged = newNickname && newNickname !== this.currentUserData?.nickname;

        if (!isNicknameChanged && !uploadedFile) {
            alert('변경할 내용이 없습니다. 닉네임 또는 프로필 이미지를 변경해주세요.');
            return;
        }

        // 로딩 상태
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '저장 중...';
        submitBtn.disabled = true;

        try {
            // JSON 방식으로 다시 변경 (data URL 전체 전송)
            const requestBody: any = {};
            
            if (isNicknameChanged) {
                requestBody.nickname = newNickname;
            }
            
            if (uploadedFile) {
                // 파일을 data URL로 변환 (data:image/jpeg;base64,... 형태)
                const dataUrl = await this.fileToDataURL(uploadedFile);
                requestBody.profileImage = dataUrl;
            }

            const response = await AuthManager.authenticatedFetch(`${EditProfileComponent.API_BASE_URL}/users/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `프로필 변경 실패: ${response.status}`);
            }

            alert('프로필이 성공적으로 변경되었습니다!');
            const userId = UserManager.getUserId();
            if (window.router && userId) {
                window.router.navigate(`/user/${userId}`);
            }

        } catch (error) {
            console.error('[EditProfileComponent] 프로필 변경 오류:', error);
            alert(error instanceof Error ? error.message : '프로필 변경 중 오류가 발생했습니다.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    private async handlePasswordSubmit(): Promise<void> {
        const currentPasswordInput = this.container.querySelector('#currentPassword') as HTMLInputElement;
        const newPasswordInput = this.container.querySelector('#newPassword') as HTMLInputElement;
        const confirmPasswordInput = this.container.querySelector('#confirmPassword') as HTMLInputElement;
        const submitBtn = this.container.querySelector('#changePasswordForm button[type="submit"]') as HTMLButtonElement;

        const currentPassword = currentPasswordInput?.value.trim();
        const newPassword = newPasswordInput?.value.trim();
        const confirmPassword = confirmPasswordInput?.value.trim();

        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
            return;
        }

        if (newPassword.length < 6) {
            alert('새 비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }

        // 로딩 상태
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '변경 중...';
        submitBtn.disabled = true;

        try {
            // UpdatePasswordDto 형태에 맞게 요청 데이터 구성
            const requestBody = {
                currentPassword,
                newPassword,
                confirmNewPassword: confirmPassword
            };

            const response = await AuthManager.authenticatedFetch(`${EditProfileComponent.API_BASE_URL}/users/update/passwd`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `비밀번호 변경 실패: ${response.status}`);
            }

            alert('비밀번호가 성공적으로 변경되었습니다!');
            
            // 폼 초기화
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';

        } catch (error) {
            console.error('[EditProfileComponent] 비밀번호 변경 오류:', error);
            alert(error instanceof Error ? error.message : '비밀번호 변경 중 오류가 발생했습니다.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    private fileToDataURL(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // 전체 data URL 반환 (data:image/jpeg;base64,...)
                resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    private initializeTabState(): void {
        const profileTab = this.container.querySelector('#profileTab');
        const passwordTab = this.container.querySelector('#passwordTab');
        const profileSection = this.container.querySelector('#profileSection');
        const passwordSection = this.container.querySelector('#passwordSection');

        // 첫 번째 탭(프로필)을 기본 활성화 - 현대적인 Tailwind CSS
        if (profileTab && passwordTab && profileSection && passwordSection) {
            // 프로필 탭 활성화 스타일
            profileTab.className = 'tab-button flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 bg-blue-600 text-white shadow-lg hover:bg-blue-700 transform hover:scale-105';
            // 비밀번호 탭 비활성화 스타일
            passwordTab.className = 'tab-button flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 text-gray-600 bg-transparent hover:bg-gray-50 hover:text-gray-800';
            
            profileSection.classList.remove('hidden');
            passwordSection.classList.add('hidden');
        }
    }

    destroy(): void {
        this.clearContainer();
    }
}
