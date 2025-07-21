import { Component } from "../../Component";

export class LobbyDetailComponent extends Component {
    private lobbyId: string;
    private lobbyData: any = null;
    private isLoading: boolean = false;

    constructor(container: HTMLElement, lobbyId: string) {
        super(container);
        this.lobbyId = lobbyId;
    }

    async render(): Promise<void> {
        this.clearContainer();
        
        console.log('로비 상세 컴포넌트 렌더링 시작..., 로비 ID:', this.lobbyId);
        
        // 로비 데이터 로드
        await this.loadLobbyData();
        this.setupEventListeners();
        console.log('로비 상세 컴포넌트 렌더링 완료');
    }

    private async loadLobbyData(): Promise<void> {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();

        try {
            const response = await fetch(`http://localhost:3333/v1/lobbies/${this.lobbyId}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('로비를 찾을 수 없습니다.');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('받은 로비 상세 데이터:', data);
            
            // API 응답 데이터를 프론트엔드 형식에 맞게 변환
            this.lobbyData = {
                id: data.id,
                name: `로비 ${data.id}`,
                tournamentId: data.tournament_id,
                maxPlayers: data.max_player || 2,
                status: data.lobby_status,
                statusText: data.lobby_status === 'waiting' ? '대기 중' : '게임 중',
                creatorId: data.creator_id,
                createdAt: new Date(data.created_at).toLocaleString('ko-KR'),
                updatedAt: new Date(data.updated_at).toLocaleString('ko-KR'),
                tournament: data.tournament,
                players: data.players || [],
                currentPlayers: data.players?.length || 0,
                host: data.players?.find((p: any) => p.user_id === data.creator_id)?.user?.username || 'Unknown',
                isHost: false, // TODO: 현재 사용자 ID와 비교
                isPlayerReady: false, // TODO: 현재 사용자의 준비 상태
                allPlayersReady: data.players?.every((p: any) => p.is_ready) || false
            };

            this.renderLobbyDetail();
            
        } catch (error) {
            console.error('로비 데이터 로드 실패:', error);
            this.showErrorState(error instanceof Error ? error.message : '로비 정보를 불러오는데 실패했습니다.');
        } finally {
            this.isLoading = false;
        }
    }

    private showLoadingState(): void {
        this.container.innerHTML = `
            <div class="lobby-detail-page">
                <div class="loading-state">
                    <p>로비 정보를 불러오는 중...</p>
                </div>
            </div>
        `;
    }

    private showErrorState(message: string): void {
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
            backBtn.addEventListener('click', () => {
                if (window.router) {
                    window.router.navigate('/');
                }
            });
        }

        const retryBtn = this.container.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.loadLobbyData();
            });
        }
    }

    private renderLobbyDetail(): void {
        if (!this.lobbyData) return;

        this.container.innerHTML = `
            <div class="lobby-detail-page">
                <div class="lobby-header">
                    <button class="back-btn">← 로비 목록으로</button>
                    <h2>${this.lobbyData.name}</h2>
                    <div class="lobby-status ${this.lobbyData.status}">${this.lobbyData.statusText}</div>
                </div>

                <div class="lobby-content">
                    <div class="lobby-info-section">
                        <h3>로비 정보</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>호스트:</label>
                                <span>${this.lobbyData.host}</span>
                            </div>
                            <div class="info-item">
                                <label>현재 인원:</label>
                                <span>${this.lobbyData.currentPlayers}/${this.lobbyData.maxPlayers}</span>
                            </div>
                            <div class="info-item">
                                <label>생성 시간:</label>
                                <span>${this.lobbyData.createdAt}</span>
                            </div>
                            ${this.lobbyData.tournament ? `
                                <div class="info-item">
                                    <label>토너먼트:</label>
                                    <span>${this.lobbyData.tournament.name || '토너먼트 게임'}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="players-section">
                        <h3>참가자 목록</h3>
                        <div class="players-list">
                            ${this.lobbyData.players.map((player: any) => `
                                <div class="player-item ${player.is_ready ? 'ready' : 'not-ready'}">
                                    <div class="player-avatar">👤</div>
                                    <div class="player-info">
                                        <span class="player-name">${player.user?.username || 'Unknown'}</span>
                                        <span class="player-status">${player.is_ready ? '준비 완료' : '준비 중'}</span>
                                    </div>
                                    ${player.user_id === this.lobbyData.creatorId ? '<span class="host-badge">호스트</span>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="lobby-actions">
                    ${this.lobbyData.status === 'waiting' ? `
                        <button class="ready-btn ${this.lobbyData.isPlayerReady ? 'cancel' : 'confirm'}" id="ready-btn">
                            ${this.lobbyData.isPlayerReady ? '준비 취소' : '준비 완료'}
                        </button>
                        ${this.lobbyData.isHost ? `
                            <button class="start-game-btn" id="start-game-btn" ${!this.lobbyData.allPlayersReady ? 'disabled' : ''}>
                                게임 시작
                            </button>
                        ` : ''}
                    ` : this.lobbyData.status === 'playing' ? `
                        <button class="spectate-btn">관전하기</button>
                    ` : ''}
                    <button class="leave-lobby-btn">로비 나가기</button>
                </div>
            </div>
        `;
    }

    private setupEventListeners(): void {
        // 뒤로가기 버튼
        const backBtn = this.container.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (window.router) {
                    window.router.navigate('/');
                }
            });
        }

        // 준비 버튼
        const readyBtn = this.container.querySelector('#ready-btn');
        if (readyBtn) {
            readyBtn.addEventListener('click', () => {
                this.toggleReady();
            });
        }

        // 게임 시작 버튼
        const startGameBtn = this.container.querySelector('#start-game-btn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                this.startGame();
            });
        }

        // 관전 버튼
        const spectateBtn = this.container.querySelector('.spectate-btn');
        if (spectateBtn) {
            spectateBtn.addEventListener('click', () => {
                this.spectateGame();
            });
        }

        // 로비 나가기 버튼
        const leaveLobbyBtn = this.container.querySelector('.leave-lobby-btn');
        if (leaveLobbyBtn) {
            leaveLobbyBtn.addEventListener('click', () => {
                this.leaveLobby();
            });
        }
    }

    private async toggleReady(): Promise<void> {
        console.log('준비 상태 토글');
        try {
            // TODO: 실제 API 엔드포인트가 있을 때 구현
            // const response = await fetch(`http://localhost:3333/v1/lobbies/${this.lobbyId}/ready`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' }
            // });
            
            // 임시로 로컬 상태만 변경
            if (this.lobbyData) {
                this.lobbyData.isPlayerReady = !this.lobbyData.isPlayerReady;
                this.renderLobbyDetail();
                this.setupEventListeners();
            }
        } catch (error) {
            console.error('준비 상태 변경 실패:', error);
        }
    }

    private async startGame(): Promise<void> {
        console.log('게임 시작');
        try {
            // TODO: 실제 API 엔드포인트가 있을 때 구현
            // const response = await fetch(`http://localhost:3333/v1/lobbies/${this.lobbyId}/start`, {
            //     method: 'POST'
            // });
            
            // 임시로 게임 화면으로 이동
            if (window.router) {
                window.router.navigate(`/game/${this.lobbyId}`);
            }
        } catch (error) {
            console.error('게임 시작 실패:', error);
        }
    }

    private spectateGame(): void {
        console.log('게임 관전');
        // 관전 모드로 게임 화면 진입
        if (window.router) {
            window.router.navigate(`/game/${this.lobbyId}?mode=spectate`);
        }
    }

    private async leaveLobby(): Promise<void> {
        if (confirm('정말로 로비를 나가시겠습니까?')) {
            console.log('로비 나가기');
            try {
                // TODO: 실제 API 엔드포인트가 있을 때 구현
                // const response = await fetch(`http://localhost:3333/v1/lobbies/${this.lobbyId}/leave`, {
                //     method: 'POST'
                // });
                
                if (window.router) {
                    window.router.navigate('/');
                }
            } catch (error) {
                console.error('로비 나가기 실패:', error);
            }
        }
    }

    destroy(): void {
        this.clearContainer();
    }
}
