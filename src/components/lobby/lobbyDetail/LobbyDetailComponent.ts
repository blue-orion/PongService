import { Component } from "../../Component";
import { AuthManager } from "../../../utils/auth";
import { LobbyDetailService, LobbyData, SocketEventHandlers } from "./LobbyDetailService";
import { LobbyDetailUI, UIEventHandlers } from "./LobbyDetailUI";

export class LobbyDetailComponent extends Component {
    private lobbyId: string;
    private lobbyData: LobbyData | null = null;
    private isLoading: boolean = false;
    private service: LobbyDetailService;
    private ui: LobbyDetailUI;

    constructor(container: HTMLElement, lobbyId: string) {
        super(container);
        this.lobbyId = lobbyId;
        this.service = new LobbyDetailService(lobbyId);
        this.ui = new LobbyDetailUI(container);
        
        this.setupEventHandlers();
    }

    async render(): Promise<void> {
        this.ui.clearContainer();
        
        console.log('로비 상세 컴포넌트 렌더링 시작..., 로비 ID:', this.lobbyId);
        
        // WebSocket 연결
        await this.initWebSocket();
        
        // 로비 데이터 로드
        await this.loadLobbyData();
        console.log('로비 상세 컴포넌트 렌더링 완료');
    }

    private setupEventHandlers(): void {
        // UI 이벤트 핸들러 설정
        const uiHandlers: UIEventHandlers = {
            onBackToList: () => this.navigateToLobbyList(),
            onToggleReady: () => this.toggleReady(),
            onStartGame: () => this.startGame(),
            onSpectateGame: () => this.spectateGame(),
            onRefresh: () => this.loadLobbyData(),
            onLeaveLobby: () => this.leaveLobby(),
            onTransferLeadership: (targetUserId, targetUsername) => this.transferLeadership(targetUserId, targetUsername),
            onCreateMatch: () => this.createMatch(),
            onViewMatchInfo: () => this.viewMatchInfo(),
            onDebugSocket: () => this.debugSocketConnection(),
            onPlayGame: () => this.playGame()
        };

        this.ui.setEventHandlers(uiHandlers);
    }

    private async initWebSocket(): Promise<void> {
        const socketHandlers: SocketEventHandlers = {
            onReadyStateChange: (data) => this.handleReadyStateChange(data),
            onPlayerChange: (data) => this.handlePlayerChange(data),
            onLobbyUpdate: (data) => this.handleLobbyUpdate(data),
            onLeadershipChange: (data) => this.handleLeadershipChange(data),
            onPlayerLeft: (data) => this.handlePlayerLeft(data),
            onPlayerJoined: (data) => this.handlePlayerJoined(data),
            onMatchCreated: (data) => this.handleMatchCreated(data),
            onConnectionStatusChange: (isConnected, transport) => this.handleConnectionStatusChange(isConnected, transport)
        };

        await this.service.initWebSocket(socketHandlers);
    }

    // 데이터 로드 메서드
    private async loadLobbyData(): Promise<void> {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.ui.showLoadingState();

        try {
            this.lobbyData = await this.service.loadLobbyData();
            
            // 매칭 정보도 함께 조회
            const matchData = await this.service.getMatchInfo();
            if (matchData) {
                this.lobbyData.matchData = matchData;
                console.log('📊 기존 매칭 정보 로드됨:', matchData);
            }
            
            this.ui.renderLobbyDetail(this.lobbyData, this.service.isConnected());
        } catch (error) {
            console.error('로비 데이터 로드 실패:', error);
            this.ui.showErrorState(error instanceof Error ? error.message : '로비 정보를 불러오는데 실패했습니다.');
        } finally {
            this.isLoading = false;
        }
    }

