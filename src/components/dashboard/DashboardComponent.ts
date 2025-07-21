import { Component } from "../Component";
import { AuthManager } from "../../utils/auth";
import { loadTemplate, TEMPLATE_PATHS } from "../../utils/template-loader";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class DashboardComponent extends Component {
  constructor(container: HTMLElement) {
    console.log("대시보드 생성자 호출");
    super(container);
  }

  async render(): Promise<void> {
    console.log("대시보드 페이지 생성 시작");
    this.clearContainer();

    const template = await loadTemplate(TEMPLATE_PATHS.DASHBOARD);
    this.container.innerHTML = template;
    console.log(`fetch 내용: ${this.container.innerHTML}`);
    this.fetchUsers();
  }

  async fetchUsers(page = 0) {
    try {
      const response = await AuthManager.authenticatedFetch(`${API_BASE_URL}/dashboard/rank`);
      const data = await response.json().then((res) => res.data);

      console.log(data);
      if (response.success) {
        renderUsers(data.content);
        updateStats(data.content);

        // 페이지네이션 버튼 상태 업데이트
        document.getElementById("prev-btn").disabled = data.first;
        document.getElementById("next-btn").disabled = data.last;
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  getRankBadgeClass(rank) {
    if (rank === 1) return "rank-1";
    if (rank === 2) return "rank-2";
    if (rank === 3) return "rank-3";
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
    console.log(`users: ${users}`);
    const tbody = document.getElementById("user-table-body");
    tbody.innerHTML = "";

    // 승률순으로 정렬
    const sortedUsers = users.sort((a, b) => b.win_rate - a.win_rate);

    sortedUsers.forEach((user, index) => {
      const rank = index + 1;
      const totalGames = user.total_wins + user.total_losses;

      const row = document.createElement("tr");
      row.innerHTML = `
                    <td>
                        <span class="rank-badge ${getRankBadgeClass(rank)}">${rank}</span>
                    </td>
                    <td>
                        <div class="profile-cell">
                            <div class="profile-image">
                                ${user.profile_image ? `<img src="${user.profile_image}" alt="Profile">` : getInitials(user.nickname)}
                            </div>
                            <div class="user-info">
                                <h4>${user.nickname}</h4>
                                <p>@${user.username}</p>
                            </div>
                        </div>
                    </td>
                    <td class="stats-cell">
                        ${totalGames > 0 ? totalGames : '<span class="no-games">No games</span>'}
                    </td>
                    <td class="stats-cell">
                        <span class="wins">${user.total_wins}</span>
                    </td>
                    <td class="stats-cell">
                        <span class="losses">${user.total_losses}</span>
                    </td>
                    <td>
                        <span class="win-rate ${getWinRateClass(user.win_rate)}">
                            ${user.win_rate.toFixed(1)}%
                        </span>
                    </td>
                `;
      tbody.appendChild(row);
    });
  }

  updateStats(users) {
    const totalUsers = users.length;
    const activePlayers = users.filter((user) => user.total_wins + user.total_losses > 0).length;
    const avgWinRate = users.reduce((sum, user) => sum + user.win_rate, 0) / totalUsers;

    document.getElementById("total-users").textContent = totalUsers;
    document.getElementById("active-players").textContent = activePlayers;
    document.getElementById("avg-win-rate").textContent = avgWinRate.toFixed(1) + "%";
  }
}
