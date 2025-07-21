import { Component } from "../Component";

export class UserInfoComponent extends Component {
    private userId: string;

    constructor(container: HTMLElement, userId: string) {
        super(container);
        this.userId = userId;
    }

    async render(): Promise<void> {
        this.clearContainer();
        
        console.log('사용자 정보 컴포넌트 렌더링 시작..., 사용자 ID:', this.userId);
        
        // 실제로는 API에서 사용자 정보를 가져와야 함
        const userData = this.getMockUserData(this.userId);
        
        this.container.innerHTML = `
            <div class="user-info-page">
                <div class="page-header">
                    <button class="back-btn">← 뒤로가기</button>
                    <h2>사용자 정보</h2>
                </div>

                <div class="user-profile">
                    <div class="profile-header">
                        <div class="profile-avatar">
                            <img src="${userData.avatar}" alt="${userData.username}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                            <div class="avatar-placeholder" style="display: none;">👤</div>
                        </div>
                        <div class="profile-info">
                            <h3>${userData.username}</h3>
                            <p class="user-level">레벨 ${userData.level}</p>
                            <p class="user-status ${userData.status}">${userData.statusText}</p>
                            <p class="last-seen">마지막 접속: ${userData.lastSeen}</p>
                        </div>
                        <div class="profile-actions">
                            ${userData.isFriend ? `
                                <button class="friend-btn remove">친구 삭제</button>
                                <button class="message-btn">메시지 보내기</button>
                                <button class="invite-btn">게임 초대</button>
                            ` : `
                                <button class="friend-btn add">친구 추가</button>
                                <button class="message-btn">메시지 보내기</button>
                            `}
                            ${userData.isBlocked ? `
                                <button class="block-btn unblock">차단 해제</button>
                            ` : `
                                <button class="block-btn block">차단하기</button>
                            `}
                        </div>
                    </div>
                </div>

                <div class="user-stats">
                    <h3>게임 통계</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${userData.stats.totalGames}</div>
                            <div class="stat-label">총 게임 수</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${userData.stats.wins}</div>
                            <div class="stat-label">승리</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${userData.stats.losses}</div>
                            <div class="stat-label">패배</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${userData.stats.winRate}%</div>
                            <div class="stat-label">승률</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${userData.stats.ranking}</div>
                            <div class="stat-label">랭킹</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${userData.stats.playTime}</div>
                            <div class="stat-label">플레이 시간</div>
                        </div>
                    </div>
                </div>

                <div class="user-achievements">
                    <h3>업적</h3>
                    <div class="achievements-grid">
                        ${userData.achievements.map((achievement: any) => `
                            <div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}">
                                <div class="achievement-icon">${achievement.icon}</div>
                                <div class="achievement-info">
                                    <h4>${achievement.name}</h4>
                                    <p>${achievement.description}</p>
                                    ${achievement.unlocked ? `<span class="unlock-date">달성일: ${achievement.unlockedAt}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="recent-games">
                    <h3>최근 게임 기록</h3>
                    <div class="games-list">
                        ${userData.recentGames.map((game: any) => `
                            <div class="game-record ${game.result}">
                                <div class="game-info">
                                    <span class="game-type">${game.gameType}</span>
                                    <span class="opponent">vs ${game.opponent}</span>
                                    <span class="score">${game.score}</span>
                                </div>
                                <div class="game-meta">
                                    <span class="result ${game.result}">${game.result === 'win' ? '승리' : '패배'}</span>
                                    <span class="date">${game.date}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
        console.log('사용자 정보 컴포넌트 렌더링 완료');
    }

    private getMockUserData(userId: string) {
        // 실제로는 API에서 데이터를 가져와야 함
        const mockUsers: any = {
            'player123': {
                username: 'Player123',
                level: 15,
                status: 'online',
                statusText: '온라인',
                lastSeen: '방금 전',
                avatar: '/avatars/player123.jpg',
                isFriend: true,
                isBlocked: false,
                stats: {
                    totalGames: 157,
                    wins: 98,
                    losses: 59,
                    winRate: 62,
                    ranking: 1245,
                    playTime: '48시간'
                },
                achievements: [
                    {
                        name: '첫 승리',
                        description: '첫 번째 게임에서 승리하기',
                        icon: '🏆',
                        unlocked: true,
                        unlockedAt: '2024-12-15'
                    },
                    {
                        name: '연승왕',
                        description: '10연승 달성하기',
                        icon: '🔥',
                        unlocked: true,
                        unlockedAt: '2025-01-10'
                    },
                    {
                        name: '백전백승',
                        description: '100승 달성하기',
                        icon: '👑',
                        unlocked: false
                    }
                ],
                recentGames: [
                    {
                        gameType: 'Pong',
                        opponent: 'GamerPro',
                        score: '11-7',
                        result: 'win',
                        date: '2025-01-22'
                    },
                    {
                        gameType: 'Pong',
                        opponent: 'NewPlayer',
                        score: '8-11',
                        result: 'lose',
                        date: '2025-01-21'
                    },
                    {
                        gameType: 'Pong',
                        opponent: 'ProGamer99',
                        score: '11-4',
                        result: 'win',
                        date: '2025-01-20'
                    }
                ]
            }
        };

        return mockUsers[userId] || {
            username: '알 수 없는 사용자',
            level: 0,
            status: 'offline',
            statusText: '오프라인',
            lastSeen: '알 수 없음',
            avatar: '',
            isFriend: false,
            isBlocked: false,
            stats: {
                totalGames: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                ranking: 0,
                playTime: '0시간'
            },
            achievements: [],
            recentGames: []
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

        // 친구 추가/삭제 버튼
        const friendBtn = this.container.querySelector('.friend-btn');
        if (friendBtn) {
            friendBtn.addEventListener('click', () => {
                this.toggleFriend();
            });
        }

        // 메시지 보내기 버튼
        const messageBtn = this.container.querySelector('.message-btn');
        if (messageBtn) {
            messageBtn.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        // 게임 초대 버튼
        const inviteBtn = this.container.querySelector('.invite-btn');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', () => {
                this.inviteToGame();
            });
        }

        // 차단/차단 해제 버튼
        const blockBtn = this.container.querySelector('.block-btn');
        if (blockBtn) {
            blockBtn.addEventListener('click', () => {
                this.toggleBlock();
            });
        }
    }

    private toggleFriend(): void {
        console.log('친구 추가/삭제 토글');
        // 실제로는 서버에 친구 관계 변경 요청
    }

    private sendMessage(): void {
        console.log('메시지 보내기');
        // 메시지 다이얼로그 또는 채팅 창 열기
    }

    private inviteToGame(): void {
        console.log('게임 초대');
        // 게임 초대 기능 구현
    }

    private toggleBlock(): void {
        console.log('차단/차단 해제 토글');
        // 실제로는 서버에 차단 상태 변경 요청
    }

    destroy(): void {
        this.clearContainer();
    }
}
