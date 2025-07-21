import { loadTemplate, TEMPLATE_PATHS } from "../../../utils/template-loader";
import { Component } from "../../Component";

export class LobbyListComponent extends Component {
    private currentPage: number = 1;
    private pageSize: number = 12;
    private totalItems: number = 0;
    private lobbies: any[] = [];
    private isLoading: boolean = false;

    constructor(container: HTMLElement) {
        super(container);
    }

    async render(): Promise<void> {
        this.clearContainer();
        
        console.log('로비리스트 컴포넌트 렌더링 시작...');
        
        const template = await loadTemplate(TEMPLATE_PATHS.LOBBY_LIST);
        this.container.innerHTML = template;

        // 로비 데이터 로드 및 렌더링
        await this.loadLobbyData();
        this.setupEventListeners();
        console.log('로비리스트 컴포넌트 렌더링 완료');
    }

    private async loadLobbyData(): Promise<void> {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();

        try {
            const response = await fetch(`http://localhost:3333/v1/lobbies?page=${this.currentPage}&size=${this.pageSize}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            this.lobbies = data.lobbies.map((lobby: any) => ({
                id: lobby.id,
                name: lobby.name || `로비 ${lobby.id}`,
                host: lobby.lobby_players?.find((p: any) => p.is_host)?.user?.username || 'Unknown',
                status: lobby.status === 'waiting' ? 'waiting' : 'playing',
                statusText: lobby.status === 'waiting' ? '대기 중' : '게임 중',
                currentPlayers: lobby.lobby_players?.length || 0,
                maxPlayers: lobby.max_players || 2,
                createdAt: new Date(lobby.created_at).toLocaleString('ko-KR')
            }));
            
            this.totalItems = data.total;
            this.renderLobbyData();
            
        } catch (error) {
            console.error('로비 데이터 로드 실패:', error);
            this.showErrorState();
        } finally {
            this.isLoading = false;
        }
    }

    private showLoadingState(): void {
        const lobbyGrid = this.container.querySelector('#lobby-grid');
        if (lobbyGrid) {
            lobbyGrid.innerHTML = `
                <div class="loading-state">
                    <p>로비 목록을 불러오는 중...</p>
                </div>
            `;
        }
    }

    private showErrorState(): void {
        const lobbyGrid = this.container.querySelector('#lobby-grid');
        if (lobbyGrid) {
            lobbyGrid.innerHTML = `
                <div class="error-state">
                    <p>로비 목록을 불러오는데 실패했습니다.</p>
                    <button class="retry-btn" onclick="this.loadLobbyData()">다시 시도</button>
                </div>
            `;
        }
    }

    private setupEventListeners(): void {
        // 새 로비 만들기 버튼
        const createLobbyBtn = this.container.querySelector('.create-lobby-btn');
        if (createLobbyBtn) {
            createLobbyBtn.addEventListener('click', () => {
                this.createNewLobby();
            });
        }

        // 필터 이벤트 (향후 서버 사이드 필터링으로 구현 예정)
        const statusFilter = this.container.querySelector('.status-filter');
        const searchInput = this.container.querySelector('.search-input');

        if (statusFilter) {
            statusFilter.addEventListener('change', async () => {
                this.currentPage = 1;
                await this.loadLobbyData();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', async () => {
                this.currentPage = 1;
                await this.loadLobbyData();
            });
        }

        // 페이징 이벤트
        const prevBtn = this.container.querySelector('#prev-page');
        const nextBtn = this.container.querySelector('#next-page');
        const pageSizeSelect = this.container.querySelector('#page-size');

        if (prevBtn) {
            prevBtn.addEventListener('click', async () => {
                await this.goToPreviousPage();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', async () => {
                await this.goToNextPage();
            });
        }

        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', async (e) => {
                const target = e.target as HTMLSelectElement;
                this.pageSize = parseInt(target.value);
                this.currentPage = 1;
                await this.loadLobbyData();
            });
        }
    }

    private renderLobbyData(): void {
        const lobbyGrid = this.container.querySelector('#lobby-grid');
        if (!lobbyGrid) return;

        // 로비 카드들 생성
        lobbyGrid.innerHTML = this.lobbies.map((lobby: any) => `
            <div class="lobby-card ${lobby.status}" data-lobby-id="${lobby.id}">
                <div class="lobby-header">
                    <h3>${lobby.name}</h3>
                    <span class="status ${lobby.status}">${lobby.statusText}</span>
                </div>
                <div class="lobby-info">
                    <p><strong>호스트:</strong> ${lobby.host}</p>
                    <p><strong>인원:</strong> ${lobby.currentPlayers}/${lobby.maxPlayers}</p>
                    <p><strong>생성 시간:</strong> ${lobby.createdAt}</p>
                </div>
                ${lobby.status === 'waiting' ? 
                    `<button class="join-btn" data-lobby-id="${lobby.id}">입장하기</button>` : 
                    `<button class="spectate-btn" data-lobby-id="${lobby.id}">관전하기</button>`
                }
            </div>
        `).join('');

        // 페이징 정보 업데이트
        this.updatePaginationInfo();
        this.updatePaginationControls();

        // 로비 카드 이벤트 리스너 재설정
        this.setupLobbyCardEvents();
    }

    private setupLobbyCardEvents(): void {
        // 입장 버튼들
        const joinBtns = this.container.querySelectorAll('.join-btn');
        joinBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const lobbyId = target.getAttribute('data-lobby-id');
                if (lobbyId && window.router) {
                    window.router.navigate(`/lobby/${lobbyId}`);
                }
            });
        });

        // 관전 버튼들
        const spectateBtns = this.container.querySelectorAll('.spectate-btn');
        spectateBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const lobbyId = target.getAttribute('data-lobby-id');
                if (lobbyId && window.router) {
                    window.router.navigate(`/lobby/${lobbyId}?mode=spectate`);
                }
            });
        });
    }

    private updatePaginationInfo(): void {
        const paginationInfo = this.container.querySelector('#pagination-info');
        if (paginationInfo) {
            const startItem = (this.currentPage - 1) * this.pageSize + 1;
            const endItem = Math.min(this.currentPage * this.pageSize, this.totalItems);
            paginationInfo.textContent = `${startItem}-${endItem} / 총 ${this.totalItems}개의 로비`;
        }
    }

    private updatePaginationControls(): void {
        const totalPages = Math.ceil(this.totalItems / this.pageSize);
        
        // 이전/다음 버튼 상태 업데이트
        const prevBtn = this.container.querySelector('#prev-page') as HTMLButtonElement;
        const nextBtn = this.container.querySelector('#next-page') as HTMLButtonElement;
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= totalPages;
        }

        // 페이지 번호 버튼들 생성
        const pageNumbers = this.container.querySelector('#page-numbers');
        if (pageNumbers) {
            const startPage = Math.max(1, this.currentPage - 2);
            const endPage = Math.min(totalPages, this.currentPage + 2);
            
            let pageButtonsHTML = '';
            
            for (let i = startPage; i <= endPage; i++) {
                pageButtonsHTML += `
                    <button class="page-number ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            }
            
            pageNumbers.innerHTML = pageButtonsHTML;
            
            // 페이지 번호 클릭 이벤트
            pageNumbers.querySelectorAll('.page-number').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const target = e.target as HTMLElement;
                    const page = parseInt(target.getAttribute('data-page') || '1');
                    this.currentPage = page;
                    await this.loadLobbyData();
                });
            });
        }
    }

    private async goToPreviousPage(): Promise<void> {
        if (this.currentPage > 1) {
            this.currentPage--;
            await this.loadLobbyData();
        }
    }

    private async goToNextPage(): Promise<void> {
        const totalPages = Math.ceil(this.totalItems / this.pageSize);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            await this.loadLobbyData();
        }
    }

    private createNewLobby(): void {
        // 새 로비 생성 다이얼로그 표시
        const lobbyName = prompt('로비 이름을 입력하세요:');
        if (lobbyName) {
            console.log('새 로비 생성:', lobbyName);
            // 실제 로비 생성 로직 구현
            // 성공 시 새로 생성된 로비로 이동
            if (window.router) {
                window.router.navigate('/lobby/new');
            }
        }
    }

    destroy(): void {
        this.clearContainer();
    }
}
