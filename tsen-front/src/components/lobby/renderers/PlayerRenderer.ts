import { LobbyData, LobbyPlayer } from "../../../types/lobby";
import { UserManager } from "../../../utils/user";

export class PlayerRenderer {
    
    static renderPlayersList(lobbyData: LobbyData, currentUserId: number | null): string {
        // 백엔드 DTO와 프론트엔드 호환성을 위해 players 배열 안전하게 접근
        const players = lobbyData.players || lobbyData.lobby_players || [];
        return players.map((player: LobbyPlayer) => this.renderPlayerItem(player, lobbyData, currentUserId)).join('');
    }

    private static renderPlayerItem(player: LobbyPlayer, lobbyData: LobbyData, currentUserId: number | null): string {
        return `
            <div class="player-item ${player.is_ready ? 'ready' : 'not-ready'}">
                ${this.renderPlayerAvatar(player)}
                ${this.renderPlayerInfo(player)}
                ${this.renderPlayerBadges(player, lobbyData)}
                ${this.renderTransferLeadershipButton(player, lobbyData, currentUserId)}
            </div>
        `;
    }

    private static renderPlayerAvatar(player: LobbyPlayer): string {
        return `
            <div class="player-avatar">
                ${player.user?.profile_image ? 
                    `<img src="${player.user.profile_image}" alt="프로필" class="avatar-img">` : 
                    `<div class="avatar-placeholder">👤</div>`
                }
            </div>
        `;
    }

    private static renderPlayerInfo(player: LobbyPlayer): string {
        const playerName = player.user?.nickname || player.user?.username || 'Unknown';
        const statusText = player.is_ready ? '준비 완료' : '준비 중';
        
        return `
            <div class="player-info">
                <div class="player-name">${playerName}</div>
                <div class="player-status ${player.is_ready ? 'ready' : 'not-ready'}">${statusText}</div>
            </div>
        `;
    }

    private static renderPlayerBadges(player: LobbyPlayer, lobbyData: LobbyData): string {
        const badges = [];
        
        // 백엔드 DTO 호환성을 위해 creator_id와 creatorId 모두 확인
        const creatorId = lobbyData.creator_id || lobbyData.creatorId;
        if (player.user_id === creatorId) {
            badges.push('<span class="host-badge">호스트</span>');
        }
        
        if (player.is_leader) {
            badges.push('<span class="leader-badge">리더</span>');
        }
        
        return `<div class="player-badges">${badges.join('')}</div>`;
    }

    private static renderTransferLeadershipButton(player: LobbyPlayer, lobbyData: LobbyData, currentUserId: number | null): string {
        // 백엔드 DTO 호환성을 위해 creator_id와 creatorId 모두 확인
        const creatorId = lobbyData.creator_id || lobbyData.creatorId;
        const isHost = lobbyData.isHost || (currentUserId === creatorId);
        
        if (isHost && player.user_id !== currentUserId) {
            const playerName = player.user?.nickname || player.user?.username || 'Unknown';
            return `
                <button class="transfer-leadership-btn" 
                        data-user-id="${player.user_id}" 
                        data-username="${playerName}">
                    방장 위임
                </button>
            `;
        }
        return '';
    }

    static renderLobbyInfoGrid(lobbyData: LobbyData): string {
        // 백엔드 DTO 호환성을 위한 필드 접근
        const maxPlayers = lobbyData.max_player || lobbyData.maxPlayers || 2;
        const currentPlayers = lobbyData.currentPlayers || (lobbyData.players || lobbyData.lobby_players || []).length;
        const host = lobbyData.host || lobbyData.creator_nickname || "알 수 없음";
        const createdAt = lobbyData.createdAt || new Date(lobbyData.created_at).toLocaleString("ko-KR");
        
        return `
            <div class="info-grid">
                <div class="info-item">
                    <label>호스트:</label>
                    <span>${host}</span>
                </div>
                <div class="info-item">
                    <label>현재 인원:</label>
                    <span>${currentPlayers}/${maxPlayers}</span>
                </div>
                <div class="info-item">
                    <label>생성 시간:</label>
                    <span>${createdAt}</span>
                </div>
            </div>
        `;
    }

    static getPlayerDisplayName(player: LobbyPlayer): string {
        return player.user?.nickname || player.user?.username || 'Unknown';
    }

    static findPlayerById(players: LobbyPlayer[], userId: number): LobbyPlayer | undefined {
        return players.find(p => p.user_id === userId);
    }

    static getActivePlayers(players: LobbyPlayer[]): LobbyPlayer[] {
        return players.filter(p => p.enabled);
    }

    static areAllPlayersReady(players: LobbyPlayer[]): boolean {
        const activePlayers = this.getActivePlayers(players);
        return activePlayers.length > 0 && activePlayers.every(p => p.is_ready);
    }

    static isCurrentUserReady(players: LobbyPlayer[], currentUserId: number | null): boolean {
        if (!currentUserId) return false;
        const currentPlayer = this.findPlayerById(players, currentUserId);
        return currentPlayer?.is_ready || false;
    }
}
