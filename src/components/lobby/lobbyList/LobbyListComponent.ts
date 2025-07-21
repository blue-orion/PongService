import { loadTemplate, TEMPLATE_PATHS } from "../../../utils/template-loader";
import { Component } from "../../Component";

export class LobbyListComponent extends Component {
    private currentPage: number = 1;
    private pageSize: number = 12;
    private totalItems: number = 0;
    private filteredLobbies: any[] = [];
    private allLobbies: any[] = [];

    constructor(container: HTMLElement) {
        super(container);
        this.generateMockData();
    }

    async render(): Promise<void> {
        this.clearContainer();
        
        console.log('로비리스트 컴포넌트 렌더링 시작...');
        
        const template = await loadTemplate(TEMPLATE_PATHS.LOBBY_LIST);
        this.container.innerHTML = template;

        // 로비 데이터 렌더링
        this.renderLobbyData();
        this.setupEventListeners();
        console.log('로비리스트 컴포넌트 렌더링 완료');
    }

    private setupEventListeners(): void {
        // 새 로비 만들기 버튼
        const createLobbyBtn = this.container.querySelector('.create-lobby-btn');
        if (createLobbyBtn) {
            createLobbyBtn.addEventListener('click', () => {
                this.createNewLobby();
            });
        }

        // 필터 이벤트
        const statusFilter = this.container.querySelector('.status-filter');
        const searchInput = this.container.querySelector('.search-input');

        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.applyFilters();
            });
        }

        // 페이징 이벤트
        const prevBtn = this.container.querySelector('#prev-page');
        const nextBtn = this.container.querySelector('#next-page');
        const pageSizeSelect = this.container.querySelector('#page-size');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.goToPreviousPage();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.goToNextPage();
            });
        }

        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                this.pageSize = parseInt(target.value);
                this.currentPage = 1;
                this.renderLobbyData();
            });
        }
    }

    private generateMockData(): void {
        // 더미 로비 데이터 생성
        this.allLobbies = [];
        const statuses = ['waiting', 'playing'];
        const hostNames = ['Player1', 'GamerPro', 'ProGamer99', 'NewPlayer', 'SkillPlayer', 'Master123', 'Rookie456'];

        for (let i = 1; i <= 47; i++) {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const host = hostNames[Math.floor(Math.random() * hostNames.length)];
            const currentPlayers = status === 'playing' ? 2 : Math.floor(Math.random() * 2) + 1;
            
            this.allLobbies.push({
                id: i,
                name: `게임 ${i}`,
                host: host,
                status: status,
                statusText: status === 'waiting' ? '대기 중' : '게임 중',
                currentPlayers: currentPlayers,
                maxPlayers: 2,
                createdAt: new Date(Date.now() - Math.random() * 3600000).toLocaleString('ko-KR')
            });
        }

        this.filteredLobbies = [...this.allLobbies];
        this.totalItems = this.filteredLobbies.length;
    }

    private renderLobbyData(): void {
        const lobbyGrid = this.container.querySelector('#lobby-grid');
        if (!lobbyGrid) return;

        // 현재 페이지의 데이터 계산
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const currentPageData = this.filteredLobbies.slice(startIndex, endIndex);

        // 로비 카드들 생성
        lobbyGrid.innerHTML = currentPageData.map(lobby => `
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
                btn.addEventListener('click', (e) => {
                    const target = e.target as HTMLElement;
                    const page = parseInt(target.getAttribute('data-page') || '1');
                    this.currentPage = page;
                    this.renderLobbyData();
                });
            });
        }
    }

    private goToPreviousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderLobbyData();
        }
    }

    private goToNextPage(): void {
        const totalPages = Math.ceil(this.totalItems / this.pageSize);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderLobbyData();
        }
    }

    private applyFilters(): void {
        const gameTypeFilter = this.container.querySelector('.game-type-filter') as HTMLSelectElement;
        const statusFilter = this.container.querySelector('.status-filter') as HTMLSelectElement;
        const searchInput = this.container.querySelector('.search-input') as HTMLInputElement;

        this.filteredLobbies = this.allLobbies.filter(lobby => {
            // 게임 타입 필터
            if (gameTypeFilter?.value !== 'all' && lobby.gameType !== gameTypeFilter?.value) {
                return false;
            }

            // 상태 필터
            if (statusFilter?.value !== 'all' && lobby.status !== statusFilter?.value) {
                return false;
            }

            // 검색 필터
            if (searchInput?.value.trim()) {
                const searchTerm = searchInput.value.toLowerCase();
                if (!lobby.name.toLowerCase().includes(searchTerm) && 
                    !lobby.host.toLowerCase().includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        this.totalItems = this.filteredLobbies.length;
        this.currentPage = 1; // 필터 적용 시 첫 페이지로 이동
        this.renderLobbyData();
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
