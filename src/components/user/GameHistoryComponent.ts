import { Component } from "../Component";
import { AuthManager } from "../../utils/auth";
import { loadTemplate, renderTemplate } from "../../utils/template-loader";

interface GameRecord {
    id: number;
    created_at: string;
    game_status: string;
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
            // 올바른 API 경로 사용
            const url = `${GameHistoryComponent.API_BASE_URL}/users/records/${this.userId}?page=${this.currentPage}&size=${this.pageSize}`;
            
            const response = await AuthManager.authenticatedFetch(url);

            if (!response.ok) {
                throw new Error(`게임 기록 요청 실패: ${response.status} ${response.statusText}`);
            }

            const pageData: PageResponse = await response.json();
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
                        <button class="back-btn bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                            전적으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        `;
        this.setupBackButton();
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
                opponent: opponent
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
            // 템플릿 로드 및 렌더링
            const template = await loadTemplate('/src/components/user/gameHistory.template.html');
            const renderedTemplate = renderTemplate(template, templateData);
            this.container.innerHTML = renderedTemplate;
            
            this.setupEventListeners();
        } catch (templateError) {
            console.error('[GameHistoryComponent] 템플릿 로드 오류:', templateError);
            this.renderGameHistoryFallback(processedRecords, pageData);
        }
    }

    private renderGameHistoryFallback(gameRecords: any[], pageData: PageResponse): void {
        const recordsHTML = gameRecords.map(record => `
            <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-center justify-between">
                    <!-- 게임 결과 -->
                    <div class="flex items-center gap-4">
                        <div class="${record.resultClass} text-white px-4 py-2 rounded-full text-sm font-semibold">
                            ${record.result}
                        </div>
                        <div class="text-sm text-gray-500">
                            ${record.gameDate}
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
                                    <p class="text-gray-600 text-sm">최근 게임 전적을 확인하세요</p>
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
                                    <p class="text-gray-600 text-sm">최근 게임 전적을 확인하세요</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 빈 상태 -->
                    <div class="bg-white rounded-xl shadow-md p-12 text-center">
                        <div class="text-6xl mb-4">🎮</div>
                        <h3 class="text-xl font-semibold text-gray-800 mb-2">아직 게임 기록이 없습니다</h3>
                        <p class="text-gray-600 mb-6">첫 게임을 시작해보세요!</p>
                        <button class="back-btn bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                            전적으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        `;
        this.setupBackButton();
    }

    private setupEventListeners(): void {
        this.setupBackButton();
        this.setupOpponentProfileButtons();
        this.setupPaginationButtons();
    }

    private setupBackButton(): void {
        const backBtn = this.container.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (window.router) {
                    window.router.navigate(`/user/${this.userId}/stats`);
                }
            });
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
            backBtn.removeEventListener('click', () => {});
        }

        // 컨테이너는 Layout에서 관리하므로 여기서는 비우지 않음
        // this.clearContainer();
    }
}
