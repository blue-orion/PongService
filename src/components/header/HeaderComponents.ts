import { Component } from "../Component";
import { io, Socket } from "socket.io-client";
import { AuthManager } from "../../utils/auth";
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
        
        this.setupEventListeners();
        console.log('헤더 컴포넌트 렌더링 완료');
    }

    private setupEventListeners(): void {
        // 네비게이션 링크 클릭 이벤트
        const navLinks = this.container.querySelectorAll('[data-route]');
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
