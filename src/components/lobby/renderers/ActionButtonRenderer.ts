import { LobbyData, LobbyPlayer, MatchData } from "../../../types/lobby";
import { AuthManager } from "../../../utils/auth";

export class ActionButtonRenderer {
    
    static renderActionButtons(lobbyData: LobbyData, currentPlayer: LobbyPlayer | null): string {
        const hasMatchData = !!lobbyData.matchData;
        const currentUserId = AuthManager.getCurrentUserId();
        
        if (lobbyData.status === 'waiting') {
            return this.renderWaitingActions(lobbyData, currentPlayer, hasMatchData);
        } else if (lobbyData.status === 'playing') {
            return this.renderPlayingActions(lobbyData, currentPlayer, hasMatchData, currentUserId);
        }
        
        return '';
    }

    private static renderWaitingActions(lobbyData: LobbyData, currentPlayer: LobbyPlayer | null, hasMatchData: boolean): string {
        if (currentPlayer) {
            return this.renderParticipantWaitingActions(lobbyData, hasMatchData);
        } else {
            return this.renderNonParticipantWaitingActions(hasMatchData);
        }
    }

    private static renderParticipantWaitingActions(lobbyData: LobbyData, hasMatchData: boolean): string {
        return `
            ${this.renderReadyButton(lobbyData)}
            ${lobbyData.isHost ? this.renderHostButtons(lobbyData) : ''}
            ${hasMatchData ? this.renderViewMatchButton() : ''}
            ${this.renderCommonButtons()}
        `;
    }

    private static renderNonParticipantWaitingActions(hasMatchData: boolean): string {
        return `
            <p class="not-in-lobby">이 로비에 참여하지 않았습니다.</p>
            <button class="back-to-list-btn">← 로비 목록으로</button>
            ${hasMatchData ? this.renderViewMatchButton() : ''}
        `;
    }

    private static renderPlayingActions(lobbyData: LobbyData, currentPlayer: LobbyPlayer | null, hasMatchData: boolean, currentUserId: number | null): string {
        const isCurrentPlayerPlaying = this.isPlayerPlayingInCurrentRound(lobbyData.matchData, currentUserId);
        
        if (currentPlayer) {
            return this.renderParticipantPlayingActions(isCurrentPlayerPlaying, hasMatchData);
        } else {
            return this.renderNonParticipantPlayingActions(hasMatchData);
        }
    }

    private static renderParticipantPlayingActions(isCurrentPlayerPlaying: boolean, hasMatchData: boolean): string {
        return `
            ${!isCurrentPlayerPlaying ? this.renderSpectateButton() : this.renderPlayGameButton()}
            <button class="leave-lobby-btn">로비 나가기</button>
            ${hasMatchData ? this.renderViewMatchButton() : ''}
        `;
    }

    private static renderNonParticipantPlayingActions(hasMatchData: boolean): string {
        return `
            ${this.renderSpectateButton()}
            ${hasMatchData ? this.renderViewMatchButton() : ''}
        `;
    }

    private static renderReadyButton(lobbyData: LobbyData): string {
        const buttonClass = `ready-btn ${lobbyData.isPlayerReady ? 'cancel' : 'confirm'}`;
        const buttonText = lobbyData.isPlayerReady ? '준비 취소' : '준비 완료';
        
        return `<button class="${buttonClass}" id="ready-btn">${buttonText}</button>`;
    }

    private static renderHostButtons(lobbyData: LobbyData): string {
        const disabled = !lobbyData.allPlayersReady ? 'disabled' : '';
        
        return `
            <button class="create-match-btn" id="create-match-btn" ${disabled}>
                매칭 생성
            </button>
            <button class="start-game-btn" id="start-game-btn" ${disabled}>
                게임 시작
            </button>
        `;
    }

    private static renderViewMatchButton(): string {
        return `
            <button class="view-match-btn" id="view-match-btn">
                매칭 정보 확인
            </button>
        `;
    }

    private static renderSpectateButton(): string {
        return `<button class="spectate-btn">관전하기</button>`;
    }

    private static renderPlayGameButton(): string {
        return `<button class="play-game-btn">게임 참여</button>`;
    }

    private static renderCommonButtons(): string {
        return `
            <button class="refresh-btn" id="refresh-btn">새로고침</button>
            <button class="leave-lobby-btn">로비 나가기</button>
        `;
    }

    private static isPlayerPlayingInCurrentRound(matchData: MatchData | undefined, userId: number | null): boolean {
        if (!matchData || !userId || !matchData.matches || !matchData.current_round) {
            return false;
        }

        const currentRoundMatches = matchData.matches.filter(match => match.round === matchData.current_round);
        
        return currentRoundMatches.some(match => {
            const leftPlayerId = match.left_player?.id;
            const rightPlayerId = match.right_player?.id;
            
            return (match.game_status === 'PENDING' || match.game_status === 'IN_PROGRESS') && 
                   (leftPlayerId === userId || rightPlayerId === userId);
        });
    }

    // 개별 버튼 업데이트 메서드들
    static updateReadyButton(container: HTMLElement, lobbyData: LobbyData): void {
        const readyBtn = container.querySelector('#ready-btn') as HTMLButtonElement;
        if (!readyBtn) return;

        const buttonClass = `ready-btn ${lobbyData.isPlayerReady ? 'cancel' : 'confirm'}`;
        const buttonText = lobbyData.isPlayerReady ? '준비 취소' : '준비 완료';
        
        readyBtn.className = buttonClass;
        readyBtn.textContent = buttonText;
    }

    static updateHostButtons(container: HTMLElement, lobbyData: LobbyData): void {
        const startGameBtn = container.querySelector('#start-game-btn') as HTMLButtonElement;
        const createMatchBtn = container.querySelector('#create-match-btn') as HTMLButtonElement;
        
        if (startGameBtn) {
            startGameBtn.disabled = !lobbyData.allPlayersReady;
        }
        
        if (createMatchBtn) {
            createMatchBtn.disabled = !lobbyData.allPlayersReady;
        }
    }

    static addViewMatchButton(container: HTMLElement, onViewMatchInfo: () => void): void {
        const existingBtn = container.querySelector('#view-match-btn');
        if (existingBtn) return;

        const actionsContainer = container.querySelector('.lobby-actions');
        if (!actionsContainer) return;

        const viewMatchBtn = document.createElement('button');
        viewMatchBtn.id = 'view-match-btn';
        viewMatchBtn.className = 'view-match-btn';
        viewMatchBtn.textContent = '매칭 정보 확인';
        
        const refreshBtn = actionsContainer.querySelector('#refresh-btn');
        if (refreshBtn) {
            actionsContainer.insertBefore(viewMatchBtn, refreshBtn);
        } else {
            actionsContainer.appendChild(viewMatchBtn);
        }
        
        viewMatchBtn.addEventListener('click', onViewMatchInfo);
    }

    static removeViewMatchButton(container: HTMLElement): void {
        const existingBtn = container.querySelector('#view-match-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
    }
}
