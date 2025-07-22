import { LobbyItem, PaginationInfo } from "./LobbyListService";

export interface UIEventHandlers {
  onCreateLobby: () => void;
  onJoinLobby: (lobbyId: number) => void;
  onEnterLobby: (lobbyId: number) => void;
  onSpectateLobby: (lobbyId: number) => void;
  onFilterChange: (status: string, search: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onRetry: () => void;
}

export class LobbyListUI {
  private container: HTMLElement;
  private handlers: UIEventHandlers | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  setEventHandlers(handlers: UIEventHandlers): void {
    this.handlers = handlers;
  }

  showLoadingState(): void {
    const lobbyGrid = this.container.querySelector("#lobby-grid");
    if (lobbyGrid) {
      lobbyGrid.innerHTML = `
                <div class="loading-state">
                    <p>로비 목록을 불러오는 중...</p>
                </div>
            `;
    }
  }

  showErrorState(): void {
    const lobbyGrid = this.container.querySelector("#lobby-grid");
    if (lobbyGrid) {
      lobbyGrid.innerHTML = `
                <div class="error-state">
                    <p>로비 목록을 불러오는데 실패했습니다.</p>
                    <button class="retry-btn">다시 시도</button>
                </div>
            `;

      // 재시도 버튼 이벤트 리스너
      const retryBtn = lobbyGrid.querySelector(".retry-btn");
      if (retryBtn && this.handlers) {
        retryBtn.addEventListener("click", this.handlers.onRetry);
      }
    }
  }

