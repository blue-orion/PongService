import { Component } from "../Component";
import { AuthManager } from "../../utils/auth";

interface GameRecord {
    id: number;
    created_at: string;
    game_status: string;
    play_time?: string; // 플레이타임 (문자열 형태, 예: "05:32")
    tournament_id?: number;
    round?: number;
    match?: number;
    player_one_id?: number;
    player_two_id?: number;
    player_one_score?: number;
    player_two_score?: number;
    winner_id?: number;
    loser_id?: number;
    winner_score?: number; // 기존 호환성을 위해 유지
    loser_score?: number; // 기존 호환성을 위해 유지
    winner: {
        id: number;
        username: string;
        nickname: string;
        profile_image?: string;
    };
    loser: {
        id: number;
        username: string;
        nickname: string;
        profile_image?: string;
    };
}

interface PageResponse {
    content: GameRecord[];
    size: number;
    first: boolean;
    last: boolean;
}

export class GameHistoryComponent extends Component {
    private userId: string;
    private currentPage: number = 1;
    private pageSize: number = 10;
    private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    constructor(container: HTMLElement, userId: string) {
        super(container);
        this.userId = userId;
    }

    async render(): Promise<void> {
        this.clearContainer();

        if (!this.userId) {
            this.container.innerHTML = `<div class="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center font-medium m-5">사용자 ID 정보가 없습니다.</div>`;
            return;
        }

        // 로딩 상태 표시
        this.showLoadingState();

        // 게임 기록 데이터 로드
        await this.loadGameHistory();
    }

