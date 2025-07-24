import { Component } from "../Component";
import { UserManager } from "../../utils/user";
import { AuthManager } from "../../utils/auth";
import "../../styles/main.css";

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

        // 직접 HTML 템플릿 렌더링
        this.container.innerHTML = this.getEditProfileTemplate();

        // 프로필 이미지 초기화
        this.initializeProfileImage();

        // 탭 초기 상태 설정
        this.initializeTabState();

        this.setupEventListeners();
    }

    private getEditProfileTemplate(): string {
        const currentNickname = this.currentUserData?.nickname || '';
        const profileImage = this.currentUserData?.profileImage || '';

        return `
<div class="bg-gradient-full min-h-screen p-4">
    <div class="max-w-2xl mx-auto">
        <!-- 헤더 -->
        <div class="mb-8">
            <div class="flex items-center justify-between bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6">
                <div class="flex items-center gap-4">
                    <button class="back-btn btn-secondary">
                        ← 뒤로가기
                    </button>
                    <div>
                        <h1 class="text-2xl font-bold text-primary-800">프로필 편집</h1>
                        <p class="text-primary-600 text-sm">개인정보 및 비밀번호를 변경할 수 있습니다</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- 탭 메뉴 -->
        <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 mb-6">
            <div class="flex border-b border-white/20">
                <button class="tab-btn flex-1 px-6 py-4 text-sm font-medium text-center rounded-tl-3xl focus:outline-none transition-all duration-200" data-tab="profile">
                    개인정보 변경
                </button>
                <button class="tab-btn flex-1 px-6 py-4 text-sm font-medium text-center rounded-tr-3xl focus:outline-none transition-all duration-200" data-tab="password">
                    비밀번호 변경
                </button>
            </div>

            <!-- 개인정보 변경 탭 -->
            <div class="tab-content p-6" id="profile-tab">
                <form id="profileForm" class="space-y-6">
                    <!-- 프로필 이미지 -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">프로필 이미지</label>
                        <div id="profileImageArea" class="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition relative group">
                            <span id="profileImageText" class="text-gray-400 ${profileImage ? 'hidden' : ''}">이미지를 클릭하여 선택</span>
                            <img id="profileImagePreview" src="${profileImage || ''}" alt="프로필 이미지" class="max-h-full w-auto object-contain rounded-lg ${profileImage ? '' : 'hidden'}" />
                            <input type="file" id="profileImageInput" accept="image/*" class="hidden" />
                            
                            <!-- 간단한 제거 버튼 -->
                            <button 
                                type="button" 
                                id="removeImageBtn" 
                                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors ${profileImage ? '' : 'hidden'}"
                                title="이미지 제거"
                            >
                                ✕
                            </button>
                        </div>
                        <p class="text-sm text-gray-500 mt-2">JPG, PNG 파일 (최대 5MB)</p>
                    </div>

                    <!-- 닉네임 변경 -->
                    <div>
                        <label for="nickname" class="block text-sm font-medium text-gray-700 mb-2">닉네임</label>
                        <div class="relative">
                            <input 
                                type="text" 
                                id="nickname" 
                                name="nickname" 
                                value="${currentNickname}"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                                placeholder="닉네임을 입력하세요"
                                maxlength="20"
                                required
                            />
                            <div class="absolute right-3 top-3 text-sm text-gray-400">
                                <span id="charCount">0/20</span>
                            </div>
                        </div>
                        <p class="text-sm text-gray-500 mt-1">최대 20자까지 입력 가능합니다</p>
                    </div>

                    <!-- 버튼 그룹 -->
                    <div class="flex gap-3 pt-4">
                        <button type="submit" class="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                            변경사항 저장
                        </button>
                        <button type="button" class="cancel-btn px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                            취소
                        </button>
                    </div>
                </form>
            </div>

            <!-- 비밀번호 변경 탭 -->
            <div class="tab-content p-6 hidden" id="password-tab">
                <form id="passwordForm" class="space-y-6">
                    <!-- 현재 비밀번호 -->
                    <div>
                        <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-2">현재 비밀번호</label>
                        <input 
                            type="password" 
                            id="currentPassword" 
                            name="currentPassword" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                            placeholder="현재 비밀번호를 입력하세요"
                            required
                        />
                    </div>

                    <!-- 새 비밀번호 -->
                    <div>
                        <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
                        <input 
                            type="password" 
                            id="newPassword" 
                            name="newPassword" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                            placeholder="새 비밀번호를 입력하세요"
                            minlength="8"
                            required
                        />
                        <p class="text-sm text-gray-500 mt-1">최소 8자 이상 입력해주세요</p>
                    </div>

                    <!-- 새 비밀번호 확인 -->
                    <div>
                        <label for="confirmNewPassword" class="block text-sm font-medium text-gray-700 mb-2">새 비밀번호 확인</label>
                        <input 
                            type="password" 
                            id="confirmNewPassword" 
                            name="confirmNewPassword" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                            placeholder="새 비밀번호를 다시 입력하세요"
                            required
                        />
                    </div>

                    <!-- 버튼 그룹 -->
                    <div class="flex gap-3 pt-4">
                        <button type="submit" class="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                            비밀번호 변경
                        </button>
                        <button type="button" class="cancel-btn px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                            취소
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- 성공/오류 메시지 -->
        <div id="message" class="hidden p-4 rounded-lg mb-4"></div>
    </div>
</div>
        `;
    }

    private initializeProfileImage(): void {
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
        const backBtn = this.container.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (window.router) {
                    // 브라우저 히스토리를 사용하여 이전 페이지로 이동
                    if (window.router.canGoBack()) {
                        window.router.goBack();
                    } else {
                        // 히스토리가 없으면 내 프로필로 이동
                        const userId = UserManager.getUserId();
                        if (userId) {
                            window.router.navigate(`/user/${userId}`);
                        } else {
                            window.router.navigate("/");
                        }
                    }
                }
            });
        }

        // 탭 전환 기능
        const tabBtns = this.container.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabType = btn.getAttribute('data-tab');
                this.switchTab(tabType);
            });
        });

        // 프로필 이미지 업로드 관련
        this.setupProfileImageArea();

        // 프로필 변경 폼 제출
        const profileForm = this.container.querySelector('#profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileSubmit();
            });
        }

        // 비밀번호 변경 폼 제출
        const passwordForm = this.container.querySelector('#passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordSubmit();
            });
        }

        // 취소 버튼들
        const cancelBtns = this.container.querySelectorAll('.cancel-btn');
        cancelBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = UserManager.getUserId();
                if (window.router && userId) {
                    window.router.navigate(`/user/${userId}`);
                }
            });
        });
    }

    private switchTab(tabType: string | null): void {
        const profileTab = this.container.querySelector('[data-tab="profile"]');
        const passwordTab = this.container.querySelector('[data-tab="password"]');
        const profileTabContent = this.container.querySelector('#profile-tab');
        const passwordTabContent = this.container.querySelector('#password-tab');

        if (!profileTab || !passwordTab || !profileTabContent || !passwordTabContent) return;

        // 모든 탭 버튼 비활성화
        profileTab.className = 'tab-btn flex-1 px-6 py-4 text-sm font-medium text-center focus:outline-none transition-all duration-200 text-primary-500 bg-transparent hover:text-primary-700 hover:bg-primary-50/50';
        passwordTab.className = 'tab-btn flex-1 px-6 py-4 text-sm font-medium text-center focus:outline-none transition-all duration-200 text-primary-500 bg-transparent hover:text-primary-700 hover:bg-primary-50/50';

        // 모든 탭 내용 숨김
        profileTabContent.classList.add('hidden');
        passwordTabContent.classList.add('hidden');

        // 선택된 탭 활성화
        if (tabType === 'profile') {
            profileTab.className = 'tab-btn flex-1 px-6 py-4 text-sm font-medium text-center focus:outline-none transition-all duration-200 active bg-primary-50 text-primary-700 border-b-2 border-primary-500 rounded-tl-3xl';
            profileTabContent.classList.remove('hidden');
        } else if (tabType === 'password') {
            passwordTab.className = 'tab-btn flex-1 px-6 py-4 text-sm font-medium text-center focus:outline-none transition-all duration-200 active bg-primary-50 text-primary-700 border-b-2 border-primary-500 rounded-tr-3xl';
            passwordTabContent.classList.remove('hidden');
        }
    }

    private async handleProfileSubmit(): Promise<void> {
        const nicknameInput = this.container.querySelector('#nickname') as HTMLInputElement;
        const fileInput = this.container.querySelector('#profileImageInput') as HTMLInputElement;
        const previewImg = this.container.querySelector('#profileImagePreview') as HTMLImageElement;
        const submitBtn = this.container.querySelector('#profileForm button[type="submit"]') as HTMLButtonElement;

        const newNickname = nicknameInput?.value.trim();
        const uploadedFile = fileInput?.files?.[0];
        
        // 현재 상태 확인
        const originalNickname = this.currentUserData?.nickname || '';
        const originalProfileImage = this.currentUserData?.profileImage;
        
        // 닉네임 변경 확인
        const isNicknameChanged = newNickname !== originalNickname;
        
        // 프로필 이미지 변경 확인
        let isImageChanged = false;
        let imageAction: 'upload' | 'remove' | 'none' = 'none';
        
        if (uploadedFile) {
            // 새 이미지 업로드
            isImageChanged = true;
            imageAction = 'upload';
        } else {
            // 현재 이미지 표시 상태 확인
            const isImageCurrentlyShown = previewImg && !previewImg.classList.contains('hidden') && previewImg.src;
            
            if (originalProfileImage && !isImageCurrentlyShown) {
                // 기존 이미지가 있었는데 현재는 표시되지 않음 = 제거됨
                isImageChanged = true;
                imageAction = 'remove';
            } else if (!originalProfileImage && isImageCurrentlyShown) {
                // 기존 이미지가 없었는데 현재는 표시됨 (이론적으로는 uploadedFile이 있어야 하지만 혹시 모를 경우)
                isImageChanged = true;
                imageAction = 'upload';
            }
        }
        
        // 변경사항이 없는 경우 요청하지 않음
        if (!isNicknameChanged && !isImageChanged) {
            this.showMessage('변경할 내용이 없습니다. 닉네임 또는 프로필 이미지를 변경해주세요.', 'error');
            return;
        }

        // 로딩 상태
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '저장 중...';
        submitBtn.disabled = true;

        try {
            // 변경사항만 요청 바디에 포함
            const requestBody: any = {};
            
            if (isNicknameChanged) {
                requestBody.nickname = newNickname;
            }
            
            if (isImageChanged) {
                if (imageAction === 'upload' && uploadedFile) {
                    // 새 이미지 업로드
                    const dataUrl = await this.fileToDataURL(uploadedFile);
                    requestBody.profileImage = dataUrl;
                } else if (imageAction === 'remove') {
                    // 이미지 제거
                    requestBody.profileImage = null;
                }
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

            // 현재 사용자 데이터 업데이트 (다음 변경사항 감지를 위해)
            if (isNicknameChanged) {
                this.currentUserData.nickname = newNickname;
            }
            if (isImageChanged) {
                if (imageAction === 'upload' && uploadedFile) {
                    this.currentUserData.profileImage = await this.fileToDataURL(uploadedFile);
                } else if (imageAction === 'remove') {
                    this.currentUserData.profileImage = null;
                }
            }

            this.showMessage('프로필이 성공적으로 변경되었습니다!', 'success');
            const userId = UserManager.getUserId();
            if (window.router && userId) {
                window.router.navigate(`/user/${userId}`);
            }

        } catch (error) {
            console.error('[EditProfileComponent] 프로필 변경 오류:', error);
            this.showMessage(error instanceof Error ? error.message : '프로필 변경 중 오류가 발생했습니다.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    private async handlePasswordSubmit(): Promise<void> {
        const currentPasswordInput = this.container.querySelector('#currentPassword') as HTMLInputElement;
        const newPasswordInput = this.container.querySelector('#newPassword') as HTMLInputElement;
        const confirmPasswordInput = this.container.querySelector('#confirmNewPassword') as HTMLInputElement;
        const submitBtn = this.container.querySelector('#passwordForm button[type="submit"]') as HTMLButtonElement;

        const currentPassword = currentPasswordInput?.value.trim();
        const newPassword = newPasswordInput?.value.trim();
        const confirmPassword = confirmPasswordInput?.value.trim();

        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showMessage('모든 필드를 입력해주세요.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showMessage('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showMessage('새 비밀번호는 최소 6자 이상이어야 합니다.', 'error');
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

            this.showMessage('비밀번호가 성공적으로 변경되었습니다!', 'success');
            
            // 폼 초기화
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';

        } catch (error) {
            console.error('[EditProfileComponent] 비밀번호 변경 오류:', error);
            this.showMessage(error instanceof Error ? error.message : '비밀번호 변경 중 오류가 발생했습니다.', 'error');
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
        // 기본적으로 프로필 탭이 활성화되도록 설정
        const profileTab = this.container.querySelector('[data-tab="profile"]');
        if (profileTab) {
            this.switchTab('profile');
        }
    }

    private showMessage(message: string, type: 'success' | 'error' = 'success'): void {
        const messageDiv = this.container.querySelector('#message');
        if (messageDiv) {
            messageDiv.className = `rounded-2xl p-4 mb-4 backdrop-blur-xl shadow-lg border ${type === 'success' ? 'bg-green-100/80 text-green-800 border-green-200' : 'bg-red-100/80 text-red-800 border-red-200'}`;
            messageDiv.textContent = message;
            messageDiv.classList.remove('hidden');
            
            // 5초 후 자동 숨김
            setTimeout(() => {
                messageDiv.classList.add('hidden');
            }, 5000);
        }
    }

    private setupProfileImageArea(): void {
        const area = this.container.querySelector('#profileImageArea') as HTMLElement;
        const fileInput = this.container.querySelector('#profileImageInput') as HTMLInputElement;
        const previewImg = this.container.querySelector('#profileImagePreview') as HTMLImageElement;
        const textSpan = this.container.querySelector('#profileImageText') as HTMLElement;
        const removeBtn = this.container.querySelector('#removeImageBtn') as HTMLButtonElement;
        
        if (!area || !fileInput || !previewImg || !textSpan || !removeBtn) return;

        // 이미지 영역 클릭 시 파일 선택 (제거 버튼이 아닌 경우에만)
        area.addEventListener('click', (e) => {
            if (e.target !== removeBtn && !removeBtn.contains(e.target as Node)) {
                fileInput.click();
            }
        });

        // 제거 버튼 클릭
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearProfileImage();
        });

        // 파일 선택 시 미리보기
        fileInput.addEventListener('change', () => {
            const file = fileInput.files && fileInput.files[0];
            if (file) {
                // 파일 크기 체크 (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    this.showMessage('파일 크기는 5MB 이하여야 합니다.', 'error');
                    fileInput.value = '';
                    return;
                }

                // 파일 타입 체크
                if (!file.type.startsWith('image/')) {
                    this.showMessage('이미지 파일만 선택할 수 있습니다.', 'error');
                    fileInput.value = '';
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
        const previewImg = this.container.querySelector('#profileImagePreview') as HTMLImageElement;
        const textSpan = this.container.querySelector('#profileImageText') as HTMLElement;
        const removeBtn = this.container.querySelector('#removeImageBtn') as HTMLButtonElement;

        if (previewImg && textSpan && removeBtn) {
            previewImg.classList.remove('hidden');
            textSpan.classList.add('hidden');
            removeBtn.classList.remove('hidden');
        }
    }

    private clearProfileImage(): void {
        const fileInput = this.container.querySelector('#profileImageInput') as HTMLInputElement;
        const previewImg = this.container.querySelector('#profileImagePreview') as HTMLImageElement;
        const textSpan = this.container.querySelector('#profileImageText') as HTMLElement;
        const removeBtn = this.container.querySelector('#removeImageBtn') as HTMLButtonElement;

        if (fileInput && previewImg && textSpan && removeBtn) {
            fileInput.value = '';
            previewImg.src = '';
            previewImg.classList.add('hidden');
            textSpan.classList.remove('hidden');
            removeBtn.classList.add('hidden');
        }
    }

    destroy(): void {
        this.clearContainer();
    }
}
