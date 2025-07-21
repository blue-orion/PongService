import { Component } from "../../Component";
import { loadTemplate, TEMPLATE_PATHS } from "../../../utils/template-loader";
import { AuthManager } from "../../../utils/auth";

export class CreateLobbyModal extends Component {
    private onLobbyCreated?: (lobby: any) => void;
    private isSubmitting: boolean = false;

    constructor(container: HTMLElement, onLobbyCreated?: (lobby: any) => void) {
        super(container);
        this.onLobbyCreated = onLobbyCreated;
    }

    async render(): Promise<void> {
        this.clearContainer();

        const template = await loadTemplate(TEMPLATE_PATHS.CREATE_LOBBY);
        this.container.innerHTML = template;

        this.setupEventListeners();
        this.show();
    }

    private setupEventListeners(): void {
        // 토너먼트 타입 선택 변경 이벤트
        const tournamentTypeSelect = this.container.querySelector('#tournament-type') as HTMLSelectElement;
        if (tournamentTypeSelect) {
            tournamentTypeSelect.addEventListener('change', () => {
                this.updatePlayerInfo();
            });
        }

        // 모달 외부 클릭 시 닫기
        const overlay = this.container.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.hide();
            });
        }

        // 닫기 버튼
        const closeBtn = this.container.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }

        // 취소 버튼
        const cancelBtn = this.container.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hide();
            });
        }

        // 폼 제출
        const form = this.container.querySelector('.create-lobby-form') as HTMLFormElement;
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', this.handleEscKey);
    }

    private updatePlayerInfo(): void {
        const tournamentTypeSelect = this.container.querySelector('#tournament-type') as HTMLSelectElement;
        const playerInfo = this.container.querySelector('#player-info') as HTMLElement;
        const playerCount = this.container.querySelector('#player-count') as HTMLElement;

        if (!tournamentTypeSelect || !playerInfo || !playerCount) return;

        const selectedOption = tournamentTypeSelect.selectedOptions[0];
        
        if (selectedOption && selectedOption.value) {
            const maxPlayers = selectedOption.getAttribute('data-players');
            if (maxPlayers) {
                playerCount.textContent = maxPlayers;
                playerInfo.style.display = 'block';
            }
        } else {
            playerInfo.style.display = 'none';
        }
    }

    private handleEscKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            this.hide();
        }
    }

    private async handleSubmit(): Promise<void> {
        if (this.isSubmitting) return;

        this.isSubmitting = true;
        this.showLoading();

        try {
            const form = this.container.querySelector('.create-lobby-form') as HTMLFormElement;
            const tournamentTypeSelect = this.container.querySelector('#tournament-type') as HTMLSelectElement;
            const selectedOption = tournamentTypeSelect.selectedOptions[0];
            
            if (!selectedOption || !selectedOption.value) {
                throw new Error('토너먼트 타입을 선택해주세요.');
            }

            const tournamentType = selectedOption.value;
            const maxPlayers = parseInt(selectedOption.getAttribute('data-players') || '2');
            
            // 현재 로그인한 사용자 ID 가져오기
            const userId = AuthManager.getCurrentUserId();
            if (!userId) {
                throw new Error('로그인이 필요합니다.');
            }

            const requestData = {
                tournament_type: tournamentType,
                max_player: maxPlayers,
                user_id: userId
            };

            console.log('로비 생성 요청:', requestData);

            const response = await fetch('http://localhost:3333/v1/lobbies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || '로비 생성에 실패했습니다.');
            }

            const lobbyData = await response.json();
            console.log('로비 생성 성공:', lobbyData);

            // 성공 시 생성된 로비로 이동
            if (lobbyData.lobby_id) {
                this.hide();
                window.history.pushState({}, '', `/lobby/${lobbyData.lobby_id}`);
                window.dispatchEvent(new PopStateEvent('popstate'));
            }
        } catch (error) {
            console.error('로비 생성 오류:', error);
            
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
            
            // 에러 메시지 표시
            const existingError = this.container.querySelector('.error-message');
            if (existingError) {
                existingError.textContent = errorMessage;
            } else {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message text-red-500 text-sm mt-2';
                errorDiv.textContent = errorMessage;
                
                const submitButton = this.container.querySelector('.submit-button');
                if (submitButton && submitButton.parentElement) {
                    submitButton.parentElement.insertBefore(errorDiv, submitButton);
                }
            }
        } finally {
            this.hideLoading();
            this.isSubmitting = false;
        }
    }

    private showLoading(): void {
        const loadingOverlay = this.container.querySelector('.loading-overlay') as HTMLElement;
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    private hideLoading(): void {
        const loadingOverlay = this.container.querySelector('.loading-overlay') as HTMLElement;
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    private showError(message: string): void {
        // 기존 에러 메시지 제거
        const existingError = this.container.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // 새 에러 메시지 표시
        const formActions = this.container.querySelector('.form-actions');
        if (formActions) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            formActions.parentNode?.insertBefore(errorDiv, formActions);
        }
    }

    private show(): void {
        const modal = this.container.querySelector('.create-lobby-modal') as HTMLElement;
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
        }
    }

    private hide(): void {
        const modal = this.container.querySelector('.create-lobby-modal') as HTMLElement;
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // 배경 스크롤 복원
        }
        
        // 이벤트 리스너 정리
        document.removeEventListener('keydown', this.handleEscKey);
        
        // 컴포넌트 제거
        this.destroy();
    }

    destroy(): void {
        document.removeEventListener('keydown', this.handleEscKey);
        document.body.style.overflow = '';
        this.clearContainer();
    }
}
