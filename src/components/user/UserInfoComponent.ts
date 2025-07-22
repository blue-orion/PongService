import { Component } from "../Component";
import { UserManager } from "../../utils/user";
import { AuthManager } from "../../utils/auth";
import { loadTemplate, renderTemplate } from "../../utils/template-loader";

export class UserInfoComponent extends Component {
    private userId: string;
    private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    constructor(container: HTMLElement, userId: string) {
        super(container);
        this.userId = userId;
    }

    async render(): Promise<void> {
        this.clearContainer();

        // userId가 없으면 안내 메시지 출력
        if (!this.userId) {
            this.container.innerHTML = `<div class="user-info-error">사용자 ID 정보가 없습니다. 다시 로그인해주세요.</div>`;
            return;
        }

        // 실제 API에서 사용자 정보 받아오기
        let userData: any = null;
        let apiError: string | null = null;
        try {
            const url = `${UserInfoComponent.API_BASE_URL}/users/profile/${this.userId}`;
            
            // AuthManager의 authenticatedFetch 사용하여 자동 토큰 갱신
            const res = await AuthManager.authenticatedFetch(url, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!res.ok) {
                throw new Error(`API 요청 실패: ${res.status} ${res.statusText}`);
            }
            
            userData = await res.json();
        } catch (e) {
            console.error('[UserInfoComponent] API 오류:', e);
            apiError = e instanceof Error ? e.message : '사용자 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
        }

        // 에러 발생 시 안내 메시지 출력
        if (apiError || !userData || typeof userData !== 'object') {
            this.container.innerHTML = `<div class="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center font-medium m-5">${apiError || '사용자 정보가 없습니다.'}</div>`;
            return;
        }

        // 내 프로필 여부 판단 (UserManager 활용)
        const myId = UserManager.getUserId();
        // 더 안전한 타입 비교 - null/undefined 체크 후 문자열로 변환하여 비교
        const myIdStr = myId ? String(myId).trim() : '';
        const userIdStr = this.userId ? String(this.userId).trim() : '';
        const isMe = myIdStr && userIdStr && myIdStr === userIdStr;
        
        // 디버깅용 로그
        console.log('[UserInfoComponent] 프로필 구분 디버깅:');
        console.log('- myId:', myId);
        console.log('- this.userId:', this.userId);
        console.log('- myIdStr:', myIdStr);
        console.log('- userIdStr:', userIdStr);
        console.log('- isMe:', isMe);

        // ProfileDto 구조에 맞게 필드 매칭 (data 속성 안에 실제 데이터가 있음)
        const profileData = userData.data || {};
        const profileImage = profileData.profileImage || '';
        const username = profileData.username || '알 수 없음';
        const nickname = profileData.nickname || '닉네임 없음';
        const status = profileData.status || '정보 없음';
        const userId = profileData.id || this.userId;
        
        // 2FA 활성화 여부 확인 (twoFASecret이 있으면 활성화됨)
        const is2faEnabled = !!profileData.twoFASecret;

        // 템플릿 데이터 준비
        const templateData = {
            profileImage: profileImage,
            username: username,
            nickname: nickname,
            status: status,
            statusClasses: this.getStatusClasses(status),
            isMe: isMe,
            is2faEnabled: is2faEnabled,
            twoFaButtonText: is2faEnabled ? '2FA 비활성화' : '2FA 활성화'
        };
        
        // 디버깅용 로그
        console.log('[UserInfoComponent] 템플릿 데이터:', templateData);

        try {
            // 템플릿 로드 및 렌더링
            const template = await loadTemplate('/src/components/user/userInfo.template.html');
            const renderedTemplate = renderTemplate(template, templateData);
            this.container.innerHTML = renderedTemplate;
            
            this.setupEventListeners();
        } catch (templateError) {
            console.error('[UserInfoComponent] 템플릿 로드 오류:', templateError);
            this.container.innerHTML = `<div class="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center font-medium m-5">페이지를 로드하는 중 오류가 발생했습니다.</div>`;
        }
    }

