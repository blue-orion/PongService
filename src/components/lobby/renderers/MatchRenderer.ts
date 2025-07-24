import { MatchData, MatchInfo, PlayerInfo } from "../../../types/lobby";
import { UserManager } from "../../../utils/user";

export class MatchRenderer {
  static renderMatchDetails(matchData: MatchData): string {
    if (matchData.tournament_status === "COMPLETED" && matchData.winner) {
      return this.renderCompletedTournament(matchData);
    }

    // 매칭이 새로 생성된 경우 VS 화면을 먼저 표시
    const currentUserId = UserManager.getUserId();
    const currentMatch = this.findCurrentUserMatch(matchData, currentUserId);
    
    if (currentMatch && currentMatch.game_status === "PENDING") {
      return this.renderVersusScreen(currentMatch);
    }

    return this.renderActiveTournament(matchData);
  }

  private static renderCompletedTournament(matchData: MatchData): string {
    return `
            <div class="tournament-completed">
                <div class="completion-icon">🏆</div>
                <h3>토너먼트 완료!</h3>
                <div class="winner-info">
                    <h4>우승자</h4>
                    <div class="winner-card">
                        ${
                          matchData.winner?.profile_image
                            ? `<img src="${matchData.winner.profile_image}" alt="프로필" class="winner-avatar">`
                            : `<div class="winner-avatar-placeholder">🏆</div>`
                        }
                        <span class="winner-name">${matchData.winner?.nickname || matchData.winner?.username || "알 수 없음"}</span>
                    </div>
                </div>
            </div>
        `;
  }

  private static renderVersusScreen(match: any): string {
    const player1 = match.player_one;
    const player2 = match.player_two;
    
    return `
            <div class="match-versus-screen">
                <div class="match-versus-header">
                    <h3>🎮 매칭 완료!</h3>
                    <p>게임이 곧 시작됩니다</p>
                </div>
                
                <div class="match-versus-content">
                    <div class="match-player-card card-left">
                        <div class="match-player-avatar">
                            ${player1?.user?.profile_image 
                              ? `<img src="${player1.user.profile_image}" alt="프로필" class="avatar-img">` 
                              : `<div class="avatar-placeholder">👤</div>`
                            }
                        </div>
                        <div class="player-info">
                            <h4 class="match-player-nickname">${player1?.user?.nickname || "플레이어 1"}</h4>
                            <p class="match-player-username">@${player1?.user?.username || "unknown"}</p>
                        </div>
                    </div>
                    
                    <div class="match-versus-divider">
                        <div class="match-vs-text">VS</div>
                        <div class="match-versus-animation">⚡</div>
                    </div>
                    
                    <div class="match-player-card card-right">
                        <div class="match-player-avatar">
                            ${player2?.user?.profile_image 
                              ? `<img src="${player2.user.profile_image}" alt="프로필" class="avatar-img">` 
                              : `<div class="avatar-placeholder">👤</div>`
                            }
                        </div>
                        <div class="player-info">
                            <h4 class="match-player-nickname">${player2?.user?.nickname || "플레이어 2"}</h4>
                            <p class="match-player-username">@${player2?.user?.username || "unknown"}</p>
                        </div>
                    </div>
                </div>
                
                <div class="match-info">
                    <div class="info-grid">
                        <div class="info-item">
                            <label>게임 ID:</label>
                            <span>${match.game_id}</span>
                        </div>
                        <div class="info-item">
                            <label>라운드:</label>
                            <span>${match.round}</span>
                        </div>
                        <div class="info-item">
                            <label>상태:</label>
                            <span class="match-status-pending">대기 중</span>
                        </div>
                    </div>
                </div>
                
                <div class="match-versus-footer">
                    <p class="match-instruction-text">게임 시작을 기다리고 있습니다...</p>
                </div>
            </div>
        `;
  }

  private static findCurrentUserMatch(matchData: MatchData, currentUserId: number | null): any | null {
    if (!currentUserId || !matchData.matches) {
      return null;
    }

    return matchData.matches.find((match: any) => {
      const player1Id = match.player_one?.user?.id;
      const player2Id = match.player_two?.user?.id;
      return player1Id === currentUserId || player2Id === currentUserId;
    }) || null;
  }

  private static renderActiveTournament(matchData: MatchData): string {
    console.log(matchData);
    return `
            <div class="tournament-bracket">
                <div class="tournament-header">
                    <h3>토너먼트 브라켓</h3>
                    <div class="tournament-info-grid">
                        <div class="info-item">
                            <label>토너먼트 ID:</label>
                            <span>${matchData.tournament_id || "N/A"}</span>
                        </div>
                        <div class="info-item">
                            <label>로비 ID:</label>
                            <span>${matchData.lobby_id || "N/A"}</span>
                        </div>
                        <div class="info-item">
                            <label>현재 라운드:</label>
                            <span>${matchData.current_round || 0} / ${matchData.total_rounds || 0}</span>
                        </div>
                        <div class="info-item">
                            <label>상태:</label>
                            <span class="tournament-status ${(matchData.tournament_status || "").toLowerCase()}">${this.getStatusText(matchData.tournament_status)}</span>
                        </div>
                    </div>
                </div>
                
                ${this.renderTournamentBracket(matchData.matches || [], matchData.total_rounds || 0)}
            </div>
        `;
  }