    // Socket 이벤트 핸들러들
    private handleReadyStateChange(data: any): void {
        console.log('🔄 준비 상태 변경 처리 시작:', data);
        
        if (!this.lobbyData || !this.lobbyData.players) {
            console.warn('❌ 로비 데이터가 없어서 준비 상태 변경을 처리할 수 없습니다.');
            return;
        }

        const userId = data.user_id;
        const newReadyState = data.is_ready;
        const playerData = data.player;

        console.log('📊 수신된 준비 상태 데이터:', {
            user_id: userId,
            is_ready: newReadyState,
            lobby_id: data.lobby_id,
            hasPlayerData: !!playerData
        });

        // 해당 플레이어의 준비 상태 업데이트
        const playerIndex = this.lobbyData.players.findIndex((p: any) => p.user_id === userId);
        if (playerIndex !== -1) {
            const oldReadyState = this.lobbyData.players[playerIndex].is_ready;
            
            // 준비 상태 업데이트
            this.lobbyData.players[playerIndex].is_ready = newReadyState;
            
            // 플레이어 데이터가 있으면 전체 정보 업데이트
            if (playerData) {
                console.log('🔄 플레이어 전체 데이터 업데이트:', playerData);
                this.lobbyData.players[playerIndex] = {
                    ...this.lobbyData.players[playerIndex],
                    ...playerData,
                    user: this.lobbyData.players[playerIndex].user
                };
            }
            
            console.log(`👤 플레이어 ${userId}의 준비 상태 변경: ${oldReadyState} → ${newReadyState}`);
            
            // 현재 사용자의 준비 상태 업데이트
            const currentUserId = AuthManager.getCurrentUserId();
            if (userId === currentUserId) {
                const oldUserReadyState = this.lobbyData.isPlayerReady;
                this.lobbyData.isPlayerReady = newReadyState;
                console.log(`🎯 현재 사용자의 준비 상태 업데이트: ${oldUserReadyState} → ${newReadyState}`);
            }
            
            // 모든 플레이어 준비 상태 재계산
            const oldAllReady = this.lobbyData.allPlayersReady;
            this.lobbyData.allPlayersReady = this.lobbyData.players.length > 0 && 
                this.lobbyData.players.every((p: any) => p.is_ready);

            console.log(`📊 모든 플레이어 준비 상태: ${oldAllReady} → ${this.lobbyData.allPlayersReady}`);

            // UI 부분 업데이트
            console.log('🎨 준비 상태 UI 업데이트 시작...');
            this.ui.updatePlayersUI(this.lobbyData);
            this.ui.updateActionButtonsUI(this.lobbyData);
            console.log('✅ 준비 상태 UI 업데이트 완료');
        } else {
            console.warn(`❌ 플레이어 ${userId}를 찾을 수 없습니다.`);
            console.log('🔄 플레이어를 찾을 수 없어 전체 로비 데이터 새로고침');
            this.loadLobbyData();
        }
        
        console.log('✅ 준비 상태 변경 처리 완료');
    }

    private handlePlayerChange(data: any): void {
        console.log('플레이어 변경 처리:', data);
        this.loadLobbyData();
    }

    private handleLobbyUpdate(data: any): void {
        console.log('🎯 WebSocket에서 로비 업데이트 수신:', data);
        this.loadLobbyData();
    }

