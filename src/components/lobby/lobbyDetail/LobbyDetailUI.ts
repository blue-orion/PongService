import { LobbyData, UIEventHandlers } from "../../../types/lobby";
import { UserManager } from "../../../utils/user";
import { PlayerRenderer } from "../renderers/PlayerRenderer";
import { ActionButtonRenderer } from "../renderers/ActionButtonRenderer";
import { MatchRenderer } from "../renderers/MatchRenderer";
import { EventHandlerManager, ModalEventManager } from "../managers/EventHandlerManager";
import { UIStateManager } from "../managers/UIStateManager";

export class LobbyDetailUI {
  private container: HTMLElement;
  private eventManager: EventHandlerManager;
  private stateManager: UIStateManager;
  private handlers: UIEventHandlers | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.eventManager = new EventHandlerManager(container);
    this.stateManager = new UIStateManager(container);
  }

  setEventHandlers(handlers: UIEventHandlers): void {
    this.handlers = handlers;
    this.eventManager.setHandlers(handlers);
    this.stateManager.setEventHandlers(handlers);
  }

  showLoadingState(): void {
    this.stateManager.showLoadingState();
  }

  showErrorState(message: string): void {
    if (!this.handlers) return;
    this.stateManager.showErrorState(message, this.handlers.onBackToList, this.handlers.onRefresh);
  }

  renderLobbyDetail(lobbyData: LobbyData, isConnected: boolean = false, transport: string = "unknown"): void {
    const currentUserId = Number(UserManager.getUserId());
    const currentPlayer = PlayerRenderer.findPlayerById(lobbyData.players, currentUserId || 0);

    this.container.innerHTML = `
            <div class="lobby-detail-page">
                ${this.renderLobbyHeader(lobbyData)}
                ${this.renderLobbyContent(lobbyData, currentUserId)}
                ${this.renderLobbyActions(lobbyData, currentPlayer)}
            </div>
        `;

    this.eventManager.setupAllEventListeners();
    this.renderMatchInfoInLobby(lobbyData);
  }

  private renderLobbyHeader(lobbyData: LobbyData): string {
    return `
            <div class="lobby-header">
                <button class="back-btn">← 로비 목록으로</button>
                <h2>${lobbyData.name}</h2>
                <div class="lobby-status ${lobbyData.status}">${lobbyData.statusText}</div>
            </div>
        `;
  }

  private renderLobbyContent(lobbyData: LobbyData, currentUserId: number | null): string {
    return `
            <div class="lobby-content">
                <div class="lobby-info-section flex flex-col gap-4">
                    <h3>로비 정보</h3>
                    ${PlayerRenderer.renderLobbyInfoGrid(lobbyData)}
                </div>

                <div class="players-section">
                    <h3>참가자 목록</h3>
                    <div class="players-list">
                        ${PlayerRenderer.renderPlayersList(lobbyData, currentUserId)}
                    </div>
                </div>

                <div class="match-info-section" id="match-info-section" style="display: none;">
                    <h3>매칭 정보</h3>
                    <div class="match-info-content" id="match-info-content">
                        <!-- 매칭 정보가 여기에 렌더링됩니다 -->
                    </div>
                </div>
            </div>
        `;
  }

  private renderLobbyActions(lobbyData: LobbyData, currentPlayer: any): string {
    return `
            <div class="lobby-actions">
                ${ActionButtonRenderer.renderActionButtons(lobbyData, currentPlayer)}
            </div>
        `;
  }

  // UI 업데이트 메서드들 - UIStateManager에 위임
  updatePlayersUI(lobbyData: LobbyData): void {
    this.stateManager.updatePlayersUI(lobbyData);
  }

  updateActionButtonsUI(lobbyData: LobbyData): void {
    this.stateManager.updateActionButtonsUI(lobbyData);
  }

  updateHostInfoUI(newHostName: string): void {
    this.stateManager.updateHostInfoUI(newHostName);
  }

  updateConnectionStatus(isConnected: boolean, transport: string = "unknown"): void {
    this.stateManager.updateConnectionStatus(isConnected, transport);
  }

  renderMatchInfoInLobby(lobbyData: LobbyData): void {
    this.stateManager.renderMatchInfoInLobby(lobbyData);
  }

  // 매칭 결과 모달 표시
  showMatchResult(matchData: any): void {
    console.log("🎮 매칭 결과 표시:", matchData);

    const modalHTML = `
            <div class="match-result-modal">
                <div class="match-result-content">
                    <div class="match-result-header">
                        <h2>토너먼트 브라켓</h2>
                        <button class="close-modal-btn">×</button>
                    </div>
                    
                    <div class="match-result-body">
                        ${MatchRenderer.renderMatchDetails(matchData)}
                    </div>
                    
                </div>
            </div>
        `;
    // <div class="match-result-footer">
    //     <button class="start-match-btn confirm">게임 시작</button>
    // </div>
    // 게임 시작 버튼 임시 제거
    const modalElement = document.createElement("div");
    modalElement.innerHTML = modalHTML;
    modalElement.className = "modal-overlay";
    document.body.appendChild(modalElement);

    // 모달 이벤트 리스너 설정
    if (this.handlers) {
      ModalEventManager.setupMatchResultModalListeners(modalElement, matchData, this.handlers.onStartGame);
    }
  }

  // 유틸리티 메서드들
  private isPlayerPlayingInCurrentRound(matchData: any, userId: number | null): boolean {
    if (!matchData || !userId || !matchData.matches || !matchData.current_round) {
      return false;
    }

    const currentRoundMatches = matchData.matches.filter((match: any) => match.round === matchData.current_round);

    return currentRoundMatches.some((match: any) => {
      const leftPlayerId = match.left_player?.id;
      const rightPlayerId = match.right_player?.id;

      return (
        (match.game_status === "PENDING" || match.game_status === "IN_PROGRESS") &&
        (leftPlayerId === userId || rightPlayerId === userId)
      );
    });
  }

  clearContainer(): void {
    this.stateManager.clearContainer();
  }
}