  showEmptyState(): void {
    const lobbyGrid = this.container.querySelector("#lobby-grid");
    if (lobbyGrid) {
      lobbyGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎮</div>
                    <h3>생성된 로비가 없습니다</h3>
                    <p>새로운 게임 로비를 만들어 보세요!</p>
                    <button class="create-lobby-btn-empty">
                        새 로비 만들기
                    </button>
                </div>
            `;

      // 빈 상태의 새 로비 만들기 버튼 이벤트 리스너
      const createBtn = lobbyGrid.querySelector(".create-lobby-btn-empty");
      if (createBtn && this.handlers) {
        createBtn.addEventListener("click", this.handlers.onCreateLobby);
      }
    }
  }

  renderLobbyData(lobbies: LobbyItem[]): void {
    const lobbyGrid = this.container.querySelector("#lobby-grid");
    if (!lobbyGrid) return;

    // 로비 카드들 생성
    lobbyGrid.innerHTML = lobbies
      .map(
        (lobby: LobbyItem) => `
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
                ${this.renderLobbyButton(lobby)}
            </div>
        `
      )
      .join("");

    // 로비 카드 이벤트 리스너 설정
    this.setupLobbyCardEvents();
  }

  private renderLobbyButton(lobby: LobbyItem): string {
    if (lobby.status === "waiting") {
      if (lobby.isCurrentUserInLobby) {
        return `<button class="enter-btn" data-lobby-id="${lobby.id}">참여 중인 로비 - 입장</button>`;
      } else {
        return `<button class="join-btn" data-lobby-id="${lobby.id}">입장하기</button>`;
      }
    } else {
      // playing 상태일 때
      if (lobby.isCurrentUserInLobby) {
        return `<button class="enter-btn" data-lobby-id="${lobby.id}">게임 참여</button>`;
      } else {
        return `<button class="spectate-btn" data-lobby-id="${lobby.id}">관전하기</button>`;
      }
    }
  }

  private setupLobbyCardEvents(): void {
    if (!this.handlers) return;

    // 입장 버튼들 (새로 입장)
    const joinBtns = this.container.querySelectorAll(".join-btn");
    joinBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const lobbyId = target.getAttribute("data-lobby-id");
        if (lobbyId && this.handlers) {
          this.handlers.onJoinLobby(parseInt(lobbyId));
        }
      });
    });

    // 입장 버튼들 (이미 참여 중인 로비)
    const enterBtns = this.container.querySelectorAll(".enter-btn");
    enterBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const lobbyId = target.getAttribute("data-lobby-id");
        if (lobbyId && this.handlers) {
          this.handlers.onEnterLobby(parseInt(lobbyId));
        }
      });
    });

    // 관전 버튼들
    const spectateBtns = this.container.querySelectorAll(".spectate-btn");
    spectateBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const lobbyId = target.getAttribute("data-lobby-id");
        if (lobbyId && this.handlers) {
          this.handlers.onSpectateLobby(parseInt(lobbyId));
        }
      });
    });
  }

  updatePaginationInfo(pagination: PaginationInfo): void {
    const paginationInfo = this.container.querySelector("#pagination-info");
    if (paginationInfo) {
      const startItem = (pagination.currentPage - 1) * pagination.pageSize + 1;
      const endItem = Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems);
      paginationInfo.textContent = `${startItem}-${endItem} / 총 ${pagination.totalItems}개의 로비`;
    }
  }

  updatePaginationControls(pagination: PaginationInfo): void {
    // 이전/다음 버튼 상태 업데이트
    const prevBtn = this.container.querySelector("#prev-page") as HTMLButtonElement;
    const nextBtn = this.container.querySelector("#next-page") as HTMLButtonElement;

    if (prevBtn) {
      prevBtn.disabled = pagination.currentPage <= 1;
    }

    if (nextBtn) {
      nextBtn.disabled = pagination.currentPage >= pagination.totalPages;
    }

    // 페이지 번호 버튼들 생성
    this.renderPageNumbers(pagination);
  }

  private renderPageNumbers(pagination: PaginationInfo): void {
    const pageNumbers = this.container.querySelector("#page-numbers");
    if (!pageNumbers) return;

    const startPage = Math.max(1, pagination.currentPage - 2);
    const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);

    let pageButtonsHTML = "";

    for (let i = startPage; i <= endPage; i++) {
      pageButtonsHTML += `
                <button class="page-number ${i === pagination.currentPage ? "active" : ""}" data-page="${i}">
                    ${i}
                </button>
            `;
    }

    pageNumbers.innerHTML = pageButtonsHTML;

    // 페이지 번호 클릭 이벤트
    pageNumbers.querySelectorAll(".page-number").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const page = parseInt(target.getAttribute("data-page") || "1");
        if (this.handlers) {
          this.handlers.onPageChange(page);
        }
      });
    });
  }

  setupMainEventListeners(): void {
    if (!this.handlers) return;

    // 새 로비 만들기 버튼
    const createLobbyBtn = this.container.querySelector(".create-lobby-btn");
    if (createLobbyBtn) {
      createLobbyBtn.addEventListener("click", this.handlers.onCreateLobby);
    }

    // 필터 이벤트
    const statusFilter = this.container.querySelector(".status-filter") as HTMLSelectElement;
    const searchInput = this.container.querySelector(".search-input") as HTMLInputElement;

    if (statusFilter) {
      statusFilter.addEventListener("change", () => {
        const searchValue = searchInput?.value || "";
        this.handlers!.onFilterChange(statusFilter.value, searchValue);
      });
    }

    if (searchInput) {
      let searchTimeout: number;
      searchInput.addEventListener("input", () => {
        // 디바운싱: 300ms 후에 검색 실행
        clearTimeout(searchTimeout);
        searchTimeout = window.setTimeout(() => {
          const statusValue = statusFilter?.value || "all";
          this.handlers!.onFilterChange(statusValue, searchInput.value);
        }, 300);
      });
    }

    // 페이징 이벤트
    const prevBtn = this.container.querySelector("#prev-page");
    const nextBtn = this.container.querySelector("#next-page");
    const pageSizeSelect = this.container.querySelector("#page-size") as HTMLSelectElement;

    if (prevBtn) {
      prevBtn.addEventListener("click", this.handlers.onPreviousPage);
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", this.handlers.onNextPage);
    }

    if (pageSizeSelect) {
      pageSizeSelect.addEventListener("change", () => {
        const newPageSize = parseInt(pageSizeSelect.value);
        this.handlers!.onPageSizeChange(newPageSize);
      });
    }
  }

  getFilterValues(): { status: string; search: string } {
    const statusFilter = this.container.querySelector(".status-filter") as HTMLSelectElement;
    const searchInput = this.container.querySelector(".search-input") as HTMLInputElement;

    return {
      status: statusFilter?.value || "all",
      search: searchInput?.value || "",
    };
  }

  clearContainer(): void {
    this.container.innerHTML = "";
  }
}