    private setupEventListeners(): void {
        // 뒤로가기 버튼
        const backBtn = this.container.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (window.router) {
                    window.router.navigate('/');
                }
            });
        }

        // 2FA 토글 버튼 (내 프로필에만 표시)
        const toggle2faBtn = this.container.querySelector('.toggle-2fa-btn');
        if (toggle2faBtn) {
            toggle2faBtn.addEventListener('click', () => {
                const isEnabled = toggle2faBtn.getAttribute('data-enabled') === 'true';
                this.toggle2fa(isEnabled);
            });
        }

        // 내 정보 변경 버튼 (내 프로필에만 표시)
        const editProfileBtn = this.container.querySelector('.edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                this.editProfile();
            });
        }

        // 내 전적 보기 버튼 (내 프로필에만 표시)
        const viewMyStatsBtn = this.container.querySelector('.view-my-stats-btn');
        if (viewMyStatsBtn) {
            viewMyStatsBtn.addEventListener('click', () => {
                this.viewMyStats();
            });
        }

        // 회원 탈퇴 버튼 (내 프로필에만 표시)
        const deactivateAccountBtn = this.container.querySelector('.deactivate-account-btn');
        if (deactivateAccountBtn) {
            deactivateAccountBtn.addEventListener('click', () => {
                this.deactivateAccount();
            });
        }

        // 전적 보기 버튼 (다른 사용자 프로필에만 표시)
        const viewStatsBtn = this.container.querySelector('.view-stats-btn');
        if (viewStatsBtn) {
            viewStatsBtn.addEventListener('click', () => {
                this.viewUserStats();
            });
        }

        // 친구 추가 버튼 (다른 사용자 프로필에만 표시)
        const addFriendBtn = this.container.querySelector('.add-friend-btn');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => {
                this.addFriend();
            });
        }
    }

    private async toggle2fa(isCurrentlyEnabled: boolean): Promise<void> {
        if (isCurrentlyEnabled) {
            // 2FA 비활성화
            await this.disable2fa();
        } else {
            // 2FA 활성화 (QR 코드 설정 시작)
            await this.setup2FA();
        }
    }

    // 2FA 비활성화
    private async disable2fa(): Promise<void> {
        try {
            const confirmed = confirm('2FA를 비활성화하시겠습니까?');
            if (!confirmed) return;

            // UserManager에서 저장된 username 가져오기
            const username = UserManager.getUsername();
            
            if (!username) {
                alert('사용자명을 찾을 수 없습니다.');
                return;
            }

            const response = await AuthManager.authenticatedFetch(
                `${UserInfoComponent.API_BASE_URL}/auth/2fa/disable`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`2FA 비활성화 실패: ${response.status} ${response.statusText}`);
            }

            // 성공 시 버튼 상태 업데이트
            const toggle2faBtn = this.container.querySelector('.toggle-2fa-btn');
            if (toggle2faBtn) {
                toggle2faBtn.setAttribute('data-enabled', 'false');
                toggle2faBtn.textContent = '2FA 활성화';
            }

            alert('2FA가 성공적으로 비활성화되었습니다!');

        } catch (error) {
            console.error('[UserInfoComponent] 2FA 비활성화 오류:', error);
            const message = error instanceof Error ? error.message : '2FA 비활성화 중 오류가 발생했습니다.';
            alert(message);
        }
    }

    private editProfile(): void {
        if (window.router) {
            window.router.navigate('/profile/edit');
        }
    }

    private viewMyStats(): void {
        if (window.router) {
            window.router.navigate(`/user/${this.userId}/stats`);
        }
    }

    private async deactivateAccount(): Promise<void> {
        const confirmed = confirm('정말로 회원 탈퇴를 하시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
        if (!confirmed) return;

        try {
            const response = await AuthManager.authenticatedFetch(
                `${UserInfoComponent.API_BASE_URL}/users/disable`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`회원 탈퇴 실패: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            // 회원 탈퇴 성공 시 토큰 삭제 및 로그인 페이지로 이동
            alert('회원 탈퇴가 완료되었습니다.');
            AuthManager.clearTokens();
            
            if (window.router) {
                window.router.navigate('/login');
            }

        } catch (error) {
            console.error('[UserInfoComponent] 회원 탈퇴 오류:', error);
            const message = error instanceof Error ? error.message : '회원 탈퇴 중 오류가 발생했습니다.';
            alert(message);
        }
    }

    private viewUserStats(): void {
        if (window.router) {
            window.router.navigate(`/user/${this.userId}/stats`);
        }
    }

    private addFriend(): void {
        alert(`사용자 ${this.userId}를 친구로 추가 요청합니다. (구현 예정)`);
    }

    private getStatusClasses(status: string): string {
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'online':
                return 'bg-green-500 text-white';
            case 'offline':
                return 'bg-gray-500 text-white';
            case 'playing':
                return 'bg-purple-500 text-white';
            default:
                return 'bg-gray-400 text-white';
        }
    }

    // 2FA 설정 (QR 코드 받기)
    private async setup2FA(): Promise<void> {
        try {
            // UserManager에서 저장된 username 가져오기
            const username = UserManager.getUsername();
            
            if (!username) {
                alert('사용자명을 찾을 수 없습니다.');
                return;
            }

            const requestData = {
                username: username
            };
            
            console.log('2FA 설정 요청 데이터:', requestData);

            const response = await AuthManager.authenticatedFetch(
                `${UserInfoComponent.API_BASE_URL}/auth/2fa/setup`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                }
            );

            if (!response.ok) {
                // 에러 응답 내용을 확인
                const errorData = await response.text();
                console.error('2FA 설정 에러 응답:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorData
                });
                throw new Error(`2FA 설정 요청 실패: ${response.status} ${response.statusText} - ${errorData}`);
            }

            const responseData = await response.json();
            console.log('2FA 설정 응답:', responseData);

            // 백엔드 응답 구조에 맞게 QR 코드 데이터 추출
            let qrCodeDataURL: string;
            if (responseData.data?.qrCodeDataURL) {
                // ApiResponse.ok() 구조: { success: true, data: { qrCodeDataURL: "..." } }
                qrCodeDataURL = responseData.data.qrCodeDataURL;
            } else if (responseData.qrCodeDataURL) {
                // 직접 구조: { qrCodeDataURL: "..." }
                qrCodeDataURL = responseData.qrCodeDataURL;
            } else {
                console.error('예상하지 못한 응답 구조:', responseData);
                throw new Error('QR 코드 데이터를 찾을 수 없습니다.');
            }

            console.log('QR 코드 데이터:', qrCodeDataURL);

            // QR 코드 모달 표시
            this.show2FASetupModal(qrCodeDataURL);

        } catch (error) {
            console.error('[UserInfoComponent] 2FA 설정 오류:', error);
            alert(error instanceof Error ? error.message : '2FA 설정 중 오류가 발생했습니다.');
        }
    }

    // 2FA 설정 모달 표시
    private async show2FASetupModal(qrCodeDataURL: string): Promise<void> {
        try {
            // 모달 템플릿 로드
            const modalTemplate = await loadTemplate('/src/components/user/userInfo2FAModal.template.html');
            
            // 템플릿 데이터 준비
            const modalData = {
                qrCodeDataURL: qrCodeDataURL,
                qrCodeDataURLPreview: qrCodeDataURL.substring(0, 50)
            };
            
            // 템플릿 렌더링 후 body에 추가
            const renderedModal = renderTemplate(modalTemplate, modalData);
            document.body.insertAdjacentHTML('beforeend', renderedModal);
            
            // 이벤트 리스너 추가
            this.setup2FAModalEvents();
        } catch (templateError) {
            console.error('[UserInfoComponent] 모달 템플릿 로드 오류:', templateError);
            // 템플릿 로드 실패 시 기본 모달 생성
            this.show2FASetupModalFallback(qrCodeDataURL);
        }
    }
    
    // 템플릿 로드 실패 시 사용할 폴백 모달
    private show2FASetupModalFallback(qrCodeDataURL: string): void {
        // 모달 HTML 생성
        const modalHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="twofa-modal">
                <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                    <div class="text-center">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">2FA 설정</h2>
                        <p class="text-gray-600 mb-6">
                            Google Authenticator 또는 다른 2FA 앱으로 아래 QR 코드를 스캔하세요.
                        </p>
                        
                        <!-- QR 코드 이미지 -->
                        <div class="mb-6 flex justify-center">
                            <div class="qr-code-container">
                                <img src="${qrCodeDataURL}" 
                                     alt="2FA QR Code" 
                                     class="max-w-full h-auto border rounded-lg" 
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                                <div style="display: none;" class="text-red-500 p-4 border border-red-300 rounded-lg">
                                    QR 코드를 불러올 수 없습니다.<br/>
                                    <small class="text-gray-500">데이터: ${qrCodeDataURL.substring(0, 50)}...</small>
                                </div>
                            </div>
                        </div>

                        <!-- 토큰 입력 -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                인증 코드를 입력하세요 (6자리)
                            </label>
                            <input 
                                type="text" 
                                id="twofa-token" 
                                maxlength="6" 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl tracking-wider"
                                placeholder="000000"
                                autocomplete="off"
                            />
                        </div>

                        <!-- 버튼 -->
                        <div class="flex gap-4">
                            <button class="cancel-twofa-btn flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors">
                                취소
                            </button>
                            <button class="confirm-twofa-btn flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 모달을 body에 추가
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // 이벤트 리스너 추가
        this.setup2FAModalEvents();
    }

    // 2FA 모달 이벤트 설정
    private setup2FAModalEvents(): void {
        const modal = document.getElementById('twofa-modal');
        const cancelBtn = modal?.querySelector('.cancel-twofa-btn');
        const confirmBtn = modal?.querySelector('.confirm-twofa-btn');
        const tokenInput = modal?.querySelector('#twofa-token') as HTMLInputElement;

        // 취소 버튼
        cancelBtn?.addEventListener('click', () => {
            this.close2FAModal();
        });

        // 모달 배경 클릭시 닫기
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close2FAModal();
            }
        });

        // 확인 버튼
        confirmBtn?.addEventListener('click', () => {
            const token = tokenInput?.value?.trim();
            if (!token || token.length !== 6) {
                alert('6자리 인증 코드를 입력해주세요.');
                return;
            }
            this.verify2FASetup(token);
        });

        // Enter 키로 확인
        tokenInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const token = tokenInput.value.trim();
                if (token && token.length === 6) {
                    this.verify2FASetup(token);
                }
            }
        });

        // 숫자만 입력 허용
        tokenInput?.addEventListener('input', (e) => {
            const input = e.target as HTMLInputElement;
            input.value = input.value.replace(/[^0-9]/g, '');
        });
    }

    // 2FA 설정 검증
    private async verify2FASetup(token: string): Promise<void> {
        try {
            // UserManager에서 저장된 username 가져오기
            const username = UserManager.getUsername();
            
            if (!username) {
                alert('사용자명을 찾을 수 없습니다.');
                return;
            }

            const response = await AuthManager.authenticatedFetch(
                `${UserInfoComponent.API_BASE_URL}/auth/2fa/verify`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        token: token
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`2FA 검증 실패: ${response.status} ${response.statusText}`);
            }

            // 성공 시 모달 닫기 및 버튼 상태 업데이트
            this.close2FAModal();
            
            // 버튼 상태 업데이트
            const toggle2faBtn = this.container.querySelector('.toggle-2fa-btn');
            if (toggle2faBtn) {
                toggle2faBtn.setAttribute('data-enabled', 'true');
                toggle2faBtn.textContent = '2FA 비활성화';
            }
            
            alert('2FA가 성공적으로 활성화되었습니다!');

        } catch (error) {
            console.error('[UserInfoComponent] 2FA 검증 오류:', error);
            alert(error instanceof Error ? error.message : '2FA 검증 중 오류가 발생했습니다.');
        }
    }

    // 2FA 모달 닫기
    private close2FAModal(): void {
        const modal = document.getElementById('twofa-modal');
        modal?.remove();
    }

    destroy(): void {
        // 이벤트 리스너 정리
        const backBtn = this.container.querySelector('.back-btn');
        if (backBtn) {
            backBtn.removeEventListener('click', () => {});
        }

        const toggle2faBtn = this.container.querySelector('.toggle-2fa-btn');
        if (toggle2faBtn) {
            toggle2faBtn.removeEventListener('click', () => {});
        }

        const editProfileBtn = this.container.querySelector('.edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.removeEventListener('click', () => {});
        }

        const viewMyStatsBtn = this.container.querySelector('.view-my-stats-btn');
        if (viewMyStatsBtn) {
            viewMyStatsBtn.removeEventListener('click', () => {});
        }

        const deactivateAccountBtn = this.container.querySelector('.deactivate-account-btn');
        if (deactivateAccountBtn) {
            deactivateAccountBtn.removeEventListener('click', () => {});
        }

        const viewStatsBtn = this.container.querySelector('.view-stats-btn');
        if (viewStatsBtn) {
            viewStatsBtn.removeEventListener('click', () => {});
        }

        const addFriendBtn = this.container.querySelector('.add-friend-btn');
        if (addFriendBtn) {
            addFriendBtn.removeEventListener('click', () => {});
        }

        // 2FA 모달이 열려있다면 닫기
        this.close2FAModal();

        // 컨테이너는 Layout에서 관리하므로 여기서는 비우지 않음
        // this.clearContainer(); // 이 줄이 문제였음
    }
}
