import { Component } from "../Component";
import { io, Socket } from "socket.io-client";
import { AuthManager } from "../../utils/auth";
import { UserManager } from "../../utils/user";
import { loadTemplate, TEMPLATE_PATHS } from "../../utils/template-loader";

export class HeaderComponents extends Component {
    constructor(container: HTMLElement) {
        super(container);
    }

    async render(): Promise<void> {
        this.clearContainer();
        
        console.log('헤더 컴포넌트 렌더링 시작...');
        
        const template = await loadTemplate(TEMPLATE_PATHS.HEADER);
        this.container.innerHTML = template;

        // 저장된 사용자명 표시
        const username = UserManager.getUsername() || '사용자님';
        const usernameSpan = this.container.querySelector('.username');
        if (usernameSpan) {
            usernameSpan.textContent = `👤 ${username}`;
        }
        
        this.setupEventListeners();
        console.log('헤더 컴포넌트 렌더링 완료');
    }

    private setupEventListeners(): void {
        // 네비게이션 링크 클릭 이벤트 (내 프로필 제외)
        const navLinks = this.container.querySelectorAll('[data-route]:not(.my-profile-btn)');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target as HTMLElement;
                const route = target.getAttribute('data-route');
                if (route && window.router) {
                    window.router.navigate(route);
                }
            });
        });

        // 내 프로필 버튼 이벤트 (별도 처리)
        const myProfileBtn = this.container.querySelector('.my-profile-btn');
        if (myProfileBtn) {
            myProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // localStorage에서 내 userId 가져오기
                const myUserId = UserManager.getUserId();
                console.log('[HeaderComponent] 내 프로필 클릭, userId:', myUserId); // 디버깅용
                if (!myUserId) {
                    alert('내 사용자 ID 정보가 없습니다. 다시 로그인해주세요.');
                    return;
                }
                if (window.router) {
                    console.log(`[HeaderComponent] /user/${myUserId}로 이동`); // 디버깅용
                    window.router.navigate(`/user/${myUserId}`);
                }
            });
        };

        // 로그아웃 버튼 이벤트
        const logoutBtn = this.container.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await AuthManager.logout();
                    if (window.router) {
                        window.router.navigate('/login');
                    }
                } catch (error) {
                    console.error('로그아웃 실패:', error);
                }
            });
        }
    }

    destroy(): void {
        this.clearContainer();
    }
}