    private handleLeadershipChange(data: any): void {
        console.log('🔄 방장 위임 처리 시작:', data);
        
        if (!this.lobbyData || !this.lobbyData.players) {
            console.warn('❌ 로비 데이터가 없어서 방장 위임을 처리할 수 없습니다.');
            return;
        }

        const newLeaderId = data.new_leader_id;
        const currentUserId = AuthManager.getCurrentUserId();
        const oldLeaderId = this.lobbyData.creatorId;
        
        console.log('📋 방장 변경 정보:', {
            이전방장: oldLeaderId,
            새방장: newLeaderId,
            현재사용자: currentUserId
        });
        
        // 모든 플레이어의 리더 상태 업데이트
        this.lobbyData.players.forEach((player: any) => {
            const wasLeader = player.is_leader;
            player.is_leader = player.user_id === newLeaderId;
            
            if (wasLeader !== player.is_leader) {
                console.log(`👤 플레이어 ${player.user_id} 리더 상태 변경: ${wasLeader} → ${player.is_leader}`);
            }
        });

        // 새로운 호스트 정보 업데이트
        const newLeader = this.lobbyData.players.find((p: any) => p.user_id === newLeaderId);
        if (newLeader) {
            const oldHost = this.lobbyData.host;
            this.lobbyData.host = newLeader.user?.nickname || newLeader.user?.username || '알 수 없음';
            this.lobbyData.creatorId = newLeaderId;
            this.lobbyData.isHost = currentUserId === newLeaderId;
            
            console.log(`🏆 호스트 정보 업데이트: ${oldHost} → ${this.lobbyData.host} (현재사용자가 호스트: ${this.lobbyData.isHost})`);
        }

        // UI 부분 업데이트
        console.log('🎨 UI 업데이트 시작...');
        this.ui.updatePlayersUI(this.lobbyData);
        this.ui.updateHostInfoUI(this.lobbyData.host);
        this.ui.updateActionButtonsUI(this.lobbyData);
        console.log('✅ UI 업데이트 완료');

        // 방장 변경 알림
        if (currentUserId === newLeaderId) {
            console.log('🎉 현재 사용자가 새로운 방장이 됨');
            alert('🎉 축하합니다! 당신이 새로운 방장이 되었습니다!');
        } else {
            const newLeaderName = newLeader?.user?.nickname || newLeader?.user?.username || '알 수 없음';
            console.log(`📢 다른 사용자가 방장이 됨: ${newLeaderName}`);
            alert(`👑 ${newLeaderName}님이 새로운 방장이 되었습니다.`);
        }
        
        console.log('✅ 방장 위임 처리 완료');
    }

