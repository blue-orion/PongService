import { LobbyData } from "./LobbyDetailService";
import { AuthManager } from "../../../utils/auth";

export interface UIEventHandlers {
    onBackToList: () => void;
    onToggleReady: () => void;
    onStartGame: () => void;
    onSpectateGame: () => void;
    onRefresh: () => void;
    onLeaveLobby: () => void;
    onTransferLeadership: (targetUserId: number, targetUsername: string) => void;
    onCreateMatch: () => void;
    onViewMatchInfo: () => void;
    onDebugSocket: () => void;
    onPlayGame: () => void;
}

export class LobbyDetailUI {
    private container: HTMLElement;
    private handlers: UIEventHandlers | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    setEventHandlers(handlers: UIEventHandlers): void {
        this.handlers = handlers;
    }

    showLoadingState(): void {
        this.container.innerHTML = `
            <div class="lobby-detail-page">
                <div class="loading-state">
                    <p>로비 정보를 불러오는 중...</p>
                </div>
            </div>
        `;
    }

    showErrorState(message: string): void {
        this.container.innerHTML = `
            <div class="lobby-detail-page">
                <div class="error-state">
                    <p>${message}</p>
                    <button class="back-btn">← 로비 목록으로</button>
                    <button class="retry-btn">다시 시도</button>
                </div>
            </div>
        `;

        // 에러 상태에서의 이벤트 리스너
        const backBtn = this.container.querySelector('.back-btn');
        if (backBtn && this.handlers) {
            backBtn.addEventListener('click', this.handlers.onBackToList);
        }

        const retryBtn = this.container.querySelector('.retry-btn');
        if (retryBtn && this.handlers) {
            retryBtn.addEventListener('click', this.handlers.onRefresh);
        }
    }