  static renderTournamentBracket(matches: MatchInfo[], totalRounds: number): string {
    const matchesByRound = this.groupMatchesByRound(matches);

    let bracketHTML = '<div class="bracket-container">';

    for (let round = 1; round <= totalRounds; round++) {
      const roundMatches = matchesByRound[round] || [];
      bracketHTML += `
                <div class="bracket-round" data-round="${round}">
                    <div class="round-header">
                        <h4>${this.getRoundName(round, totalRounds)}</h4>
                        <span class="round-number">라운드 ${round}</span>
                    </div>
                    <div class="round-matches">
                        ${roundMatches.map((match) => this.renderBracketMatch(match)).join("")}
                    </div>
                </div>
            `;

      if (round < totalRounds) {
        bracketHTML += '<div class="bracket-connector"></div>';
      }
    }

    bracketHTML += "</div>";
    return bracketHTML;
  }

  private static groupMatchesByRound(matches: MatchInfo[]): { [round: number]: MatchInfo[] } {
    const matchesByRound: { [round: number]: MatchInfo[] } = {};
    matches.forEach((match) => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = [];
      }
      matchesByRound[match.round].push(match);
    });
    return matchesByRound;
  }

  private static getRoundName(round: number, totalRounds: number): string {
    if (round === totalRounds) return "결승";
    if (round === totalRounds - 1) return "준결승";
    if (round === totalRounds - 2) return "8강";
    if (round === totalRounds - 3) return "16강";
    return `라운드 ${round}`;
  }

  static renderBracketMatch(match: MatchInfo): string {
    const isCompleted = match.game_status === "COMPLETED";
    const isPending = match.game_status === "PENDING";
    const isInProgress = match.game_status === "IN_PROGRESS";

    return `
            <div class="bracket-match ${match.game_status.toLowerCase()}" data-game-id="${match.game_id}">
                <div class="match-header">
                    <span class="match-id">Game ${match.game_id}</span>
                    <span class="match-status ${match.game_status.toLowerCase()}">${this.getGameStatusText(match.game_status)}</span>
                </div>
                
                <div class="match-players">
                    ${this.renderPlayerSlot(match.left_player, match.winner, match.loser, "left", isCompleted, isPending)}
                    
                    <div class="vs-divider">
                        <span class="vs-text">VS</span>
                    </div>
                    
                    ${this.renderPlayerSlot(match.right_player, match.winner, match.loser, "right", isCompleted, isPending)}
                </div>
                
                ${isCompleted && match.winner ? this.renderMatchResult(match) : ""}
                ${isInProgress ? this.renderMatchProgress() : ""}
            </div>
        `;
  }

  private static renderPlayerSlot(
    player: PlayerInfo,
    winner: PlayerInfo | undefined,
    loser: PlayerInfo | undefined,
    position: "left" | "right",
    isCompleted: boolean,
    isPending: boolean
  ): string {
    const isWinner = winner?.position === position;
    const isLoser = loser?.position === position;

    return `
            <div class="player-slot ${isWinner ? "winner" : isLoser ? "loser" : ""}">
                <div class="player-info">
                    ${
                      player.profile_image
                        ? `<img src="${player.profile_image}" alt="프로필" class="player-avatar">`
                        : `<div class="player-avatar-placeholder">👤</div>`
                    }
                    <div class="player-details">
                        <span class="player-name">${player?.nickname || "Unknown"}</span>
                        <span class="player-username">@${player?.username || "unknown"}</span>
                    </div>
                </div>
                <div class="player-score">
                    ${isCompleted ? player.score : isPending ? "-" : player.score || 0}
                </div>
            </div>
        `;
  }

  private static renderMatchResult(match: MatchInfo): string {
    return `
            <div class="match-result">
                <div class="winner-info">
                    <span class="winner-label">승자:</span>
                    <span class="winner-name">${match.winner?.nickname}</span>
                </div>
                ${
                  match.play_time
                    ? `
                    <div class="play-time">
                        <span class="time-label">경기 시간:</span>
                        <span class="time-value">${match.play_time}</span>
                    </div>
                `
                    : ""
                }
            </div>
        `;
  }

  private static renderMatchProgress(): string {
    return `
            <div class="match-progress">
                <div class="progress-indicator">
                    <span class="progress-text">경기 중...</span>
                    <div class="loading-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;
  }

  static getStatusText(status: string | undefined): string {
    if (!status) return "알 수 없음";

    switch (status) {
      case "IN_PROGRESS":
        return "진행 중";
      case "COMPLETED":
        return "완료";
      case "PENDING":
        return "대기 중";
      default:
        return status;
    }
  }

  static getGameStatusText(status: string): string {
    switch (status) {
      case "PENDING":
        return "대기";
      case "IN_PROGRESS":
        return "진행중";
      case "COMPLETED":
        return "완료";
      default:
        return status || "알 수 없음";
    }
  }

  // 인라인 매칭 정보 렌더링 (로비 내 표시용)
  static renderMatchInfoContent(matchData: MatchData): string {
    if (matchData.tournament_status === "COMPLETED" && matchData.winner) {
      return this.renderInlineCompletedTournament(matchData);
    }

    return this.renderInlineActiveTournament(matchData);
  }

  private static renderInlineCompletedTournament(matchData: MatchData): string {
    return `
            <div class="tournament-completed-inline">
                <div class="completion-header">
                    <span class="completion-icon">🏆</span>
                    <h4>토너먼트 완료!</h4>
                </div>
                <div class="winner-info-inline">
                    ${
                      matchData.winner?.profile_image
                        ? `<img src="${matchData.winner.profile_image}" alt="프로필" class="winner-avatar-small">`
                        : `<div class="winner-avatar-placeholder-small">🏆</div>`
                    }
                    <div class="winner-details">
                        <span class="winner-label">우승자:</span>
                        <span class="winner-name">${matchData.winner?.nickname || matchData.winner?.username || "알 수 없음"}</span>
                    </div>
                </div>
            </div>
        `;
  }

  private static renderInlineActiveTournament(matchData: MatchData): string {
    const currentRoundMatches =
      matchData.matches?.filter((match: MatchInfo) => match.round === matchData.current_round) || [];

    return `
            <div class="tournament-info-inline">
                <div class="tournament-header-info">
                    <div class="tournament-stats">
                        <span class="stat-item">토너먼트 ID: <strong>${matchData.tournament_id || "N/A"}</strong></span>
                        <span class="stat-item">현재 라운드: <strong>${matchData.current_round || 0}/${matchData.total_rounds || 0}</strong></span>
                        <span class="stat-item">상태: <strong class="status ${(matchData.tournament_status || "").toLowerCase()}">${this.getStatusText(matchData.tournament_status)}</strong></span>
                    </div>
                </div>
                
                <div class="current-matches">
                    <h5>현재 라운드 매치</h5>
                    ${this.renderCurrentMatches(currentRoundMatches)}
                </div>
            </div>
        `;
  }

  private static renderCurrentMatches(currentRoundMatches: MatchInfo[]): string {
    if (currentRoundMatches.length === 0) {
      return '<p class="no-matches">현재 라운드 매치가 없습니다.</p>';
    }

    const displayMatches = currentRoundMatches.slice(0, 2);
    const moreCount = Math.max(0, currentRoundMatches.length - 2);

    return `
            ${displayMatches.map((match) => this.renderMatchSummaryCard(match)).join("")}
            ${
              moreCount > 0
                ? `
                <div class="more-matches">
                    +${moreCount}개 매치 더...
                </div>
            `
                : ""
            }
        `;
  }

  private static renderMatchSummaryCard(match: MatchInfo): string {
    return `
            <div class="match-summary-card">
                <div class="match-info-header">
                    <span class="match-number">Game ${match.game_id}</span>
                    <span class="match-status ${match.game_status.toLowerCase()}">${this.getGameStatusText(match.game_status)}</span>
                </div>
                <div class="match-players-summary">
                    ${this.renderPlayerSummary(match.left_player, match.game_status)}
                    <span class="vs-text">vs</span>
                    ${this.renderPlayerSummary(match.right_player, match.game_status)}
                </div>
                ${
                  match.winner
                    ? `
                    <div class="match-winner">
                        ✅ ${match.winner?.nickname || "Unknown"} 승리
                        ${match.play_time ? `<span class="play-time-small">(${match.play_time})</span>` : ""}
                    </div>
                `
                    : ""
                }
            </div>
        `;
  }

  private static renderPlayerSummary(player: PlayerInfo, gameStatus: string): string {
    return `
            <div class="player-summary">
                ${
                  player?.profile_image
                    ? `<img src="${player.profile_image}" alt="프로필" class="player-avatar-tiny">`
                    : `<div class="player-avatar-placeholder-tiny">👤</div>`
                }
                <span class="player-name">${player?.nickname || "Unknown"}</span>
                ${gameStatus === "COMPLETED" ? `<span class="score">${player?.score || 0}</span>` : ""}
            </div>
        `;
  }
}