    private handlePlayerLeft(data: any): void {
        console.log('🔄 플레이어 퇴장 처리 시작:', data);
        
        if (!this.lobbyData || !this.lobbyData.players) {
            console.warn('❌ 로비 데이터가 없어서 플레이어 퇴장을 처리할 수 없습니다.');
            return;
        }

        const leftUserId = data.user_id;
        const currentUserId = AuthManager.getCurrentUserId();
        
        console.log('📊 퇴장 이벤트 상세:', {
            leftUserId,
            currentUserId,
            lobbyId: data.lobby_id,
            type: data.type
        });

        // 현재 사용자가 퇴장한 경우
        if (leftUserId === currentUserId) {
            console.log('🚪 현재 사용자가 로비에서 퇴장함');
            // 현재 사용자가 퇴장한 경우 로비 목록으로 이동
            alert('로비에서 퇴장했습니다.');
            if (window.router) {
                window.router.navigate('/');
            }
            return;
        }

        // 다른 플레이어가 퇴장한 경우
        const leftPlayerIndex = this.lobbyData.players.findIndex((p: any) => p.user_id === leftUserId);
        if (leftPlayerIndex !== -1) {
            const leftPlayer = this.lobbyData.players[leftPlayerIndex];
            const leftPlayerName = leftPlayer.user?.nickname || leftPlayer.user?.username || '알 수 없음';
            
            console.log(`👋 플레이어 ${leftPlayerName}(${leftUserId})가 로비에서 퇴장함`);
            
            // 플레이어 목록에서 제거
            this.lobbyData.players.splice(leftPlayerIndex, 1);
            
            // 현재 플레이어 수 업데이트
            this.lobbyData.currentPlayers = this.lobbyData.players.length;
            
            // 모든 플레이어 준비 상태 재계산
            const oldAllReady = this.lobbyData.allPlayersReady;
            this.lobbyData.allPlayersReady = this.lobbyData.players.length > 0 && 
                this.lobbyData.players.every((p: any) => p.is_ready);

            console.log(`📊 플레이어 퇴장 후 상태:`, {
                남은플레이어수: this.lobbyData.currentPlayers,
                모든플레이어준비: `${oldAllReady} → ${this.lobbyData.allPlayersReady}`,
                남은플레이어목록: this.lobbyData.players.map((p: any) => ({
                    user_id: p.user_id,
                    nickname: p.user?.nickname
                }))
            });

            // 퇴장한 플레이어가 호스트였는지 확인
            if (leftUserId === this.lobbyData.creatorId) {
                console.log('🔄 호스트가 퇴장함 - 새로운 호스트 확인 필요');
                // 백엔드에서 새로운 호스트 정보를 포함한 lobby 데이터를 보내주므로 
                // data.lobby가 있으면 해당 정보로 업데이트
                if (data.lobby) {
                    console.log('🔄 백엔드에서 제공한 로비 데이터로 업데이트');
                    this.updateLobbyDataFromSocket(data.lobby);
                } else {
                    // 백엔드 데이터가 없으면 전체 로비 데이터 새로고침
                    console.log('🔄 전체 로비 데이터 새로고침 (호스트 변경 처리)');
                    this.loadLobbyData();
                    return;
                }
            }

            // UI 부분 업데이트
            console.log('🎨 플레이어 퇴장 UI 업데이트 시작...');
            this.ui.updatePlayersUI(this.lobbyData);
            this.ui.updateActionButtonsUI(this.lobbyData);
            
            // 호스트가 변경된 경우 호스트 정보도 업데이트
            if (leftUserId === this.lobbyData.creatorId) {
                this.ui.updateHostInfoUI(this.lobbyData.host);
            }
            
            console.log('✅ 플레이어 퇴장 UI 업데이트 완료');

            // 퇴장 알림 표시
            console.log(`📢 플레이어 퇴장 알림: ${leftPlayerName}님이 로비를 나갔습니다.`);
            // 선택적으로 토스트 알림이나 간단한 메시지 표시
            // alert 대신 더 부드러운 알림 방식을 사용할 수 있습니다.
            
        } else {
            console.warn(`❌ 퇴장한 플레이어 ${leftUserId}를 찾을 수 없습니다.`);
            console.log('🔄 플레이어를 찾을 수 없어 전체 로비 데이터 새로고침');
            this.loadLobbyData();
        }
        
        console.log('✅ 플레이어 퇴장 처리 완료');
    }

