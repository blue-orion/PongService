import { Component } from "../Component";
import { AuthManager } from "../../utils/auth";

interface UserStats {
    id: number;
    username: string;
    nickname: string;
    profileImage: string;
    totalWins: number;
    totalLosses: number;
    winRate: number;
}

export class StatsComponent extends Component {
    private userId: string;
    private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    constructor(container: HTMLElement, userId: string) {
        super(container);
        this.userId = userId;
    }

    async render(): Promise<void> {
        this.clearContainer();

        // userId가 없으면 안내 메시지 출력
        if (!this.userId) {
            this.container.innerHTML = `<div class="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center font-medium m-5">사용자 ID 정보가 없습니다.</div>`;
            return;
        }

        // 로딩 상태 표시
        this.showLoadingState();

        // API에서 전적 정보 받아오기
        let statsData: UserStats | null = null;
        let apiError: string | null = null;
        try {
            const url = `${StatsComponent.API_BASE_URL}/users/summary/${this.userId}`;
            const res = await AuthManager.authenticatedFetch(url, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!res.ok) {
                throw new Error(`API 요청 실패: ${res.status} ${res.statusText}`);
            }
            
            const responseData = await res.json();
            
            if (responseData.success && responseData.data) {
                statsData = responseData.data;
            } else {
                throw new Error('응답 데이터 구조가 올바르지 않습니다.');
            }
        } catch (e) {
            console.error('[StatsComponent] API 오류:', e);
            apiError = e instanceof Error ? e.message : '전적 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
        }

        // 에러 발생 시 안내 메시지 출력
        if (apiError || !statsData || typeof statsData !== 'object') {
            this.showErrorState(apiError || '전적 정보가 없습니다.');
            return;
        }

        // 전적 화면 렌더링
        await this.renderStatsPage(statsData);
        this.setupEventListeners();
    }

    private showLoadingState(): void {
        this.container.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 p-4">
                <div class="max-w-4xl mx-auto">
                    <div class="flex items-center justify-center h-64">
                        <div class="text-center">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p class="text-gray-600">전적 정보를 불러오는 중...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private showErrorState(message: string): void {
        this.container.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 p-4">
                <div class="max-w-4xl mx-auto">
                    <div class="bg-red-50 border border-red-200 text-red-600 p-6 rounded-xl text-center font-medium mb-6">
                        <div class="text-xl mb-2">⚠️ 오류 발생</div>
                        <div class="text-base">${message}</div>
                    </div>
                    <div class="text-center">
                        <button class="back-btn bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                            프로필로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        `;
        this.setupBackButton();
    }

    private async renderStatsPage(stats: UserStats): Promise<void> {
        // 직접 HTML 템플릿 렌더링
        this.renderStatsPageFallback(stats);
    }
    
    // 전적 페이지 HTML 템플릿
    private renderStatsPageFallback(stats: UserStats): void {
        // 승률이 이미 백분율인지 확인 (0-1 범위면 * 100, 1 초과면 그대로 사용)
        const winRatePercent = stats.winRate <= 1 
            ? Math.round(stats.winRate * 100) 
            : Math.round(stats.winRate);

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
                                    <h1 class="text-2xl font-bold text-gray-800">${stats.username}님의 전적</h1>
                                    <p class="text-gray-600 text-sm">닉네임: ${stats.nickname}</p>
                                </div>
                            </div>
                            ${stats.profileImage ? `
                                <div class="w-16 h-16 rounded-full overflow-hidden border-3 border-indigo-200">
                                    <img src="${stats.profileImage}" alt="${stats.username}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" class="w-full h-full object-cover">
                                    <div class="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center" style="display: none;">
                                        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                                        </svg>
                                    </div>
                                </div>
                            ` : `
                                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                                    </svg>
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- 전체 전적 카드 -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <!-- 승패 통계 -->
                        <div class="bg-white rounded-xl shadow-md p-6">
                            <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                📊 전체 전적
                            </h2>
                            <div class="space-y-4">
                                <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                    <span class="text-green-700 font-medium">승리</span>
                                    <span class="text-2xl font-bold text-green-600">${stats.totalWins}승</span>
                                </div>
                                <div class="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                    <span class="text-red-700 font-medium">패배</span>
                                    <span class="text-2xl font-bold text-red-600">${stats.totalLosses}패</span>
                                </div>
                                <div class="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                                    <span class="text-indigo-700 font-medium">승률</span>
                                    <span class="text-2xl font-bold text-indigo-600">${winRatePercent}%</span>
                                </div>
                            </div>
                        </div>

                        <!-- 최근 게임 전적 -->
                        <div class="bg-white rounded-xl shadow-md p-6">
                            <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                🎮 최근 활동
                            </h2>
                            <div class="space-y-4">
                                <div class="text-center py-8">
                                    <div class="text-4xl mb-2">🏆</div>
                                    <p class="text-gray-600 mb-4">더 자세한 게임 기록을 확인해보세요!</p>
                                    <button class="recent-games-btn bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                                        최근 게임 전적 보기
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private setupEventListeners(): void {
        this.setupBackButton();
        this.setupRecentGamesButton();
    }

    private setupBackButton(): void {
        const backBtn = this.container.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (window.router) {
                    window.router.navigate(`/user/${this.userId}`);
                }
            });
        }
    }

    private setupRecentGamesButton(): void {
        const recentGamesBtn = this.container.querySelector('.recent-games-btn');
        if (recentGamesBtn) {
            recentGamesBtn.addEventListener('click', () => {
                if (window.router) {
                    window.router.navigate(`/user/${this.userId}/games`);
                }
            });
        }
    }

    destroy(): void {
        // 이벤트 리스너 정리
        const backBtn = this.container.querySelector('.back-btn');
        if (backBtn) {
            backBtn.removeEventListener('click', () => {});
        }

        const recentGamesBtn = this.container.querySelector('.recent-games-btn');
        if (recentGamesBtn) {
            recentGamesBtn.removeEventListener('click', () => {});
        }

        // 컨테이너는 Layout에서 관리하므로 여기서는 비우지 않음
        // this.clearContainer();
    }
}
