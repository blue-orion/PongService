import { Component } from "../Component";
import { AuthManager } from "../../utils/auth";

import "../../styles/dashboard.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class DashboardComponent extends Component {
  private rankTable!: HTMLElement;
  private animationId?: number;

  constructor(container: HTMLElement) {
    console.log("대시보드 생성자 호출");
    super(container);
  }

  private getTemplate(): string {
    return `
<header class="dashboard-header slide-up">
  <h1 class="dashboard-title leading-tight">🏆 User Ranking Dashboard</h1>
  <p class="dashboard-subtitle">실시간 사용자 랭킹 및 통계</p>
</header>

<!-- Stats Overview -->
<section class="stats-grid slide-up">
  <div class="stat-card hover-lift hover-glow">
    <div id="total-users" class="stat-number">0</div>
    <div class="stat-label">Total Users</div>
  </div>
  <div class="stat-card hover-lift hover-glow">
    <div id="active-players" class="stat-number">0</div>
    <div class="stat-label">Active Players</div>
  </div>
  <div class="stat-card hover-lift hover-glow">
    <div id="avg-win-rate" class="stat-number">0.0%</div>
    <div class="stat-label">Average Win Rate</div>
  </div>
</section>

<!-- Main Content -->
<main class="rankings-container slide-up">
  <div class="rankings-header">
    <div>
      <h2 class="rankings-title">User Rankings</h2>
      <p class="rankings-subtitle">승률 기준 사용자 순위</p>
    </div>
  </div>

  <div class="overflow-x-auto">
    <table class="rankings-table">
      <thead>
        <tr>
          <th class="table-header">Rank</th>
          <th class="table-header">User</th>
          <th class="table-header">Games Played</th>
          <th class="table-header">Wins</th>
          <th class="table-header">Losses</th>
          <th class="table-header">Win Rate</th>
        </tr>
      </thead>
      <tbody id="user-table-body">
        <!-- Loading state -->
        <tr>
          <td colspan="6" class="loading-container">
            <div class="loading-spinner"></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  <div class="pagination-container">
    <button id="prev-btn" disabled class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed">
      Previous
    </button>
    <span id="page-info" class="pagination-info">Page 1</span>
    <button id="next-btn" class="btn-primary">Next</button>
  </div>
</main>
    `;
  }

  async render(): Promise<void> {
    this.clearContainer();

    this.container.innerHTML = this.getTemplate();
    this.rankTable = this.container.querySelector("#user-table-body") as HTMLElement;
    this.fetchUsers();
    this.initializeAnimations();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // 컨테이너 내에서만 클릭 이벤트 처리
    this.container.addEventListener("click", this.clickHandler.bind(this));
  }

  async fetchUsers(page: number = 0): Promise<void> {
    try {
      const raw = await AuthManager.authenticatedFetch(`${API_BASE_URL}/dashboard/rank`);
      const response = await raw.json();
      const data = response.data;

      if (response.success) {
        this.renderUsers(data.content);
        this.updateStats(data.content);

        // 페이지네이션 버튼 상태 업데이트
        const prevBtn = this.container.querySelector("#prev-btn") as HTMLButtonElement;
        const nextBtn = this.container.querySelector("#next-btn") as HTMLButtonElement;
        if (prevBtn) prevBtn.disabled = data.first;
        if (nextBtn) nextBtn.disabled = data.last;
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  getRankClass(rank: number): string {
    if (rank === 1) return "rank-gold";
    if (rank === 2) return "rank-silver";
    if (rank === 3) return "rank-bronze";
    return "rank-default";
  }

  getWinRateClass(winRate: number): string {
    if (winRate === 0) return "win-rate-none";
    if (winRate >= 60) return "win-rate-high";
    if (winRate >= 40) return "win-rate-medium";
    return "win-rate-low";
  }

  getInitials(nickname: string): string {
    return nickname
      .split(" ")
      .map((word: string) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  private clickHandler(e: MouseEvent) {
    e.preventDefault();
    const target = (e.target as HTMLElement).closest("[data-route]") as HTMLElement;
    if (!target) return;
    const route = target.getAttribute("data-route");
    if (route && window.router) {
      window.router.navigate(route);
    }
  }

  renderUsers(users: any[]): void {
    const tbody = this.rankTable;
    tbody.innerHTML = "";

    if (users.length === 0) {
      tbody.innerHTML = `
          <tr>
            <td colspan="6" class="empty-state">
              <div class="empty-state-icon">👤</div>
              <div class="empty-state-title">No users found</div>
              <div class="empty-state-description">There are no users to display at this time.</div>
            </td>
          </tr>
        `;
      return;
    }
    // 승률순으로 정렬
    const sortedUsers = users.sort((a: any, b: any) => b.win_rate - a.win_rate);

    sortedUsers.forEach((user: any, index: number) => {
      const rank = index + 1;
      const games = user.total_wins + user.total_losses;
      const tr = document.createElement("tr");
      tr.className = "table-row";
      tr.innerHTML = `
            <td class="table-cell text-center">
              <span class="rank-badge ${this.getRankClass(rank)}">
                ${rank}
              </span>
            </td>
            <td class="table-cell">
              <div class="profile-container">
                <div class="profile-avatar cursor-pointer" data-route="/info/${user.id}">
									${this.getProfileImage(user)}
                </div>
                <div class="profile-info">
									<h4 class="profile-name">
										<span class="username cursor-pointer" data-route="/info/${user.id}">${user.nickname}</span>
									</h4>
                  <span class="profile-username cursor-pointer" data-route="/info/${user.id}">@${user.username}</span>
                </div>
              </div>
            </td>
            <td class="table-cell text-center">
              ${games > 0 ? games : '<span class="no-games-text">No games</span>'}
            </td>
            <td class="table-cell text-center">
              <span class="wins-text">${user.total_wins}</span>
            </td>
            <td class="table-cell text-center">
              <span class="losses-text">${user.total_losses}</span>
            </td>
            <td class="table-cell text-center">
              <span class="win-rate-badge ${this.getWinRateClass(user.win_rate)}">
                ${user.win_rate.toFixed(1)}%
              </span>
            </td>
          `;
      tbody.appendChild(tr);
    });
  }

  getProfileImage(user: any): string {
    let profile_image: string;
    if (user.profile_image) {
      profile_image = `<img src="${user.profile_image}" alt="" class="w-full h-full rounded-full object-cover">`;
    } else {
      profile_image = this.getInitials(user.nickname);
    }
    return profile_image;
  }

  updateStats(users: any[]): void {
    const totalUsers = users.length;
    const activePlayers = users.filter((user: any) => user.total_wins + user.total_losses > 0).length;
    const avgWinRate = users.reduce((sum: number, user: any) => sum + user.win_rate, 0) / totalUsers;

    const totalUsersEl = this.container.querySelector("#total-users");
    const activePlayersEl = this.container.querySelector("#active-players");
    const avgWinRateEl = this.container.querySelector("#avg-win-rate");
    
    if (totalUsersEl) totalUsersEl.textContent = String(totalUsers);
    if (activePlayersEl) activePlayersEl.textContent = String(activePlayers);
    if (avgWinRateEl) avgWinRateEl.textContent = avgWinRate.toFixed(1) + "%";
  }

  initializeAnimations(): void {
    // 페이지 로드 애니메이션
    this.animationId = setTimeout(() => {
      document.querySelectorAll(".slide-up").forEach((el, index) => {
        setTimeout(() => {
          el.classList.add("active");
        }, index * 200);
      });
    }, 100);
  }

  destroy(): void {
    // 애니메이션 정리
    if (this.animationId) {
      clearTimeout(this.animationId);
    }
    // 클릭 이벤트는 컨테이너가 제거될 때 자동으로 정리됨
  }
}