    private handlePlayerJoined(data: any): void {
        console.log('🔄 플레이어 입장 처리 시작:', data);
        
        if (!this.lobbyData || !this.lobbyData.players) {
            console.warn('❌ 로비 데이터가 없어서 플레이어 입장을 처리할 수 없습니다.');
            return;
        }

        const joinedUserId = data.user_id;
        const currentUserId = AuthManager.getCurrentUserId();
        const lobbyInfo = data.lobby;
        
        console.log('📊 입장 이벤트 상세:', {
            joinedUserId,
            currentUserId,
            lobbyId: data.lobby_id,
            type: data.type,
            hasLobbyData: !!lobbyInfo
        });

        // 이미 플레이어 목록에 있는지 확인
        const existingPlayerIndex = this.lobbyData.players.findIndex((p: any) => p.user_id === joinedUserId);
        
        if (existingPlayerIndex !== -1) {
            console.log(`👤 플레이어 ${joinedUserId}는 이미 로비에 있습니다. 상태만 업데이트합니다.`);
            
            // 기존 플레이어의 enabled 상태를 true로 변경
            this.lobbyData.players[existingPlayerIndex].enabled = true;
            
            // 로비 정보가 있으면 전체 업데이트
            if (lobbyInfo) {
                this.updateLobbyDataFromSocket(lobbyInfo);
            }
        } else {
            console.log(`🆕 새로운 플레이어 ${joinedUserId}가 로비에 입장했습니다.`);
            
            // 로비 정보에서 새로 입장한 플레이어 찾기
            if (lobbyInfo && lobbyInfo.lobby_players) {
                const newPlayer = lobbyInfo.lobby_players.find((p: any) => 
                    p.user_id === joinedUserId && p.enabled === true
                );
                
                if (newPlayer) {
                    console.log('🎉 새 플레이어 정보:', newPlayer);
                    this.lobbyData.players.push(newPlayer);
                } else {
                    console.warn('❌ 로비 정보에서 새 플레이어를 찾을 수 없습니다.');
                    // 전체 로비 데이터 새로고침
                    this.loadLobbyData();
                    return;
                }
            } else {
                console.warn('❌ 로비 정보가 없어서 전체 데이터를 새로고침합니다.');
                this.loadLobbyData();
                return;
            }
        }

        // 현재 플레이어 수 업데이트
        this.lobbyData.currentPlayers = this.lobbyData.players.filter((p: any) => p.enabled).length;
        
        // 모든 플레이어 준비 상태 재계산
        const oldAllReady = this.lobbyData.allPlayersReady;
        this.lobbyData.allPlayersReady = this.lobbyData.players.length > 0 && 
            this.lobbyData.players.filter((p: any) => p.enabled).every((p: any) => p.is_ready);

        console.log(`📊 플레이어 입장 후 상태:`, {
            총플레이어수: this.lobbyData.currentPlayers,
            모든플레이어준비: `${oldAllReady} → ${this.lobbyData.allPlayersReady}`,
            활성플레이어목록: this.lobbyData.players
                .filter((p: any) => p.enabled)
                .map((p: any) => ({
                    user_id: p.user_id,
                    nickname: p.user?.nickname,
                    is_ready: p.is_ready
                }))
        });

        // UI 부분 업데이트
        console.log('🎨 플레이어 입장 UI 업데이트 시작...');
        this.ui.updatePlayersUI(this.lobbyData);
        this.ui.updateActionButtonsUI(this.lobbyData);
        console.log('✅ 플레이어 입장 UI 업데이트 완료');

        // 입장 알림 표시 (현재 사용자가 아닌 경우에만)
        if (joinedUserId !== currentUserId) {
            const joinedPlayer = this.lobbyData.players.find((p: any) => p.user_id === joinedUserId);
            const joinedPlayerName = joinedPlayer?.user?.nickname || joinedPlayer?.user?.username || '알 수 없음';
            
            console.log(`📢 플레이어 입장 알림: ${joinedPlayerName}님이 로비에 입장했습니다.`);
            // 선택적으로 토스트 알림이나 간단한 메시지 표시
            // alert 대신 더 부드러운 알림 방식을 사용할 수 있습니다.
        }
        
        console.log('✅ 플레이어 입장 처리 완료');
    }

    private handleMatchCreated(data: any): void {
        console.log('🔄 매칭 생성 이벤트 처리 시작:', data);
        
        if (!this.lobbyData) {
            console.warn('❌ 로비 데이터가 없어서 매칭 생성을 처리할 수 없습니다.');
            return;
        }

        // 로비 데이터에 매칭 정보 저장
        this.lobbyData.matchData = data;
        
        console.log('📊 매칭 생성 정보:', {
            tournament_id: data.tournament_id,
            round: data.round,
            total_matches: data.total_matches,
            hasMatches: !!data.matches,
            isCompleted: !!data.message
        });

        // 매칭 결과 UI 표시 (모든 사용자에게)
        this.ui.showMatchResult(data);
        
        // 로비 상태가 변경될 수 있으므로 데이터 새로고침
        this.loadLobbyData();
        
        console.log('✅ 매칭 생성 이벤트 처리 완료');
    }