    renderLobbyDetail(lobbyData: LobbyData, isConnected: boolean = false, transport: string = 'unknown'): void {
        const currentUserId = AuthManager.getCurrentUserId();
        const currentPlayer = lobbyData.players.find((p: any) => p.user_id === currentUserId);

        this.container.innerHTML = `
            <div class="lobby-detail-page">
                <div class="lobby-header">
                    <button class="back-btn">← 로비 목록으로</button>
                    <h2>${lobbyData.name}</h2>
                    <div class="lobby-status ${lobbyData.status}">${lobbyData.statusText}</div>
                </div>

                <div class="lobby-content">
                    <div class="lobby-info-section">
                        <h3>로비 정보</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>호스트:</label>
                                <span>${lobbyData.host}</span>
                            </div>
                            <div class="info-item">
                                <label>현재 인원:</label>
                                <span>${lobbyData.currentPlayers}/${lobbyData.maxPlayers}</span>
                            </div>
                            <div class="info-item">
                                <label>생성 시간:</label>
                                <span>${lobbyData.createdAt}</span>
                            </div>
                            ${lobbyData.tournament ? `
                                <div class="info-item">
                                    <label>토너먼트:</label>
                                    <span>${lobbyData.tournament.name || '토너먼트 게임'}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="players-section">
                        <h3>참가자 목록</h3>
                        <div class="connection-status">
                            <span class="status-indicator ${isConnected ? 'connected' : 'disconnected'}">
                                ${isConnected ? `🟢 실시간 연결됨 (${transport})` : '🔴 연결 끊김'}
                            </span>
                            <button class="debug-socket-btn" style="margin-left: 10px; padding: 4px 8px; font-size: 12px; background: #6366f1; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                🔍 소켓 상태 확인
                            </button>
                        </div>
                        <div class="players-list">
                            ${this.renderPlayersList(lobbyData, currentUserId)}
                        </div>
                    </div>

                    <!-- 매칭 정보 섹션 -->
                    <div class="match-info-section" id="match-info-section" style="display: none;">
                        <h3>매칭 정보</h3>
                        <div class="match-info-content" id="match-info-content">
                            <!-- 매칭 정보가 여기에 렌더링됩니다 -->
                        </div>
                    </div>
                </div>

                <div class="lobby-actions">
                    ${this.renderActionButtons(lobbyData, currentPlayer)}
                </div>
            </div>
        `;

        this.setupEventListeners();
        
        // 매칭 정보가 있으면 렌더링
        this.renderMatchInfoInLobby(lobbyData);
    }

    private renderPlayersList(lobbyData: LobbyData, currentUserId: number | null): string {
        return lobbyData.players.map((player: any) => `
            <div class="player-item ${player.is_ready ? 'ready' : 'not-ready'}">
                <div class="player-avatar">
                    ${player.user?.profile_image ? 
                        `<img src="${player.user.profile_image}" alt="프로필" class="avatar-img">` : 
                        `<div class="avatar-placeholder">👤</div>`
                    }
                </div>
                <div class="player-info">
                    <span class="player-name">${player.user?.nickname || player.user?.username || 'Unknown'}</span>
                    <span class="player-status">${player.is_ready ? '준비 완료' : '준비 중'}</span>
                </div>
                <div class="player-badges">
                    ${player.user_id === lobbyData.creatorId ? '<span class="host-badge">호스트</span>' : ''}
                    ${player.is_leader ? '<span class="leader-badge">리더</span>' : ''}
                </div>
                ${lobbyData.isHost && player.user_id !== currentUserId && !player.is_leader ? `
                    <button class="transfer-leadership-btn" data-user-id="${player.user_id}" data-username="${player.user?.nickname || player.user?.username}">
                        방장 위임
                    </button>
                ` : ''}
            </div>
        `).join('');
    }

    private renderActionButtons(lobbyData: LobbyData, currentPlayer: any): string {
        const hasMatchData = !!lobbyData.matchData;
        const currentUserId = AuthManager.getCurrentUserId();
        
        // 현재 사용자가 현재 라운드에서 경기를 해야 하는지 확인
        const isCurrentPlayerPlaying = this.isPlayerPlayingInCurrentRound(lobbyData.matchData, currentUserId);
        
        if (lobbyData.status === 'waiting') {
            if (currentPlayer) {
                return `
                    <button class="ready-btn ${lobbyData.isPlayerReady ? 'cancel' : 'confirm'}" id="ready-btn">
                        ${lobbyData.isPlayerReady ? '준비 취소' : '준비 완료'}
                    </button>
                    ${lobbyData.isHost ? `
                        <button class="create-match-btn" id="create-match-btn" ${!lobbyData.allPlayersReady ? 'disabled' : ''}>
                            매칭 생성
                        </button>
                        <button class="start-game-btn" id="start-game-btn" ${!lobbyData.allPlayersReady ? 'disabled' : ''}>
                            게임 시작
                        </button>
                    ` : ''}
                    ${hasMatchData ? `
                        <button class="view-match-btn" id="view-match-btn">
                            매칭 정보 확인
                        </button>
                    ` : ''}
                    <button class="refresh-btn" id="refresh-btn">새로고침</button>
                    <button class="leave-lobby-btn">로비 나가기</button>
                `;
            } else {
                return `
                    <p class="not-in-lobby">이 로비에 참여하지 않았습니다.</p>
                    <button class="back-to-list-btn">← 로비 목록으로</button>
                    ${hasMatchData ? `
                        <button class="view-match-btn" id="view-match-btn">
                            매칭 정보 확인
                        </button>
                    ` : ''}
                `;
            }
        } else if (lobbyData.status === 'playing') {
            if (currentPlayer) {
                // 로비에 참여한 유저인 경우
                return `
                    ${!isCurrentPlayerPlaying ? `
                        <button class="spectate-btn">관전하기</button>
                    ` : `
                        <button class="play-game-btn">게임 참여</button>
                    `}
                    <button class="leave-lobby-btn">로비 나가기</button>
                    ${hasMatchData ? `
                        <button class="view-match-btn" id="view-match-btn">
                            매칭 정보 확인
                        </button>
                    ` : ''}
                `;
            } else {
                // 로비에 참여하지 않은 유저인 경우
                return `
                    <button class="spectate-btn">관전하기</button>
                    ${hasMatchData ? `
                        <button class="view-match-btn" id="view-match-btn">
                            매칭 정보 확인
                        </button>
                    ` : ''}
                `;
            }
        }
        return '';
    }

    updatePlayersUI(lobbyData: LobbyData): void {
        console.log('🎨 플레이어 UI 업데이트 시작...');
        
        const playersList = this.container.querySelector('.players-list');
        if (!playersList) {
            console.warn('❌ .players-list 요소를 찾을 수 없습니다.');
            return;
        }

        const currentUserId = AuthManager.getCurrentUserId();
        const newHTML = this.renderPlayersList(lobbyData, currentUserId);

        const oldHTML = playersList.innerHTML;
        if (oldHTML === newHTML) {
            console.log('📊 플레이어 목록 HTML이 동일하여 업데이트 건너뜀');
        } else {
            console.log('🔄 플레이어 목록 HTML 업데이트 적용');
            playersList.innerHTML = newHTML;
            this.setupTransferLeadershipButtons();
        }

        console.log('✅ 플레이어 목록 UI 업데이트 완료');
    }

    updateActionButtonsUI(lobbyData: LobbyData): void {
        console.log('🎨 액션 버튼 UI 업데이트 시작...');
        
        const currentUserId = AuthManager.getCurrentUserId();
        const currentPlayer = lobbyData.players.find((p: any) => p.user_id === currentUserId);
        
        if (!currentPlayer) {
            console.log('⚠️ 현재 사용자가 로비에 참여하지 않아 액션 버튼 업데이트 건너뜀');
            return;
        }

        // 준비 버튼 개별 업데이트
        const readyBtn = this.container.querySelector('#ready-btn') as HTMLButtonElement;
        if (readyBtn) {
            const oldClassName = readyBtn.className;
            const oldText = readyBtn.textContent;
            
            readyBtn.className = `ready-btn ${lobbyData.isPlayerReady ? 'cancel' : 'confirm'}`;
            readyBtn.textContent = lobbyData.isPlayerReady ? '준비 취소' : '준비 완료';
            
            console.log('🔄 준비 버튼 개별 업데이트:', {
                className: `${oldClassName} → ${readyBtn.className}`,
                text: `${oldText} → ${readyBtn.textContent}`
            });
        }

        // 게임 시작 버튼 상태 업데이트
        const startGameBtn = this.container.querySelector('#start-game-btn') as HTMLButtonElement;
        if (startGameBtn) {
            startGameBtn.disabled = !lobbyData.allPlayersReady;
        }

        // 매칭 생성 버튼 상태 업데이트
        const createMatchBtn = this.container.querySelector('#create-match-btn') as HTMLButtonElement;
        if (createMatchBtn) {
            createMatchBtn.disabled = !lobbyData.allPlayersReady;
        }

        console.log('✅ 액션 버튼 UI 업데이트 완료');
    }

    updateHostInfoUI(newHostName: string): void {
        const hostInfoElement = this.container.querySelector('.info-item:first-child span') as HTMLElement;
        if (hostInfoElement) {
            const oldHost = hostInfoElement.textContent;
            hostInfoElement.textContent = newHostName;
            
            // 시각적 효과로 변경을 강조
            hostInfoElement.style.background = '#fbbf24';
            hostInfoElement.style.padding = '2px 6px';
            hostInfoElement.style.borderRadius = '4px';
            hostInfoElement.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                hostInfoElement.style.background = '';
                hostInfoElement.style.padding = '';
                hostInfoElement.style.borderRadius = '';
            }, 2000);
            
            console.log(`🎯 호스트 정보 UI 업데이트: ${oldHost} → ${newHostName}`);
        }
    }

    updateConnectionStatus(isConnected: boolean, transport: string = 'unknown'): void {
        const statusIndicator = this.container.querySelector('.status-indicator');
        if (!statusIndicator) return;

        statusIndicator.className = `status-indicator ${isConnected ? 'connected' : 'disconnected'}`;
        
        if (isConnected) {
            statusIndicator.textContent = `🟢 실시간 연결됨 (${transport})`;
        } else {
            statusIndicator.textContent = '🔴 연결 끊김 - 재연결 중...';
        }
        
        console.log('🔌 연결 상태 UI 업데이트:', { connected: isConnected, transport });
    }

    private setupEventListeners(): void {
        if (!this.handlers) return;

        // 뒤로가기 버튼
        const backBtn = this.container.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', this.handlers.onBackToList);
        }

        // 준비 버튼
        const readyBtn = this.container.querySelector('#ready-btn');
        if (readyBtn) {
            readyBtn.addEventListener('click', this.handlers.onToggleReady);
        }

        // 게임 시작 버튼
        const startGameBtn = this.container.querySelector('#start-game-btn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', this.handlers.onStartGame);
        }

        // 매칭 생성 버튼
        const createMatchBtn = this.container.querySelector('#create-match-btn');
        if (createMatchBtn) {
            createMatchBtn.addEventListener('click', this.handlers.onCreateMatch);
        }

        // 매칭 정보 확인 버튼
        const viewMatchBtn = this.container.querySelector('#view-match-btn');
        if (viewMatchBtn) {
            viewMatchBtn.addEventListener('click', this.handlers.onViewMatchInfo);
        }

        // 관전 버튼
        const spectateBtn = this.container.querySelector('.spectate-btn');
        if (spectateBtn) {
            spectateBtn.addEventListener('click', this.handlers.onSpectateGame);
        }

        // 게임 참여 버튼
        const playGameBtn = this.container.querySelector('.play-game-btn');
        if (playGameBtn) {
            playGameBtn.addEventListener('click', this.handlers.onPlayGame);
        }

        // 새로고침 버튼
        const refreshBtn = this.container.querySelector('#refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.handlers.onRefresh);
        }

        // 로비 목록으로 돌아가기 버튼
        const backToListBtn = this.container.querySelector('.back-to-list-btn');
        if (backToListBtn) {
            backToListBtn.addEventListener('click', this.handlers.onBackToList);
        }

        // 로비 나가기 버튼
        const leaveLobbyBtn = this.container.querySelector('.leave-lobby-btn');
        if (leaveLobbyBtn) {
            leaveLobbyBtn.addEventListener('click', this.handlers.onLeaveLobby);
        }

        // 소켓 디버깅 버튼
        const debugSocketBtn = this.container.querySelector('.debug-socket-btn');
        if (debugSocketBtn) {
            debugSocketBtn.addEventListener('click', this.handlers.onDebugSocket);
        }

        // 방장 위임 버튼들
        this.setupTransferLeadershipButtons();
    }

    private setupTransferLeadershipButtons(): void {
        if (!this.handlers) return;

        const transferButtons = this.container.querySelectorAll('.transfer-leadership-btn');
        transferButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetUserId = (e.target as HTMLElement).getAttribute('data-user-id');
                const targetUsername = (e.target as HTMLElement).getAttribute('data-username');
                if (targetUserId && this.handlers) {
                    this.handlers.onTransferLeadership(parseInt(targetUserId), targetUsername || '');
                }
            });
        });
    }

    clearContainer(): void {
        this.container.innerHTML = '';
    }

    showMatchResult(matchData: any): void {
        console.log('🎮 매칭 결과 표시:', matchData);
        
        // 매칭 결과 모달 생성
        const modalHTML = `
            <div class="match-result-modal">
                <div class="match-result-content">
                    <div class="match-result-header">
                        <h2>🎉 매칭이 생성되었습니다!</h2>
                        <button class="close-modal-btn">×</button>
                    </div>
                    
                    <div class="match-result-body">
                        ${this.renderMatchDetails(matchData)}
                    </div>
                    
                    <div class="match-result-footer">
                        <button class="start-match-btn confirm">게임 시작</button>
                    </div>
                </div>
            </div>
        `;
        
        // 모달을 body에 추가
        const modalElement = document.createElement('div');
        modalElement.innerHTML = modalHTML;
        modalElement.className = 'modal-overlay';
        document.body.appendChild(modalElement);
        
        // 모달 이벤트 리스너 설정
        this.setupMatchResultModalListeners(modalElement, matchData);
    }

    private renderMatchDetails(matchData: any): string {
        if (matchData.tournament_status === 'COMPLETED' && matchData.winner) {
            // 토너먼트 완료 시
            return `
                <div class="tournament-completed">
                    <div class="completion-icon">🏆</div>
                    <h3>토너먼트 완료!</h3>
                    <div class="winner-info">
                        <h4>우승자</h4>
                        <div class="winner-card">
                            ${matchData.winner.profile_image ? 
                                `<img src="${matchData.winner.profile_image}" alt="프로필" class="winner-avatar">` : 
                                `<div class="winner-avatar-placeholder">🏆</div>`
                            }
                            <span class="winner-name">${matchData.winner.nickname || matchData.winner.username || '알 수 없음'}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 토너먼트 진행 중 - 브라켓 형태로 표시
        return `
            <div class="tournament-bracket">
                <div class="tournament-header">
                    <h3>토너먼트 브라켓</h3>
                    <div class="tournament-info-grid">
                        <div class="info-item">
                            <label>토너먼트 ID:</label>
                            <span>${matchData.tournament_id || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>로비 ID:</label>
                            <span>${matchData.lobby_id || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>현재 라운드:</label>
                            <span>${matchData.current_round || 0} / ${matchData.total_rounds || 0}</span>
                        </div>
                        <div class="info-item">
                            <label>상태:</label>
                            <span class="tournament-status ${(matchData.tournament_status || '').toLowerCase()}">${this.getStatusText(matchData.tournament_status)}</span>
                        </div>
                    </div>
                </div>
                
                ${this.renderTournamentBracket(matchData.matches || [], matchData.total_rounds || 0)}
            </div>
        `;
    }

