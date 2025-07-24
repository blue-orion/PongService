import { Component } from "../Component";

import "../../styles/home.css";

export class HomeComponent extends Component {
  private animationId?: number;

  constructor(container: HTMLElement) {
    console.log("홈 페이지 생성자 호출");
    super(container);
  }

  private getTemplate(): string {
    return `
<div class="home-page">
  <!-- Hero Section -->
  <section class="hero-section">
    <div class="hero-background">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
      </div>
    </div>
    
    <div class="hero-content">
      <h1 class="hero-title">
        <span class="title-main">🏓 TRANSCENDENCE</span>
        <span class="title-sub">Ultimate Ping Pong Tournament</span>
      </h1>
      <p class="hero-description">
        실시간 멀티플레이어 핑퐁 토너먼트에 참여하세요!<br>
        친구들과 함께 경쟁하고, 최고의 핑퐁 챔피언이 되어보세요.
      </p>
      
      <div class="hero-actions">
        <button id="start-game-btn" class="btn-primary hero-btn">
          🎮 게임 시작하기
        </button>
        <button id="view-lobbies-btn" class="btn-secondary hero-btn">
          🏠 로비 둘러보기
        </button>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="features-section">
    <div class="section-container">
      <h2 class="section-title">🌟 주요 기능</h2>
      
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🏆</div>
          <h3 class="feature-title">토너먼트 시스템</h3>
          <p class="feature-description">
            다양한 토너먼트 형식으로 경쟁하고<br>
            최고의 핑퐁 플레이어가 되어보세요.
          </p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">👥</div>
          <h3 class="feature-title">실시간 멀티플레이</h3>
          <p class="feature-description">
            친구들과 실시간으로 핑퐁 게임을<br>
            즐기고 순위를 경쟁해보세요.
          </p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <h3 class="feature-title">통계 & 랭킹</h3>
          <p class="feature-description">
            자신의 게임 기록을 확인하고<br>
            전체 랭킹을 확인해보세요.
          </p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <h3 class="feature-title">친구 시스템</h3>
          <p class="feature-description">
            친구를 추가하고 함께 게임하며<br>
            소셜 기능을 즐겨보세요.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Game Preview Section -->
  <section class="game-preview-section">
    <div class="section-container">
      <h2 class="section-title">🎮 게임 미리보기</h2>
      
      <div class="game-preview-container">
        <div class="game-screen">
          <div class="ping-pong-demo">
            <div class="demo-paddle demo-paddle-left"></div>
            <div class="demo-ball"></div>
            <div class="demo-paddle demo-paddle-right"></div>
          </div>
        </div>
        
        <div class="game-info">
          <h3 class="game-info-title">클래식 핑퐁 게임</h3>
          <ul class="game-features-list">
            <li>✨ 부드러운 물리 엔진</li>
            <li>🎨 아름다운 그래픽</li>
            <li>⚡ 실시간 대전</li>
            <li>🏆 토너먼트 모드</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Quick Stats Section -->
  <section class="stats-section">
    <div class="section-container">
      <h2 class="section-title">📈 실시간 통계</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div id="total-players" class="stat-number">0</div>
          <div class="stat-label">전체 플레이어</div>
        </div>
        <div class="stat-card">
          <div id="active-games" class="stat-number">0</div>
          <div class="stat-label">진행 중인 게임</div>
        </div>
        <div class="stat-card">
          <div id="total-matches" class="stat-number">0</div>
          <div class="stat-label">총 경기 수</div>
        </div>
        <div class="stat-card">
          <div id="online-users" class="stat-number">0</div>
          <div class="stat-label">온라인 사용자</div>
        </div>
      </div>
      
      <div class="text-center mt-8">
        <button id="view-rankings-btn" class="btn-secondary">
          🏆 전체 랭킹 보기
        </button>
      </div>
    </div>
  </section>

  <!-- Call to Action Section -->
  <section class="cta-section">
    <div class="section-container">
      <div class="cta-content">
        <h2 class="cta-title">지금 바로 시작하세요!</h2>
        <p class="cta-description">
          친구들과 함께 핑퐁 토너먼트에 참여하고<br>
          최고의 핑퐁 챔피언 타이틀을 획득하세요!
        </p>
        
        <div class="cta-actions">
          <button id="join-tournament-btn" class="btn-primary cta-btn">
            🏆 토너먼트 참가하기
          </button>
        </div>
      </div>
    </div>
  </section>
</div>
    `;
  }