    private updateLobbyDataFromSocket(socketLobbyData: any): void {
        console.log('🔄 소켓 데이터로 로비 정보 부분 업데이트:', socketLobbyData);
        
        if (!this.lobbyData) return;

        // 호스트 정보 업데이트
        if (socketLobbyData.creator_id) {
            this.lobbyData.creatorId = socketLobbyData.creator_id;
            this.lobbyData.host = socketLobbyData.creator_nickname || '알 수 없음';
            
            const currentUserId = AuthManager.getCurrentUserId();
            this.lobbyData.isHost = currentUserId === socketLobbyData.creator_id;
            
            console.log('🏆 소켓에서 호스트 정보 업데이트:', {
                새호스트ID: socketLobbyData.creator_id,
                새호스트이름: this.lobbyData.host,
                현재사용자가호스트: this.lobbyData.isHost
            });
        }

        // 필요한 경우 다른 로비 정보도 업데이트
        if (socketLobbyData.lobby_status) {
            this.lobbyData.status = socketLobbyData.lobby_status === 'PENDING' ? 'waiting' : 'playing';
            this.lobbyData.statusText = socketLobbyData.lobby_status === 'PENDING' ? '대기 중' : '게임 중';
        }
    }

    private handleConnectionStatusChange(isConnected: boolean, transport?: string): void {
        console.log('🔌 연결 상태 변경:', { connected: isConnected, transport });
        this.ui.updateConnectionStatus(isConnected, transport);
    }

    // UI 이벤트 핸들러들
    private navigateToLobbyList(): void {
        if (window.router) {
            window.router.navigate('/');
        }
    }

    private async toggleReady(): Promise<void> {
        console.log('🔄 준비 상태 토글 시작');
        try {
            // 낙관적 업데이트
            const currentUserId = AuthManager.getCurrentUserId();
            if (currentUserId && this.lobbyData) {
                const currentPlayerIndex = this.lobbyData.players.findIndex((p: any) => p.user_id === currentUserId);
                if (currentPlayerIndex !== -1) {
                    const originalReadyState = this.lobbyData.isPlayerReady;
                    const newReadyState = !this.lobbyData.isPlayerReady;
                    
                    console.log(`🎯 낙관적 UI 업데이트: ${originalReadyState} → ${newReadyState}`);
                    
                    this.lobbyData.players[currentPlayerIndex].is_ready = newReadyState;
                    this.lobbyData.isPlayerReady = newReadyState;
                    this.lobbyData.allPlayersReady = this.lobbyData.players.length > 0 && 
                        this.lobbyData.players.every((p: any) => p.is_ready);
                    
                    // 즉시 UI 업데이트
                    this.ui.updatePlayersUI(this.lobbyData);
                    this.ui.updateActionButtonsUI(this.lobbyData);
                    
                    try {
                        await this.service.toggleReady();
                        console.log('✅ 준비 상태 API 성공');
                    } catch (error) {
                        // API 실패 시 원래 상태로 되돌리기
                        console.error('❌ 준비 상태 API 실패 - 원래 상태로 롤백');
                        this.lobbyData.players[currentPlayerIndex].is_ready = originalReadyState;
                        this.lobbyData.isPlayerReady = originalReadyState;
                        this.lobbyData.allPlayersReady = this.lobbyData.players.length > 0 && 
                            this.lobbyData.players.every((p: any) => p.is_ready);
                        
                        this.ui.updatePlayersUI(this.lobbyData);
                        this.ui.updateActionButtonsUI(this.lobbyData);
                        throw error;
                    }
                }
            }
        } catch (error) {
            console.error('💥 준비 상태 변경 처리 실패:', error);
            const errorMessage = error instanceof Error ? error.message : '준비 상태 변경에 실패했습니다.';
            alert(`❌ ${errorMessage}`);
        }
    }