    private getStatusText(status: string | undefined): string {
        if (!status) return '알 수 없음';
        
        switch (status) {
            case 'IN_PROGRESS': return '진행 중';
            case 'COMPLETED': return '완료';
            case 'PENDING': return '대기 중';
            default: return status;
        }
    }

    private renderTournamentBracket(matches: any[], totalRounds: number): string {
        // 라운드별로 매치를 그룹화
        const matchesByRound: { [round: number]: any[] } = {};
        matches.forEach(match => {
            if (!matchesByRound[match.round]) {
                matchesByRound[match.round] = [];
            }
            matchesByRound[match.round].push(match);
        });

        let bracketHTML = '<div class="bracket-container">';
        
        // 각 라운드를 렌더링
        for (let round = 1; round <= totalRounds; round++) {
            const roundMatches = matchesByRound[round] || [];
            bracketHTML += `
                <div class="bracket-round" data-round="${round}">
                    <div class="round-header">
                        <h4>${this.getRoundName(round, totalRounds)}</h4>
                        <span class="round-number">라운드 ${round}</span>
                    </div>
                    <div class="round-matches">
                        ${roundMatches.map(match => this.renderBracketMatch(match)).join('')}
                    </div>
                </div>
            `;
            
            // 라운드 사이에 연결선 추가 (마지막 라운드 제외)
            if (round < totalRounds) {
                bracketHTML += '<div class="bracket-connector"></div>';
            }
        }
        
        bracketHTML += '</div>';
        return bracketHTML;
    }

