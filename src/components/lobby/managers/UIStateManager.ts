import { LobbyData } from "../../../types/lobby";
import { PlayerRenderer } from "../renderers/PlayerRenderer";
import { ActionButtonRenderer } from "../renderers/ActionButtonRenderer";
import { MatchRenderer } from "../renderers/MatchRenderer";
import { EventHandlerManager } from "./EventHandlerManager";

export class UIStateManager {
    private container: HTMLElement;
    private eventManager: EventHandlerManager;

    constructor(container: HTMLElement) {
        this.container = container;
        this.eventManager = new EventHandlerManager(container);
    }

    setEventHandlers(handlers: any): void {
        this.eventManager.setHandlers(handlers);
    }

    updatePlayersUI(lobbyData: LobbyData): void {
        const playersList = this.container.querySelector('.players-list');
        if (!playersList) {
            return;
        }

        const currentUserId = this.getCurrentUserId();
        const newHTML = PlayerRenderer.renderPlayersList(lobbyData, currentUserId);

        const oldHTML = playersList.innerHTML;
        if (oldHTML === newHTML) {
            return; // 변경이 없으면 리렌더링하지 않음
        } else {
            playersList.innerHTML = newHTML;
            this.eventManager.setupTransferLeadershipButtons();
        }
    }

    updateActionButtonsUI(lobbyData: LobbyData): void {
        // 준비 버튼 개별 업데이트
        ActionButtonRenderer.updateReadyButton(this.container, lobbyData);
        
        // 호스트 버튼들 상태 업데이트
        ActionButtonRenderer.updateHostButtons(this.container, lobbyData);

        // 매칭 정보 확인 버튼 동적 관리
        this.updateMatchInfoButton(lobbyData);
    }

    private updateMatchInfoButton(lobbyData: LobbyData): void {
        const hasMatchData = !!lobbyData.matchData;
        const existingBtn = this.container.querySelector('#view-match-btn');
        
        if (hasMatchData && !existingBtn) {
            ActionButtonRenderer.addViewMatchButton(this.container, () => {
                // 이벤트는 EventHandlerManager에서 처리
            });
            this.eventManager.setupViewMatchButtonListener();
            console.log('✅ 매칭 정보 확인 버튼 동적 추가');
        } else if (!hasMatchData && existingBtn) {
            ActionButtonRenderer.removeViewMatchButton(this.container);
            console.log('✅ 매칭 정보 확인 버튼 동적 제거');
        }
    }

    updateHostInfoUI(newHostName: string): void {
        const hostInfoElement = this.container.querySelector('.info-item:first-child span') as HTMLElement;
        if (hostInfoElement) {
            const oldHost = hostInfoElement.textContent;
            hostInfoElement.textContent = newHostName;
            
            // 시각적 효과로 변경을 강조
            this.highlightElement(hostInfoElement);
            
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

    renderMatchInfoInLobby(lobbyData: LobbyData): void {
        if (!lobbyData.matchData) return;

        const matchInfoSection = this.container.querySelector('#match-info-section') as HTMLElement;
        const matchInfoContent = this.container.querySelector('#match-info-content') as HTMLElement;
        
        if (!matchInfoSection || !matchInfoContent) return;

        // 매칭 정보가 있으면 섹션 표시
        matchInfoSection.style.display = 'block';
        
        // 매칭 정보 렌더링
        matchInfoContent.innerHTML = MatchRenderer.renderMatchInfoContent(lobbyData.matchData);
    }

    private highlightElement(element: HTMLElement): void {
        element.style.background = '#fbbf24';
        element.style.padding = '2px 6px';
        element.style.borderRadius = '4px';
        element.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            element.style.background = '';
            element.style.padding = '';
            element.style.borderRadius = '';
        }, 2000);
    }

    private getCurrentUserId(): number | null {
        // AuthManager를 직접 import하지 않고 런타임에 접근
        return (window as any).AuthManager?.getCurrentUserId() || null;
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

    showErrorState(message: string, onBackToList: () => void, onRefresh: () => void): void {
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
        if (backBtn) {
            backBtn.addEventListener('click', onBackToList);
        }

        const retryBtn = this.container.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', onRefresh);
        }
    }

    clearContainer(): void {
        this.container.innerHTML = '';
    }
}
