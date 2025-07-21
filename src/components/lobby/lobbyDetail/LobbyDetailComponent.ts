import { Component } from "../../Component";

export class LobbyDetailComponent extends Component {
    private lobbyId: string;

    constructor(container: HTMLElement, lobbyId: string) {
        super(container);
        this.lobbyId = lobbyId;
    }

    async render(): Promise<void> {
        this.clearContainer();
        
        console.log('로비 상세 컴포넌트 렌더링 시작..., 로비 ID:', this.lobbyId);
        
        // 실제로는 API에서 로비 정보를 가져와야 함
        const lobbyData = this.getMockLobbyData(this.lobbyId);
        
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
                        </div>
                    </div>

                    <div class="players-section">
                        <h3>참가자 목록</h3>
                        <div class="players-list">
                            ${lobbyData.players.map((player: any) => `
                                <div class="player-item ${player.isReady ? 'ready' : 'not-ready'}">
                                    <div class="player-avatar">👤</div>
                                    <div class="player-info">
                                        <span class="player-name">${player.name}</span>
                                        <span class="player-status">${player.isReady ? '준비 완료' : '준비 중'}</span>
                                    </div>
                                    ${player.isHost ? '<span class="host-badge">호스트</span>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="lobby-actions">
                    ${lobbyData.status === 'waiting' ? `
                        <button class="ready-btn ${lobbyData.isPlayerReady ? 'cancel' : 'confirm'}" id="ready-btn">
                            ${lobbyData.isPlayerReady ? '준비 취소' : '준비 완료'}
                        </button>
                        ${lobbyData.isHost ? `
                            <button class="start-game-btn" id="start-game-btn" ${!lobbyData.allPlayersReady ? 'disabled' : ''}>
                                게임 시작
                            </button>
                        ` : ''}
                    ` : lobbyData.status === 'playing' ? `
                        <button class="spectate-btn">관전하기</button>
                    ` : ''}
                    <button class="leave-lobby-btn">로비 나가기</button>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
        console.log('로비 상세 컴포넌트 렌더링 완료');
    }

    private getMockLobbyData(lobbyId: string) {
        // 실제로는 API에서 데이터를 가져와야 함
        const mockData: any = {
            '1': {
                name: '빠른 Pong 게임',
                host: 'Player123',
                status: 'waiting',
                statusText: '대기 중',
                currentPlayers: 1,
                maxPlayers: 2,
                createdAt: '2025-01-22 14:30',
                isHost: false,
                isPlayerReady: false,
                allPlayersReady: false,
                players: [
                    { name: 'Player123', isReady: true, isHost: true },
                    { name: 'You', isReady: false, isHost: false }
                ]
            },
            '2': {
                name: '친구들과 함께',
                host: 'GamerPro',
                status: 'waiting',
                statusText: '대기 중',
                currentPlayers: 1,
                maxPlayers: 2,
                createdAt: '2025-01-22 14:25',
                isHost: false,
                isPlayerReady: false,
                allPlayersReady: false,
                players: [
                    { name: 'GamerPro', isReady: true, isHost: true }
                ]
            },
            '3': {
                name: '고수들의 대결',
                host: 'ProGamer99',
                status: 'playing',
                statusText: '게임 중',
                currentPlayers: 2,
                maxPlayers: 2,
                createdAt: '2025-01-22 14:20',
                isHost: false,
                isPlayerReady: true,
                allPlayersReady: true,
                players: [
                    { name: 'ProGamer99', isReady: true, isHost: true },
                    { name: 'SkillPlayer', isReady: true, isHost: false }
                ]
            }
        };

        return mockData[lobbyId] || {
            name: '알 수 없는 로비',
            host: '?',
            gameType: 'Unknown',
            status: 'error',
            statusText: '오류',
            currentPlayers: 0,
            maxPlayers: 2,
            createdAt: '',
            isHost: false,
            isPlayerReady: false,
            allPlayersReady: false,
            players: []
        };
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

    private toggleReady(): void {
        console.log('준비 상태 토글');
        // 실제로는 서버에 준비 상태 변경 요청
        // UI 업데이트는 서버 응답에 따라
    }

    private startGame(): void {
        console.log('게임 시작');
        // 실제로는 서버에 게임 시작 요청
        // 게임 화면으로 이동
    }

    private spectateGame(): void {
        console.log('게임 관전');
        // 관전 모드로 게임 화면 진입
    }

    private leaveLobby(): void {
        if (confirm('정말로 로비를 나가시겠습니까?')) {
            console.log('로비 나가기');
            // 실제로는 서버에 로비 나가기 요청
            if (window.router) {
                window.router.navigate('/');
            }
        }
    }

    destroy(): void {
        this.clearContainer();
    }
}