    private getRoundName(round: number, totalRounds: number): string {
        if (round === totalRounds) return '결승';
        if (round === totalRounds - 1) return '준결승';
        if (round === totalRounds - 2) return '8강';
        if (round === totalRounds - 3) return '16강';
        return `라운드 ${round}`;
    }

    private renderBracketMatch(match: any): string {
        const isCompleted = match.game_status === 'COMPLETED';
        const isPending = match.game_status === 'PENDING';
        const isInProgress = match.game_status === 'IN_PROGRESS';
        
        return `
            <div class="bracket-match ${match.game_status.toLowerCase()}" data-game-id="${match.game_id}">
                <div class="match-header">
                    <span class="match-id">Game ${match.game_id}</span>
                    <span class="match-status ${match.game_status.toLowerCase()}">${this.getGameStatusText(match.game_status)}</span>
                </div>
                
                <div class="match-players">
                    <div class="player-slot ${match.winner?.position === 'left' ? 'winner' : match.loser?.position === 'left' ? 'loser' : ''}">
                        <div class="player-info">
                            ${match.left_player.profile_image ? 
                                `<img src="${match.left_player.profile_image}" alt="프로필" class="player-avatar">` : 
                                `<div class="player-avatar-placeholder">👤</div>`
                            }
                            <div class="player-details">
                                <span class="player-name">${match.left_player?.nickname || 'Unknown'}</span>
                                <span class="player-username">@${match.left_player?.username || 'unknown'}</span>
                            </div>
                        </div>
                        <div class="player-score">
                            ${isCompleted ? match.left_player.score : isPending ? '-' : match.left_player.score || 0}
                        </div>
                    </div>
                    
                    <div class="vs-divider">
                        <span class="vs-text">VS</span>
                    </div>
                    
                    <div class="player-slot ${match.winner?.position === 'right' ? 'winner' : match.loser?.position === 'right' ? 'loser' : ''}">
                        <div class="player-info">
                            ${match.right_player.profile_image ? 
                                `<img src="${match.right_player.profile_image}" alt="프로필" class="player-avatar">` : 
                                `<div class="player-avatar-placeholder">👤</div>`
                            }
                            <div class="player-details">
                                <span class="player-name">${match.right_player?.nickname || 'Unknown'}</span>
                                <span class="player-username">@${match.right_player?.username || 'unknown'}</span>
                            </div>
                        </div>
                        <div class="player-score">
                            ${isCompleted ? match.right_player.score : isPending ? '-' : match.right_player.score || 0}
                        </div>
                    </div>
                </div>
                
                ${isCompleted && match.winner ? `
                    <div class="match-result">
                        <div class="winner-info">
                            <span class="winner-label">승자:</span>
                            <span class="winner-name">${match.winner.nickname}</span>
                        </div>
                        ${match.play_time ? `
                            <div class="play-time">
                                <span class="time-label">경기 시간:</span>
                                <span class="time-value">${match.play_time}</span>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                ${isInProgress ? `
                    <div class="match-progress">
                        <div class="progress-indicator">
                            <span class="progress-text">경기 중...</span>
                            <div class="loading-dots">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    private getGameStatusText(status: string): string {
        switch (status) {
            case 'PENDING': return '대기';
            case 'IN_PROGRESS': return '진행중';
            case 'COMPLETED': return '완료';
            default: return status || '알 수 없음';
        }
    }

    private isPlayerPlayingInCurrentRound(matchData: any, userId: number | null): boolean {
        if (!matchData || !userId || !matchData.matches || !matchData.current_round) {
            return false;
        }

        // 현재 라운드의 매치들을 찾기
        const currentRoundMatches = matchData.matches.filter((match: any) => match.round === matchData.current_round);
        
        // 현재 사용자가 현재 라운드에서 경기를 하는지 확인
        return currentRoundMatches.some((match: any) => {
            const leftPlayerId = match.left_player?.id;
            const rightPlayerId = match.right_player?.id;
            
            // 매치가 아직 완료되지 않았고, 현재 사용자가 이 매치의 플레이어인지 확인
            return (match.game_status === 'PENDING' || match.game_status === 'IN_PROGRESS') && 
                   (leftPlayerId === userId || rightPlayerId === userId);
        });
    }

    private setupMatchResultModalListeners(modalElement: HTMLElement, matchData: any): void {
        // 모달 닫기 버튼들
        const closeButtons = modalElement.querySelectorAll('.close-modal-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modalElement);
            });
        });
        
