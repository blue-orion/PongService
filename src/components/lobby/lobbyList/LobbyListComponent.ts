import { loadTemplate, TEMPLATE_PATHS } from "../../../utils/template-loader";
import { Component } from "../../Component";
import { CreateLobbyModal } from "../createLobby/CreateLobbyModal";
import { LobbyListService, LobbyItem, PaginationInfo, LoadLobbiesParams } from "./LobbyListService";
import { LobbyListUI, UIEventHandlers } from "./LobbyListUI";

export class LobbyListComponent extends Component {
    private currentPage: number = 1;
    private pageSize: number = 12;
    private isLoading: boolean = false;
    private service: LobbyListService;
    private ui: LobbyListUI;
    private lobbies: LobbyItem[] = [];
    private pagination: PaginationInfo | null = null;

    constructor(container: HTMLElement) {
        super(container);
        this.service = new LobbyListService();
        this.ui = new LobbyListUI(container);
        
        this.setupEventHandlers();
    }

    async render(): Promise<void> {
        this.ui.clearContainer();
        
        console.log('로비리스트 컴포넌트 렌더링 시작...');
        
        const template = await loadTemplate(TEMPLATE_PATHS.LOBBY_LIST);
        this.container.innerHTML = template;

        // UI 이벤트 리스너 설정
        this.ui.setupMainEventListeners();

        // 로비 데이터 로드 및 렌더링
        await this.loadLobbyData();
        console.log('로비리스트 컴포넌트 렌더링 완료');
    }

    private setupEventHandlers(): void {
        const uiHandlers: UIEventHandlers = {
            onCreateLobby: () => this.createNewLobby(),
            onJoinLobby: (lobbyId) => this.joinLobby(lobbyId),
            onEnterLobby: (lobbyId) => this.enterLobby(lobbyId),
            onSpectateLobby: (lobbyId) => this.spectateLobby(lobbyId),
            onFilterChange: (status, search) => this.handleFilterChange(status, search),
            onPageChange: (page) => this.goToPage(page),
            onPageSizeChange: (pageSize) => this.changePageSize(pageSize),
            onPreviousPage: () => this.goToPreviousPage(),
            onNextPage: () => this.goToNextPage(),
            onRetry: () => this.loadLobbyData()
        };

        this.ui.setEventHandlers(uiHandlers);
    }

    // 데이터 로드 메서드
    private async loadLobbyData(): Promise<void> {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.ui.showLoadingState();

        try {
            const filters = this.ui.getFilterValues();
            const params: LoadLobbiesParams = {
                page: this.currentPage,
                size: this.pageSize,
                status: filters.status !== 'all' ? filters.status : undefined,
                search: filters.search || undefined
            };

            const result = await this.service.loadLobbies(params);
            
            this.lobbies = result.lobbies;
            this.pagination = result.pagination;
            
            // 로비가 하나도 없는 경우와 일반적인 렌더링 구분
            if (this.lobbies.length === 0) {
                this.ui.showEmptyState();
            } else {
                this.ui.renderLobbyData(this.lobbies);
            }
            
            // 페이징 정보 업데이트
            if (this.pagination) {
                this.ui.updatePaginationInfo(this.pagination);
                this.ui.updatePaginationControls(this.pagination);
            }
            
        } catch (error) {
            console.error('로비 데이터 로드 실패:', error);
            this.ui.showErrorState();
        } finally {
            this.isLoading = false;
        }
    }

    // UI 이벤트 핸들러들
    private async handleFilterChange(status: string, search: string): Promise<void> {
        console.log('필터 변경:', { status, search });
        this.currentPage = 1;
        await this.loadLobbyData();
    }

    private async goToPage(page: number): Promise<void> {
        console.log('페이지 이동:', page);
        this.currentPage = page;
        await this.loadLobbyData();
    }

    private async changePageSize(pageSize: number): Promise<void> {
        console.log('페이지 크기 변경:', pageSize);
        this.pageSize = pageSize;
        this.currentPage = 1;
        await this.loadLobbyData();
    }

    private async goToPreviousPage(): Promise<void> {
        if (this.service.canGoToPreviousPage(this.currentPage)) {
            this.currentPage--;
            await this.loadLobbyData();
        }
    }

    private async goToNextPage(): Promise<void> {
        if (this.pagination && this.service.canGoToNextPage(this.currentPage, this.pagination.totalPages)) {
            this.currentPage++;
            await this.loadLobbyData();
        }
    }

    private async joinLobby(lobbyId: number): Promise<void> {
        console.log('🚪 새로운 로비 입장 시도:', lobbyId);
        try {
            await this.service.joinLobby(lobbyId);
            
            // 입장 성공 시 로비 상세 페이지로 이동
            if (window.router) {
                console.log('🏃‍♂️ 로비 상세 페이지로 이동:', `/lobby/${lobbyId}`);
                window.router.navigate(`/lobby/${lobbyId}`);
            }
        } catch (error) {
            console.error('💥 로비 입장 오류:', error);
            const errorMessage = error instanceof Error ? error.message : '로비 입장에 실패했습니다.';
            alert(`❌ ${errorMessage}`);
        }
    }

    private enterLobby(lobbyId: number): void {
        console.log('이미 참여 중인 로비로 이동:', lobbyId);
        if (window.router) {
            window.router.navigate(`/lobby/${lobbyId}`);
        }
    }

    private spectateLobby(lobbyId: number): void {
        console.log('로비 관전 모드로 이동:', lobbyId);
        if (window.router) {
            window.router.navigate(`/lobby/${lobbyId}?mode=spectate`);
        }
    }

    private async createNewLobby(): Promise<void> {
        // 모달 컨테이너 생성
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-container';
        document.body.appendChild(modalContainer);

        // 로비 생성 모달 생성
        const createLobbyModal = new CreateLobbyModal(
            modalContainer,
            (createdLobby) => {
                // 로비 생성 성공 시 콜백
                console.log('로비 생성 완료:', createdLobby);
                
                // 모달에서 페이지 이동이 실패한 경우를 대비해 여기서도 처리
                const lobbyId = createdLobby?.lobby?.id || createdLobby?.id;
                if (lobbyId && window.router) {
                    console.log('콜백에서 로비 페이지로 이동:', `/lobby/${lobbyId}`);
                    window.router.navigate(`/lobby/${lobbyId}`);
                } else {
                    console.log('로비 ID를 찾을 수 없어서 목록 새로고침');
                    // 로비 목록 새로고침
                    this.loadLobbyData();
                }
            }
        );

        try {
            await createLobbyModal.render();
        } catch (error) {
            console.error('로비 생성 모달 렌더링 실패:', error);
            document.body.removeChild(modalContainer);
        }
    }

    destroy(): void {
        this.ui.clearContainer();
    }
}
