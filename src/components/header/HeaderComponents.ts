import { Component } from "../Component";
import { AuthManager } from "../../utils/auth";

export class HeaderComponents extends Component {
    constructor(container: HTMLElement) {
        super(container);
    }

    private getTemplate(): string {
        return `
<header class="header">
    <div class="logo">
        <a href="/" data-route="/" class="logo-link">🎮 TSEN GAME</a>
    </div>
    <nav class="navigation">
        <ul>
            <li><a href="/" data-route="/">홈</a></li>
            <li><a href="/lobby" data-route="/lobby">로비 리스트</a></li>
            <li><a href="/dashboard" data-route="/dashboard">대시보드</a></li>
            <li><a href="/profile" data-route="/profile">내 프로필</a></li>
        </ul>
    </nav>
    <div class="user-menu">
        <span class="username">👤 사용자님</span>
        <button class="logout-btn">로그아웃</button>
    </div>
</header>
        `;
    }

    async render(): Promise<void> {
        this.clearContainer();
        
        console.log('헤더 컴포넌트 렌더링 시작...');
        
        this.container.innerHTML = this.getTemplate();
        
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