    private async startGame(): Promise<void> {
        console.log('게임 시작');
        try {
            // TODO: 실제 API 엔드포인트가 있을 때 구현
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
        if (window.router) {
            window.router.navigate(`/game/${this.lobbyId}?mode=spectate`);
        }
    }

    private playGame(): void {
        console.log('게임 참여');
        if (window.router) {
            window.router.navigate(`/game/${this.lobbyId}?mode=play`);
        }
    }

    private async leaveLobby(): Promise<void> {
        if (confirm('정말로 로비를 나가시겠습니까?')) {
            console.log('로비 나가기');
            try {
                await this.service.leaveLobby();
                console.log('로비 나가기 성공');
                
                if (window.router) {
                    window.router.navigate('/');
                }
            } catch (error) {
                console.error('로비 나가기 실패:', error);
                const errorMessage = error instanceof Error ? error.message : '로비 나가기에 실패했습니다.';
                alert(errorMessage);
            }
        }
    }

    private async transferLeadership(targetUserId: number, targetUsername: string): Promise<void> {
        if (confirm(`정말로 ${targetUsername}님에게 방장을 위임하시겠습니까?`)) {
            console.log('🔄 방장 위임 시작:', { targetUserId, targetUsername });
            try {
                await this.service.transferLeadership(targetUserId);
                console.log('✅ 방장 위임 API 성공');
                console.log('⏳ WebSocket 이벤트를 통한 실시간 업데이트 대기 중...');
            } catch (error) {
                console.error('❌ 방장 위임 처리 실패:', error);
                const errorMessage = error instanceof Error ? error.message : '방장 위임에 실패했습니다.';
                alert(`❌ ${errorMessage}`);
            }
        }
    }

    private debugSocketConnection(): void {
        console.log('🔍 === WebSocket 상태 디버깅 ===');
        
        const socketInfo = this.service.getSocketInfo();
        if (!socketInfo) {
            console.log('❌ 소켓이 초기화되지 않았습니다.');
            alert('❌ 소켓이 초기화되지 않았습니다.');
            return;
        }

        console.table(socketInfo);
        
        // 현재 로비 상태 정보
        console.log('📋 현재 로비 상태 정보:', {
            lobbyId: this.lobbyId,
            currentUserId: AuthManager.getCurrentUserId(),
            playersCount: this.lobbyData?.players?.length || 0,
            currentUserReady: this.lobbyData?.isPlayerReady,
            allPlayersReady: this.lobbyData?.allPlayersReady
        });

        alert(`🔍 소켓 상태: ${this.service.isConnected() ? '연결됨' : '연결 안됨'}\n자세한 정보는 콘솔을 확인하세요.`);
    }

    private async createMatch(): Promise<void> {
        if (confirm('매칭을 생성하시겠습니까? 모든 플레이어가 준비되어야 합니다.')) {
            console.log('🔄 매칭 생성 시작');
            try {
                const matchResult = await this.service.createMatch();
                console.log('✅ 매칭 생성 성공:', matchResult);
                
                // 매칭 결과를 로비 데이터에 저장
                if (this.lobbyData) {
                    this.lobbyData.matchData = matchResult;
                }
                
                // 매칭 결과 UI 표시
                this.ui.showMatchResult(matchResult);
                
                // 로비 데이터 새로고침 (상태가 변경될 수 있음)
                await this.loadLobbyData();
                
            } catch (error) {
                console.error('❌ 매칭 생성 실패:', error);
                const errorMessage = error instanceof Error ? error.message : '매칭 생성에 실패했습니다.';
                alert(`❌ ${errorMessage}`);
            }
        }
    }

    private viewMatchInfo(): void {
        if (!this.lobbyData || !this.lobbyData.matchData) {
            alert('매칭 정보가 없습니다.');
            return;
        }

        console.log('🎮 매칭 정보 확인 모달 표시');
        this.ui.showMatchResult(this.lobbyData.matchData);
    }

    destroy(): void {
        // WebSocket 연결 해제
        this.service.disconnect();
        
        this.ui.clearContainer();
    }
}
