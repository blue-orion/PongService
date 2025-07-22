import { Component } from "../Component";
import { AuthManager } from "../../utils/auth";

import "../../styles/dashboard.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class DashboardComponent extends Component {
  private rankTable!: HTMLElement;

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
    console.log("대시보드 페이지 생성 시작");
    this.clearContainer();

    this.container.innerHTML = this.getTemplate();
    this.rankTable = this.container.querySelector("#user-table-body") as HTMLElement;
    console.log(`fetch 내용: ${this.container.innerHTML}`);
    this.fetchUsers();
    this.initializeAnimations();
  }

  async fetchUsers(page = 0) {
    try {
      const raw = await AuthManager.authenticatedFetch(`${API_BASE_URL}/dashboard/rank`);
      const response = await raw.json();
      const data = response.data;

      if (response.success) {
        this.renderUsers(data.content);
        this.updateStats(data.content);

        // 페이지네이션 버튼 상태 업데이트
        this.container.querySelector("#prev-btn").disabled = data.first;
        this.container.querySelector("#next-btn").disabled = data.last;
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  getRankClass(rank) {
    if (rank === 1) return "rank-gold";
    if (rank === 2) return "rank-silver";
    if (rank === 3) return "rank-bronze";
    return "rank-default";
  }

  getWinRateClass(winRate) {
    if (winRate === 0) return "win-rate-none";
    if (winRate >= 60) return "win-rate-high";
    if (winRate >= 40) return "win-rate-medium";
    return "win-rate-low";
  }

  getInitials(nickname) {
    return nickname
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  renderUsers(users) {
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
    const sortedUsers = users.sort((a, b) => b.win_rate - a.win_rate);

    sortedUsers.forEach((user, index) => {
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
                <div class="profile-avatar">
                  ${user.profile_image ? `<img src="${user.profile_image}" alt="" class="w-full h-full rounded-full object-cover">` : this.getInitials(user.nickname)}
                </div>
                <div class="profile-info">
                  <h4 class="profile-name">${user.nickname}</h4>
                  <p class="profile-username">@${user.username}</p>
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

  updateStats(users) {
    const totalUsers = users.length;
    const activePlayers = users.filter((user) => user.total_wins + user.total_losses > 0).length;
    const avgWinRate = users.reduce((sum, user) => sum + user.win_rate, 0) / totalUsers;

    this.container.querySelector("#total-users").textContent = totalUsers;
    this.container.querySelector("#active-players").textContent = activePlayers;
    this.container.querySelector("#avg-win-rate").textContent = avgWinRate.toFixed(1) + "%";
  }

  initializeAnimations() {
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
      cancelAnimationFrame(this.animationId);
    }
  }
}
