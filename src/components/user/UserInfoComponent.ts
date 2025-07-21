import { Component } from "../Component";
import { UserManager } from "../../utils/user";

export class UserInfoComponent extends Component {
    private userId: string;

    constructor(container: HTMLElement, userId: string) {
        super(container);
        this.userId = userId;
    }

    async render(): Promise<void> {
        this.clearContainer();
        console.log('사용자 정보 컴포넌트 렌더링 시작..., 사용자 ID:', this.userId);

        // userId가 없으면 안내 메시지 출력
        if (!this.userId) {
            this.container.innerHTML = `<div class="user-info-error">사용자 ID 정보가 없습니다. 다시 로그인해주세요.</div>`;
            return;
        }

        // 실제 API에서 사용자 정보 받아오기
        let userData: any = null;
        let apiError: string | null = null;
        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL;
            const url = `${apiBase}/users/profile/${this.userId}`;
            const token = window.localStorage.getItem('pong_access_token');
            
            console.log('[UserInfoComponent] API 요청 시작');
            console.log('[UserInfoComponent] URL:', url);
            console.log('[UserInfoComponent] userId:', this.userId);
            console.log('[UserInfoComponent] token 존재여부:', !!token);
            
            if (!token) {
                throw new Error('액세스 토큰이 없습니다. 다시 로그인해주세요.');
            }
            
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('[UserInfoComponent] Response status:', res.status);
            console.log('[UserInfoComponent] Response headers:', Object.fromEntries(res.headers.entries()));
            
            if (!res.ok) {
                const errorText = await res.text();
                console.log('[UserInfoComponent] Error response body:', errorText);
                throw new Error(`API 요청 실패: ${res.status} ${res.statusText}`);
            }
            
            userData = await res.json();
            console.log('[UserInfoComponent] API 응답 성공, userData:', userData);
            console.log('[UserInfoComponent] userData JSON stringify:', JSON.stringify(userData, null, 2));
            console.log('[UserInfoComponent] userData 타입:', typeof userData);
            console.log('[UserInfoComponent] userData 키들:', Object.keys(userData));
            
            // 중첩 구조 확인
            if (userData.data) {
                console.log('[UserInfoComponent] userData.data:', userData.data);
                console.log('[UserInfoComponent] userData.data 키들:', Object.keys(userData.data));
            }
            if (userData.user) {
                console.log('[UserInfoComponent] userData.user:', userData.user);
                console.log('[UserInfoComponent] userData.user 키들:', Object.keys(userData.user));
            }
        } catch (e) {
            console.error('[UserInfoComponent] API 오류:', e);
            apiError = e instanceof Error ? e.message : '사용자 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
        }

        // 에러 발생 시 안내 메시지 출력
        if (apiError || !userData || typeof userData !== 'object') {
            this.container.innerHTML = `<div class="user-info-error">${apiError || '사용자 정보가 없습니다.'}</div>`;
            return;
        }

        // 내 프로필 여부 판단 (UserManager 활용)
        const myId = UserManager.getUserId();
        const isMe = myId === this.userId;

        // ProfileDto 구조에 맞게 필드 매칭 (data 속성 안에 실제 데이터가 있음)
        const profileData = userData.data || {};
        const profileImage = profileData.profileImage || '';
        const username = profileData.username || '알 수 없음';
        const nickname = profileData.nickname || '닉네임 없음';
        const status = profileData.status || '정보 없음';
        const userId = profileData.id || this.userId;
        
        console.log('[UserInfoComponent] 실제 받은 status 값:', status);
        console.log('[UserInfoComponent] status 타입:', typeof status);
        console.log('[UserInfoComponent] status === "ONLINE":', status === "ONLINE");
        console.log('[UserInfoComponent] status === "online":', status === "online");
        console.log('[UserInfoComponent] status === "OFFLINE":', status === "OFFLINE");
        console.log('[UserInfoComponent] status.toLowerCase():', status.toLowerCase());