    private showLoadingState(): void {
        this.container.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 p-4">
                <div class="max-w-4xl mx-auto">
                    <div class="flex items-center justify-center h-64">
                        <div class="text-center">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p class="text-gray-600">게임 기록을 불러오는 중...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private async loadGameHistory(): Promise<void> {
        try {
            // 백엔드 PageRequest에 맞춰 1-based 페이징 사용
            // PageRequest.of()에서 page는 1부터 시작함
            const page = this.currentPage; // 1-based index (백엔드 PageRequest와 일치)
            const url = `${GameHistoryComponent.API_BASE_URL}/users/records/${this.userId}?page=${page}&size=${this.pageSize}`;
            
            const response = await AuthManager.authenticatedFetch(url);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[GameHistoryComponent] API 에러 응답:`, errorText);
                throw new Error(`게임 기록 요청 실패: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const responseData = await response.json();
            
            // API 응답 구조 확인
            let pageData: PageResponse;
            if (responseData.success && responseData.data) {
                // { success: true, data: { content: [...], ... } } 구조
                pageData = responseData.data;
            } else if (responseData.content) {
                // { content: [...], ... } 구조 (직접 PageResponse)
                pageData = responseData;
            } else {
                console.error(`[GameHistoryComponent] 예상하지 못한 응답 구조:`, responseData);
                throw new Error('응답 데이터 구조가 올바르지 않습니다.');
            }
            
            this.renderGameHistory(pageData);

        } catch (error) {
            console.error('[GameHistoryComponent] API 오류:', error);
            this.showErrorState(error instanceof Error ? error.message : '게임 기록을 불러오지 못했습니다.');
        }
    }

    private showErrorState(message: string): void {
        this.container.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 p-4">
                <div class="max-w-4xl mx-auto">
                    <div class="bg-red-50 border border-red-200 text-red-600 p-6 rounded-xl text-center font-medium mb-6">
                        <div class="text-xl mb-2">⚠️ 오류 발생</div>
                        <div class="text-base">${message}</div>
                        <div class="text-sm text-red-500 mt-2">
                            백엔드 서버 상태를 확인해주세요. (500 에러가 발생했을 수 있습니다)
                        </div>
                    </div>
                    <div class="text-center">
                        <button class="back-to-stats-btn bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                            전적으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        `;
        // 에러 상태에서는 "전적으로 돌아가기" 버튼만 설정
        this.setupBackToStatsButton();
    }

    private async renderGameHistory(pageData: PageResponse): Promise<void> {
        const gameRecords = pageData.content || [];
        
        if (gameRecords.length === 0) {
            this.showEmptyState();
            return;
        }

        // 템플릿 데이터 준비
        const processedRecords = gameRecords.map(record => {
            const isWin = record.winner.id.toString() === this.userId;
            const opponent = isWin ? record.loser : record.winner;
            
            // 스코어 정보 처리 (새로운 player_one_score, player_two_score 우선 사용)
            let myScore = 0;
            let opponentScore = 0;
            
            if (record.player_one_score !== undefined && record.player_two_score !== undefined) {
                // 새로운 구조: player_one_score, player_two_score 사용
                const currentUserId = parseInt(this.userId);
                if (record.player_one_id === currentUserId) {
                    // 현재 사용자가 player_one
                    myScore = record.player_one_score;
                    opponentScore = record.player_two_score;
                } else if (record.player_two_id === currentUserId) {
                    // 현재 사용자가 player_two
                    myScore = record.player_two_score;
                    opponentScore = record.player_one_score;
                } else {
                    // 폴백: winner/loser 기반으로 처리
                    myScore = isWin ? (record.winner_score || 0) : (record.loser_score || 0);
                    opponentScore = isWin ? (record.loser_score || 0) : (record.winner_score || 0);
                }
            } else {
                // 기존 구조: winner_score, loser_score 사용
                myScore = isWin ? (record.winner_score || 0) : (record.loser_score || 0);
                opponentScore = isWin ? (record.loser_score || 0) : (record.winner_score || 0);
            }
            
            // 플레이타임 포맷팅 (문자열 또는 초 -> 분:초)
            const formatPlayTime = (playTime?: string | number): string => {
                if (!playTime) return '00:00';
                
                // 이미 문자열 형태라면 처리
                if (typeof playTime === 'string') {
                    // MM:SS 형태인지 확인 (예: "05:32")
                    if (/^\d{2}:\d{2}$/.test(playTime)) {
                        return playTime;
                    }
                    // M:SS 또는 M:S 형태인지 확인 (예: "0:3", "5:32", "10:5")
                    if (/^\d{1,2}:\d{1,2}$/.test(playTime)) {
                        const [minutes, seconds] = playTime.split(':').map(num => parseInt(num));
                        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    }
                    // 초 단위 문자열이라면 숫자로 변환 후 처리
                    const seconds = parseInt(playTime);
                    if (!isNaN(seconds)) {
                        const minutes = Math.floor(seconds / 60);
                        const remainingSeconds = seconds % 60;
                        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
                    }
                    return playTime; // 알 수 없는 형태라면 그대로 반환
                }
                
                // 숫자 형태라면 초 단위로 처리
                if (typeof playTime === 'number') {
                    const minutes = Math.floor(playTime / 60);
                    const remainingSeconds = playTime % 60;
                    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
                }
                
                return '00:00';
            };
            
            return {
                id: record.id,
                result: isWin ? '승리' : '패배',
                resultClass: isWin ? 'bg-green-500' : 'bg-red-500',
                gameDate: new Date(record.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                opponent: opponent,
                myScore: myScore,
                opponentScore: opponentScore,
                scoreDisplay: `${myScore} : ${opponentScore}`,
                playTime: formatPlayTime(record.play_time),
                gameId: record.id,
                gameStatus: record.game_status,
                tournamentId: record.tournament_id,
                round: record.round,
                match: record.match
            };
        });

        const templateData = {
            gameRecords: processedRecords,
            showPaging: true,
            isFirst: pageData.first,
            isLast: pageData.last,
            currentPage: this.currentPage,
            prevPage: this.currentPage - 1,
            nextPage: this.currentPage + 1
        };

        try {
            // 직접 HTML 템플릿 렌더링
            this.renderGameHistoryFallback(processedRecords, pageData);
        } catch (error) {
            console.error('[GameHistoryComponent] 렌더링 오류:', error);
            this.showErrorState('게임 기록을 표시할 수 없습니다.');
        }
    }

    // 게임 기록 HTML 템플릿
    private renderGameHistoryFallback(gameRecords: any[], pageData: PageResponse): void {
        const recordsHTML = gameRecords.map(record => `
            <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <!-- 게임 ID 및 상태 정보 -->
                <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <div class="flex items-center gap-3">
                        <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">ID: ${record.gameId}</span>
                        <div class="${record.resultClass} text-white px-3 py-1 rounded-full text-sm font-semibold">
                            ${record.result}
                        </div>
                        ${record.gameStatus ? `
                            <span class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">${record.gameStatus}</span>
                        ` : ''}
                        ${record.tournamentId ? `
                            <span class="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">토너먼트 #${record.tournamentId}</span>
                        ` : ''}
                        ${record.round && record.match ? `
                            <span class="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">R${record.round}-M${record.match}</span>
                        ` : ''}
                    </div>
                    <div class="text-sm text-gray-500">
                        ${record.gameDate}
                    </div>
                </div>

                <!-- 게임 정보 -->
                <div class="flex items-center justify-between">
                    <!-- 스코어 정보 -->
                    <div class="flex items-center gap-6">
                        <div class="text-center">
                            <div class="text-xs text-gray-500 mb-1">스코어</div>
                            <div class="text-lg font-bold text-gray-800">${record.scoreDisplay}</div>
                        </div>
                        <div class="text-center">
                            <div class="text-xs text-gray-500 mb-1">플레이타임</div>
                            <div class="text-sm font-medium text-gray-700">${record.playTime}</div>
                        </div>
                    </div>

                    <!-- 상대방 정보 -->
                    <div class="flex items-center gap-3">
                        <span class="text-gray-600 text-sm">vs</span>
                        ${record.opponent.profile_image ? `
                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                <img src="${record.opponent.profile_image}" alt="${record.opponent.username}" class="w-full h-full object-cover">
                            </div>
                        ` : `
                            <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm">👤</div>
                        `}
                        <div class="text-right">
                            <button class="opponent-profile-btn text-blue-600 hover:text-blue-800 font-medium text-sm" data-user-id="${record.opponent.id}">
                                ${record.opponent.username}
                            </button>
                            <div class="text-xs text-gray-500">${record.opponent.nickname}</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        const paginationHTML = `
            <div class="flex justify-center gap-2 mt-8">
                ${!pageData.first ? `
                    <button class="page-btn bg-white text-blue-600 px-4 py-2 rounded-lg border hover:bg-blue-50 transition-colors" data-page="${this.currentPage - 1}">
                        이전
                    </button>
                ` : ''}
                
                <span class="flex items-center px-4 py-2 text-gray-600 bg-blue-100 rounded-lg">
                    ${this.currentPage} 페이지
                </span>
                
                ${!pageData.last ? `
                    <button class="page-btn bg-white text-blue-600 px-4 py-2 rounded-lg border hover:bg-blue-50 transition-colors" data-page="${this.currentPage + 1}">
                        다음
                    </button>
                ` : ''}
            </div>
        `;

        this.container.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 p-4">
                <div class="max-w-4xl mx-auto">
                    <!-- 헤더 -->
                    <div class="mb-8">
                        <div class="flex items-center justify-between bg-white rounded-xl shadow-md p-6">
                            <div class="flex items-center gap-4">
                                <button class="back-btn bg-indigo-100 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-200 transition-colors font-medium">
                                    ← 뒤로가기
                                </button>
                                <div>
                                    <h1 class="text-2xl font-bold text-gray-800">게임 기록</h1>
                                    <p class="text-gray-600 text-sm">스코어, 플레이타임, 상대방 정보를 확인하세요</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 게임 기록 목록 -->
                    <div class="space-y-4">
                        ${recordsHTML}
                    </div>

                    <!-- 페이징 -->
                    ${paginationHTML}
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    private showEmptyState(): void {
        this.container.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 p-4">
                <div class="max-w-4xl mx-auto">
                    <!-- 헤더 -->
                    <div class="mb-8">
                        <div class="flex items-center justify-between bg-white rounded-xl shadow-md p-6">
                            <div class="flex items-center gap-4">
                                <button class="back-btn bg-indigo-100 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-200 transition-colors font-medium">
                                    ← 뒤로가기
                                </button>
                                <div>
                                    <h1 class="text-2xl font-bold text-gray-800">게임 기록</h1>
                                    <p class="text-gray-600 text-sm">스코어, 플레이타임, 상대방 정보를 확인하세요</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 빈 상태 -->
                    <div class="bg-white rounded-xl shadow-md p-12 text-center">
                        <div class="text-6xl mb-4">🎮</div>
                        <h3 class="text-xl font-semibold text-gray-800 mb-2">아직 게임 기록이 없습니다</h3>
                        <p class="text-gray-600 mb-6">첫 게임을 시작해서 전적을 쌓아보세요!</p>
                        <div class="text-sm text-gray-500 mb-4">
                            게임을 완료하면 스코어, 플레이타임 등의 상세 정보가 표시됩니다.
                        </div>
                        <button class="back-to-stats-btn bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                            전적으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        `;
        // 빈 상태에서는 두 버튼 모두 설정
        this.setupBackButton();
        this.setupBackToStatsButton();
    }

    private setupEventListeners(): void {
        this.setupBackButton();
        this.setupBackToStatsButton();
        this.setupOpponentProfileButtons();
        this.setupPaginationButtons();
    }

    private setupBackButton(): void {
        const backBtn = this.container.querySelector('.back-btn');
        if (backBtn) {
            // 기존 이벤트 리스너 제거 (중복 방지)
            backBtn.removeEventListener('click', this.handleBackButtonClick);
            
            // 새 이벤트 리스너 등록
            backBtn.addEventListener('click', this.handleBackButtonClick, true);
        }
    }

    private handleBackButtonClick = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        if (window.router) {
            // 브라우저 히스토리를 사용하여 이전 페이지로 이동
            if (window.router.canGoBack()) {
                window.router.goBack();
            } else {
                // 히스토리가 없으면 전적 페이지로 이동
                window.router.navigate(`/user/${this.userId}/stats`);
            }
        }
    }

    private setupBackToStatsButton(): void {
        const backToStatsBtn = this.container.querySelector('.back-to-stats-btn');
        if (backToStatsBtn) {
            // 기존 이벤트 리스너 제거 (중복 방지)
            backToStatsBtn.removeEventListener('click', this.handleBackButtonClick);
            
            // 뒤로가기 버튼과 같은 이벤트 핸들러 사용
            backToStatsBtn.addEventListener('click', this.handleBackButtonClick, true);
        }
    }

    private setupOpponentProfileButtons(): void {
        const opponentButtons = this.container.querySelectorAll('.opponent-profile-btn');
        opponentButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const opponentUserId = target.getAttribute('data-user-id');
                if (opponentUserId && window.router) {
                    window.router.navigate(`/user/${opponentUserId}`);
                }
            });
        });
    }

    private setupPaginationButtons(): void {
        const pageButtons = this.container.querySelectorAll('.page-btn');
        pageButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const target = e.target as HTMLElement;
                const page = parseInt(target.getAttribute('data-page') || '1');
                if (page !== this.currentPage) {
                    this.currentPage = page;
                    this.showLoadingState();
                    await this.loadGameHistory();
                }
            });
        });
    }

    destroy(): void {
        // 이벤트 리스너 정리
        const backBtn = this.container.querySelector('.back-btn');
        if (backBtn) {
            backBtn.removeEventListener('click', this.handleBackButtonClick);
        }

        const backToStatsBtn = this.container.querySelector('.back-to-stats-btn');
        if (backToStatsBtn) {
            backToStatsBtn.removeEventListener('click', this.handleBackButtonClick);
        }

        // 컨테이너는 Layout에서 관리하므로 여기서는 비우지 않음
        // this.clearContainer();
    }
}
