import { MatchData, MatchInfo, PlayerInfo, GameMatch } from "../../../types/lobby";
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
                            ${
                              player1?.user?.profile_image
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
                            ${
                              player2?.user?.profile_image
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

  private static findCurrentUserMatch(matchData: MatchData, currentUserId: number | null): GameMatch | null {
    if (!currentUserId) {
      return null;
    }

    // 백엔드 호환성 - games 배열 또는 matches 배열 모두 지원
    const matches = matchData.games || matchData.matches || [];
    if (!matches || matches.length === 0) {
      return null;
    }

    return (
      matches.find((match: GameMatch) => {
        // 백엔드 DTO 호환성 - player_one/player_two 또는 left_player/right_player 모두 지원
        const player1Id = match.player_one?.user?.id || match.player_one?.id || match.left_player?.id;
        const player2Id = match.player_two?.user?.id || match.player_two?.id || match.right_player?.id;
        return player1Id === currentUserId || player2Id === currentUserId;
      }) || null
    );
  }

  private static renderActiveTournament(matchData: MatchData): string {
    console.log(matchData);
    return `
            <div class="tournament-bracket">
                <div class="tournament-header">
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
                
                ${this.renderTournamentBracket(matchData.games || matchData.matches || [], matchData.total_rounds || 0)}
            </div>
        `;
  }

  static renderTournamentBracket(matches: GameMatch[], totalRounds: number): string {
    const matchesByRound = this.groupMatchesByRound(matches);

    // 토너먼트 브라켓 구조 생성
    let bracketHTML = '<div class="tournament-bracket-container">';

    // 각 라운드별로 처리
    for (let round = 1; round <= totalRounds; round++) {
      const roundMatches = matchesByRound[round] || [];
      const nextRoundMatches = matchesByRound[round + 1] || [];
      const roundName = this.getRoundName(round, totalRounds);

      bracketHTML += `
        <div class="bracket-round-wrapper" data-round="${round}">
          <div class="bracket-round-column">
            <div class="round-label">${roundName}</div>
            <div class="round-matches-container">
              ${roundMatches.map((match, index) => this.renderTournamentMatch(match, round, index)).join("")}
            </div>
          </div>
      `;

      bracketHTML += "</div>";
    }

    bracketHTML += "</div>";
    return bracketHTML;
  }

  private static groupMatchesByRound(matches: GameMatch[]): { [round: number]: GameMatch[] } {
    const matchesByRound: { [round: number]: GameMatch[] } = {};
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
    return `${round}라운드`;
  }

  private static renderTournamentMatch(match: GameMatch, round: number, index: number): string {
    const isCompleted = match.game_status === "COMPLETED";
    const isInProgress = match.game_status === "IN_PROGRESS";
    const isPending = match.game_status === "PENDING";

    // 백엔드 DTO 호환성 - left_player/right_player 또는 player_one/player_two 지원
    const leftPlayer =
      match.left_player ||
      (match.player_one?.user
        ? {
            id: match.player_one.user.id,
            nickname: match.player_one.user.nickname,
            username: match.player_one.user.username,
            profile_image: match.player_one.user.profile_image,
            score: match.player_one.user.score,
          }
        : undefined);

    const rightPlayer =
      match.right_player ||
      (match.player_two?.user
        ? {
            id: match.player_two.user.id,
            nickname: match.player_two.user.nickname,
            username: match.player_two.user.username,
            profile_image: match.player_two.user.profile_image,
            score: match.player_two.user.score,
          }
        : undefined);

    return `
      <div class="tournament-match" data-game-id="${match.game_id}" data-round="${round}" data-index="${index}">
        <div class="match-bracket">
          <div class="match-player top-player ${isCompleted && match.winner?.position === "left" ? "winner" : ""}">
            <div class="player-info">
              ${
                leftPlayer?.profile_image
                  ? `<img src="${leftPlayer.profile_image}" alt="프로필" class="player-avatar-small">`
                  : `<div class="player-avatar-placeholder-small">👤</div>`
              }
              <span class="player-name">${leftPlayer?.nickname || "대기 중"}</span>
            </div>
            <div class="player-score">
              ${isCompleted ? leftPlayer?.score || 0 : isPending ? "" : leftPlayer?.score || 0}
            </div>
          </div>
          
          <div class="match-connector">
            <div class="connector-line"></div>
            ${
              isInProgress
                ? '<div class="match-status-indicator playing">▶</div>'
                : isCompleted
                  ? '<div class="match-status-indicator completed">✓</div>'
                  : '<div class="match-status-indicator pending">○</div>'
            }
          </div>
          
          <div class="match-player bottom-player ${isCompleted && match.winner?.position === "right" ? "winner" : ""}">
            <div class="player-info">
              ${
                rightPlayer?.profile_image
                  ? `<img src="${rightPlayer.profile_image}" alt="프로필" class="player-avatar-small">`
                  : `<div class="player-avatar-placeholder-small">👤</div>`
              }
              <span class="player-name">${rightPlayer?.nickname || "대기 중"}</span>
            </div>
            <div class="player-score">
              ${isCompleted ? rightPlayer?.score || 0 : isPending ? "" : rightPlayer?.score || 0}
            </div>
          </div>
        </div>
        
        <div class="match-info-tooltip">
          <div class="match-id">Game ${match.game_id}</div>
          <div class="match-status">${this.getGameStatusText(match.game_status)}</div>
        </div>
      </div>
    `;
  }

  private static renderRoundConnectors(
    currentRoundMatches: MatchInfo[],
    nextRoundMatches: MatchInfo[],
    round: number
  ): string {
    let connectorsHTML =
      '<div class="round-connectors" data-from-round="' + round + '" data-to-round="' + (round + 1) + '">';

    // 현재 라운드의 매치 수에 따라 연결선 생성
    for (let i = 0; i < nextRoundMatches.length; i++) {
      const match1Index = i * 2;
      const match2Index = i * 2 + 1;

      // 두 매치가 존재하는 경우에만 연결선 생성
      if (match1Index < currentRoundMatches.length && match2Index < currentRoundMatches.length) {
        connectorsHTML += `
          <div class="connector-group" data-next-match="${i}">
            <div class="connector-line-horizontal from-match-${match1Index}"></div>
            <div class="connector-line-horizontal from-match-${match2Index}"></div>
            <div class="connector-line-vertical"></div>
            <div class="connector-line-horizontal to-next-round"></div>
          </div>
        `;
      } else if (match1Index < currentRoundMatches.length) {
        // 홀수 개의 매치가 있는 경우 (부전승)
        connectorsHTML += `
          <div class="connector-group bye-connector" data-next-match="${i}">
            <div class="connector-line-horizontal from-match-${match1Index} bye-line"></div>
            <div class="connector-line-horizontal to-next-round"></div>
          </div>
        `;
      }
    }

    connectorsHTML += "</div>";
    return connectorsHTML;
  }

  static renderBracketMatch(match: GameMatch): string {
    const isCompleted = match.game_status === "COMPLETED";
    const isPending = match.game_status === "PENDING";
    const isInProgress = match.game_status === "IN_PROGRESS";

    // 백엔드 DTO 호환성 - left_player/right_player 또는 player_one/player_two 지원
    const leftPlayer =
      match.left_player ||
      (match.player_one?.user
        ? {
            id: match.player_one.user.id,
            nickname: match.player_one.user.nickname,
            username: match.player_one.user.username,
            profile_image: match.player_one.user.profile_image,
            score: match.player_one.user.score,
          }
        : undefined);

    const rightPlayer =
      match.right_player ||
      (match.player_two?.user
        ? {
            id: match.player_two.user.id,
            nickname: match.player_two.user.nickname,
            username: match.player_two.user.username,
            profile_image: match.player_two.user.profile_image,
            score: match.player_two.user.score,
          }
        : undefined);

    return `
            <div class="bracket-match ${match.game_status.toLowerCase()}" data-game-id="${match.game_id}">
                <div class="match-header">
                    <span class="match-id">Game ${match.game_id}</span>
                    <span class="match-status ${match.game_status.toLowerCase()}">${this.getGameStatusText(match.game_status)}</span>
                </div>
                
                <div class="match-players">
                    ${this.renderPlayerSlot(leftPlayer, match.winner, match.loser, "left", isCompleted, isPending)}
                    
                    <div class="vs-divider">
                        <span class="vs-text">VS</span>
                    </div>
                    
                    ${this.renderPlayerSlot(rightPlayer, match.winner, match.loser, "right", isCompleted, isPending)}
                </div>
                
                ${isCompleted && match.winner ? this.renderMatchResult(match) : ""}
                ${isInProgress ? this.renderMatchProgress() : ""}
            </div>
        `;
  }

  private static renderPlayerSlot(
    player: any, // Changed to any for backend DTO compatibility
    winner: any | undefined,
    loser: any | undefined,
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
                      player?.profile_image
                        ? `<img src="${player.profile_image}" alt="프로필" class="player-avatar">`
                        : `<div class="player-avatar-placeholder">👤</div>`
                    }
                    <div class="player-details">
                        <span class="player-name">${player?.nickname || "Unknown"}</span>
                        <span class="player-username">@${player?.username || "unknown"}</span>
                    </div>
                </div>
                <div class="player-score">
                    ${isCompleted ? player?.score || 0 : isPending ? "-" : player?.score || 0}
                </div>
            </div>
        `;
  }

  private static renderMatchResult(match: GameMatch): string {
    return `
            <div class="match-result">
                <div class="winner-info">
                    <span class="winner-label">승자:</span>
                    <span class="winner-name">${match.winner?.nickname || "Unknown"}</span>
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
    // 백엔드 호환성 - games 배열 또는 matches 배열 모두 지원
    const matches = matchData.games || matchData.matches || [];
    const currentRoundMatches = matches.filter((match: GameMatch) => match.round === matchData.current_round) || [];

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

  private static renderCurrentMatches(currentRoundMatches: GameMatch[]): string {
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

  private static renderMatchSummaryCard(match: GameMatch): string {
    // 백엔드 DTO 호환성 - left_player/right_player 또는 player_one/player_two 지원
    const leftPlayer =
      match.left_player ||
      (match.player_one?.user
        ? {
            id: match.player_one.user.id,
            nickname: match.player_one.user.nickname,
            username: match.player_one.user.username,
            profile_image: match.player_one.user.profile_image,
            score: match.player_one.user.score,
          }
        : undefined);

    const rightPlayer =
      match.right_player ||
      (match.player_two?.user
        ? {
            id: match.player_two.user.id,
            nickname: match.player_two.user.nickname,
            username: match.player_two.user.username,
            profile_image: match.player_two.user.profile_image,
            score: match.player_two.user.score,
          }
        : undefined);

    return `
            <div class="match-summary-card">
                <div class="match-info-header">
                    <span class="match-status ${match.game_status.toLowerCase()}">${this.getGameStatusText(match.game_status)}</span>
                </div>
                <div class="match-players-summary">
                    ${this.renderPlayerSummary(leftPlayer, match.game_status)}
                    <span class="vs-text">vs</span>
                    ${this.renderPlayerSummary(rightPlayer, match.game_status)}
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

  private static renderPlayerSummary(player: any, gameStatus: string): string {
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