        this.container.innerHTML = `
            <div class="user-info-page">
                <div class="page-header">
                    <button class="back-btn">← 뒤로가기</button>
                    <h2>사용자 정보</h2>
                </div>
                <div class="user-profile-card">
                    <div class="profile-avatar">
                        ${profileImage
                            ? `<img src="${profileImage}" alt="${username}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">`
                            : `<div class="avatar-placeholder">👤</div>`
                        }
                    </div>
                    <div class="profile-info">
                        <h3 class="username">${username}</h3>
                        <p class="nickname">닉네임: ${nickname}</p>
                        <p class="user-status status-${status.toLowerCase()}">${status}</p>
                    </div>
                    ${isMe ? `
                        <div class="profile-actions">
                            <button class="enable-2fa-btn btn-primary">2FA 활성화</button>
                        </div>
                    ` : ""}
                </div>
            </div>
            
            <style>
                .user-info-page {
                    padding: 20px;
                    max-width: 600px;
                    margin: 0 auto;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .page-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #e5e7eb;
                }
                
                .back-btn {
                    background: none;
                    border: none;
                    font-size: 16px;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 8px 12px;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                    margin-right: 15px;
                }
                
                .back-btn:hover {
                    background-color: #f3f4f6;
                    color: #374151;
                }
                
                .page-header h2 {
                    margin: 0;
                    color: #111827;
                    font-size: 24px;
                    font-weight: 600;
                }
                
                .user-profile-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 20px;
                    padding: 30px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    color: white;
                    position: relative;
                    overflow: hidden;
                }
                
                .user-profile-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    z-index: 0;
                }
                
                .user-profile-card > * {
                    position: relative;
                    z-index: 1;
                }
                
                .profile-avatar {
                    text-align: center;
                    margin-bottom: 20px;
                }
                
                .profile-avatar img {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }
                
                .profile-avatar img:hover {
                    transform: scale(1.05);
                }
                
                .avatar-placeholder {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 48px;
                    margin: 0 auto;
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
                }
                
                .profile-info {
                    text-align: center;
                    margin-bottom: 25px;
                }
                
                .username {
                    font-size: 28px;
                    font-weight: 700;
                    margin: 0 0 10px 0;
                    color: white;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                
                .nickname {
                    font-size: 16px;
                    margin: 0 0 15px 0;
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 500;
                }
                
                .user-status {
                    display: inline-block;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 600;
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
                }
                
                .status-online, .status-ONLINE {
                    background-color: #10b981;
                    color: white;
                }
                
                .status-offline, .status-OFFLINE {
                    background-color: #6b7280;
                    color: white;
                }
                
                .status-playing, .status-PLAYING {
                    background-color: #8b5cf6;
                    color: white;
                }
                
                /* 기본 상태 (알 수 없는 상태) */
                .user-status:not([class*="status-"]) {
                    background-color: #9ca3af;
                    color: white;
                }
                
                .profile-actions {
                    text-align: center;
                }
                
                .btn-primary {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                }
                
                .btn-primary:hover {
                    background: rgba(255, 255, 255, 0.3);
                    border-color: rgba(255, 255, 255, 0.5);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
                }
                
                .btn-primary:active {
                    transform: translateY(0);
                }
                
                .user-info-error {
                    background-color: #fef2f2;
                    border: 1px solid #fecaca;
                    color: #dc2626;
                    padding: 16px;
                    border-radius: 12px;
                    text-align: center;
                    font-weight: 500;
                    margin: 20px;
                }
            </style>
        `;
        
        this.setupEventListeners();
        console.log('사용자 정보 컴포넌트 렌더링 완료');
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

        // 2FA 활성화 버튼 (내 프로필에만 표시)
        const enable2faBtn = this.container.querySelector('.enable-2fa-btn');
        if (enable2faBtn) {
            enable2faBtn.addEventListener('click', () => {
                this.enable2fa();
            });
        }
    }

    private async enable2fa(): Promise<void> {
        // 실제로는 서버에 2FA 활성화 요청
        // 예시: fetch('/v1/auth/2fa/enable', { method: 'POST', headers: { Authorization: ... } })
        alert('2FA 활성화 요청! (실제 구현 필요)');
    }

    destroy(): void {
        this.clearContainer();
    }
}