  async render(): Promise<void> {
    this.clearContainer();

    this.container.innerHTML = this.getTemplate();
    this.initializeAnimations();
    this.setupEventListeners();
    this.loadStats();
  }

  private setupEventListeners(): void {
    // 게임 시작 버튼
    const startGameBtn = this.container.querySelector("#start-game-btn");
    startGameBtn?.addEventListener("click", () => {
      if (window.router) {
        window.router.navigate("/lobby");
      }
    });

    // 로비 둘러보기 버튼
    const viewLobbiesBtn = this.container.querySelector("#view-lobbies-btn");
    viewLobbiesBtn?.addEventListener("click", () => {
      if (window.router) {
        window.router.navigate("/lobby");
      }
    });

    // 토너먼트 참가 버튼
    const joinTournamentBtn = this.container.querySelector("#join-tournament-btn");
    joinTournamentBtn?.addEventListener("click", () => {
      if (window.router) {
        window.router.navigate("/lobby");
      }
    });

    // 랭킹 보기 버튼
    const viewRankingsBtn = this.container.querySelector("#view-rankings-btn");
    viewRankingsBtn?.addEventListener("click", () => {
      if (window.router) {
        window.router.navigate("/dashboard");
      }
    });
  }

  private async loadStats(): Promise<void> {
    try {
      // 실제 API에서 통계 데이터를 가져올 수 있지만, 
      // 현재는 시뮬레이션 데이터를 사용합니다.
      this.animateStats();
    } catch (error) {
      console.error("통계 데이터 로드 실패:", error);
    }
  }

  private animateStats(): void {
    const stats = [
      { id: "total-players", target: Math.floor(Math.random() * 1000) + 500 },
      { id: "active-games", target: Math.floor(Math.random() * 50) + 10 },
      { id: "total-matches", target: Math.floor(Math.random() * 5000) + 2000 },
      { id: "online-users", target: Math.floor(Math.random() * 100) + 50 }
    ];

    stats.forEach(stat => {
      const element = this.container.querySelector(`#${stat.id}`);
      if (element) {
        this.animateNumber(element as HTMLElement, 0, stat.target, 2000);
      }
    });
  }

  private animateNumber(element: HTMLElement, start: number, end: number, duration: number): void {
    const startTime = performance.now();

    const updateNumber = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * easeOut);
      
      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      }
    };

    requestAnimationFrame(updateNumber);
  }

  private initializeAnimations(): void {
    // 플로팅 셰이프 애니메이션
    const shapes = this.container.querySelectorAll(".shape");
    shapes.forEach((shape, index) => {
      const element = shape as HTMLElement;
      element.style.animationDelay = `${index * 0.5}s`;
    });

    // 핑퐁 볼 애니메이션
    const ball = this.container.querySelector(".demo-ball") as HTMLElement;
    if (ball) {
      this.animatePingPongBall(ball);
    }

    // 섹션 슬라이드인 애니메이션
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-slide-in");
        }
      });
    }, observerOptions);

    const sections = this.container.querySelectorAll("section");
    sections.forEach(section => {
      observer.observe(section);
    });
  }

  private animatePingPongBall(ball: HTMLElement): void {
    let position = 0;
    let direction = 1;
    const speed = 2;
    const maxPosition = 300;

    const animate = () => {
      position += speed * direction;
      
      if (position >= maxPosition || position <= 0) {
        direction *= -1;
      }
      
      ball.style.transform = `translateX(${position}px)`;
      
      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
