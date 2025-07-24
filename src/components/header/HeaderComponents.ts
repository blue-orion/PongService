import { Component } from "../Component";
import { AuthManager } from "../../utils/auth";
import { UserManager } from "../../utils/user";

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
            <li><a href="#" class="my-profile-btn">내 프로필</a></li>
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

    console.log("헤더 컴포넌트 렌더링 시작...");

    this.container.innerHTML = this.getTemplate();

    // 저장된 사용자명 표시
    const username = UserManager.getUsername() || "사용자님";
    const usernameSpan = this.container.querySelector(".username");
    if (usernameSpan) {
      usernameSpan.textContent = `👤 ${username}`;
    }

    this.setupEventListeners();
    console.log("헤더 컴포넌트 렌더링 완료");
  }

  private setupEventListeners(): void {
    // 일반 네비게이션 링크 클릭 이벤트 (내 프로필 제외)
    const navLinks = this.container.querySelectorAll("[data-route]");
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = e.target as HTMLElement;
        const route = target.getAttribute("data-route");
        if (route && window.router) {
          console.log(`[HeaderComponent] 네비게이션: ${route}`);
          window.router.navigate(route);
        }
      });
    });

    // 내 프로필 버튼 이벤트 (별도 처리)
    const myProfileBtn = this.container.querySelector(".my-profile-btn");
    if (myProfileBtn) {
      myProfileBtn.addEventListener("click", (e) => {
        e.preventDefault();
        // UserManager에서 내 userId 가져오기
        const myUserId = UserManager.getUserId();
        console.log("[HeaderComponent] 내 프로필 클릭, userId:", myUserId);
        if (!myUserId) {
          alert("내 사용자 ID 정보가 없습니다. 다시 로그인해주세요.");
          return;
        }
        if (window.router) {
          const profileRoute = `/user/${myUserId}`;
          console.log(`[HeaderComponent] ${profileRoute}로 이동`);
          window.router.navigate(profileRoute);
        }
      });
    }

    // 로그아웃 버튼 이벤트
    const logoutBtn = this.container.querySelector(".logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await AuthManager.logout();
          if (window.router) {
            window.router.navigate("/login");
          }
        } catch (error) {
          console.error("로그아웃 실패:", error);
        }
      });
    }
  }

  destroy(): void {
    this.clearContainer();
  }
}