        // 게임 시작 버튼
        const startMatchBtn = modalElement.querySelector('.start-match-btn');
        if (startMatchBtn && this.handlers) {
            startMatchBtn.addEventListener('click', () => {
                document.body.removeChild(modalElement);
                this.handlers!.onStartGame();
            });
        }
        
        // 모달 외부 클릭 시 닫기
        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) {
                document.body.removeChild(modalElement);
            }
        });
    }

    renderMatchInfoInLobby(lobbyData: LobbyData): void {
        if (!lobbyData.matchData) return;

        const matchInfoSection = this.container.querySelector('#match-info-section') as HTMLElement;
        const matchInfoContent = this.container.querySelector('#match-info-content') as HTMLElement;
        
        if (!matchInfoSection || !matchInfoContent) return;

        // 매칭 정보가 있으면 섹션 표시
        matchInfoSection.style.display = 'block';
        
        // 매칭 정보 렌더링
        matchInfoContent.innerHTML = this.renderMatchInfoContent(lobbyData.matchData);
    }

    private renderMatchInfoContent(matchData: any): string {
        if (matchData.tournament_status === 'COMPLETED' && matchData.winner) {
            // 토너먼트 완료 시
            return `
                <div class="tournament-completed-inline">
                    <div class="completion-header">
                        <span class="completion-icon">🏆</span>
                        <h4>토너먼트 완료!</h4>
                    </div>
                    <div class="winner-info-inline">
                        ${matchData.winner.profile_image ? 
                            `<img src="${matchData.winner.profile_image}" alt="프로필" class="winner-avatar-small">` : 
                            `<div class="winner-avatar-placeholder-small">🏆</div>`
                        }
                        <div class="winner-details">
                            <span class="winner-label">우승자:</span>
                            <span class="winner-name">${matchData.winner.nickname || matchData.winner.username || '알 수 없음'}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 토너먼트 진행 중
        return `
            <div class="tournament-info-inline">
                <div class="tournament-header-info">
                    <div class="tournament-stats">
                        <span class="stat-item">토너먼트 ID: <strong>${matchData.tournament_id || 'N/A'}</strong></span>
                        <span class="stat-item">현재 라운드: <strong>${matchData.current_round || 0}/${matchData.total_rounds || 0}</strong></span>
                        <span class="stat-item">상태: <strong class="status ${(matchData.tournament_status || '').toLowerCase()}">${this.getStatusText(matchData.tournament_status)}</strong></span>
                    </div>
                </div>
                
                <div class="current-matches">
                    <h5>현재 라운드 매치</h5>
                    ${matchData.matches?.filter((match: any) => match.round === matchData.current_round).slice(0, 2).map((match: any) => `
                        <div class="match-summary-card">
                            <div class="match-info-header">
                                <span class="match-number">Game ${match.game_id}</span>
                                <span class="match-status ${match.game_status.toLowerCase()}">${this.getGameStatusText(match.game_status)}</span>
                            </div>
                            <div class="match-players-summary">
                                <div class="player-summary">
                                    ${match.left_player?.profile_image ? 
                                        `<img src="${match.left_player.profile_image}" alt="프로필" class="player-avatar-tiny">` : 
                                        `<div class="player-avatar-placeholder-tiny">👤</div>`
                                    }
                                    <span class="player-name">${match.left_player?.nickname || 'Unknown'}</span>
                                    ${match.game_status === 'COMPLETED' ? `<span class="score">${match.left_player?.score || 0}</span>` : ''}
                                </div>
                                <span class="vs-text">vs</span>
                                <div class="player-summary">
                                    ${match.right_player?.profile_image ? 
                                        `<img src="${match.right_player.profile_image}" alt="프로필" class="player-avatar-tiny">` : 
                                        `<div class="player-avatar-placeholder-tiny">👤</div>`
                                    }
                                    <span class="player-name">${match.right_player?.nickname || 'Unknown'}</span>
                                    ${match.game_status === 'COMPLETED' ? `<span class="score">${match.right_player?.score || 0}</span>` : ''}
                                </div>
                            </div>
                            ${match.winner ? `
                                <div class="match-winner">
                                    ✅ ${match.winner?.nickname || 'Unknown'} 승리
                                    ${match.play_time ? `<span class="play-time-small">(${match.play_time})</span>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `).join('') || '<p class="no-matches">현재 라운드 매치가 없습니다.</p>'}
                    
                    ${matchData.matches?.filter((match: any) => match.round === matchData.current_round).length > 2 ? `
                        <div class="more-matches">
                            +${matchData.matches.filter((match: any) => match.round === matchData.current_round).length - 2}개 매치 더...
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
}
