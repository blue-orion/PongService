import PongException from "#shared/exception/pongException.js";

export class CreateLobbyDto {
    constructor(data) {
        this.tournament_id = this._validateTournamentId(data.tournament_id);
        this.max_player = this._validateMaxPlayer(data.max_player);
        this.creator_id = this._validateCreatorId(data.creator_id);
    }

    _validateTournamentId(tournament_id) {
        if (!tournament_id || isNaN(Number(tournament_id)) || Number(tournament_id) <= 0) {
            throw PongException.INVALID_INPUT("토너먼트 ID");
        }
        return Number(tournament_id);
    }

    _validateMaxPlayer(max_player) {
        if (!max_player || isNaN(Number(max_player)) || Number(max_player) <= 0) {
            throw PongException.INVALID_INPUT("최대 플레이어 수");
        }
        return Number(max_player);
    }

    _validateCreatorId(creator_id) {
        if (!creator_id || isNaN(Number(creator_id)) || Number(creator_id) <= 0) {
            throw PongException.INVALID_INPUT("생성자 ID");
        }
        return Number(creator_id);
    }
}

export class JoinLobbyDto {
    constructor(data) {
        this.lobby_id = this._validateLobbyId(data.lobby_id);
        this.user_id = this._validateUserId(data.user_id);
    }

    _validateLobbyId(lobby_id) {
        if (!lobby_id || isNaN(Number(lobby_id)) || Number(lobby_id) <= 0) {
            throw PongException.INVALID_INPUT("로비 ID");
        }
        return Number(lobby_id);
    }

    _validateUserId(user_id) {
        if (!user_id || isNaN(Number(user_id)) || Number(user_id) <= 0) {
            throw PongException.INVALID_INPUT("사용자 ID");
        }
        return Number(user_id);
    }
}

export class LeaveLobbyDto {
    constructor(data) {
        this.lobby_id = this._validateLobbyId(data.lobby_id);
        this.user_id = this._validateUserId(data.user_id);
    }

    _validateLobbyId(lobby_id) {
        if (!lobby_id || isNaN(Number(lobby_id)) || Number(lobby_id) <= 0) {
            throw PongException.INVALID_INPUT("로비 ID");
        }
        return Number(lobby_id);
    }

    _validateUserId(user_id) {
        if (!user_id || isNaN(Number(user_id)) || Number(user_id) <= 0) {
            throw PongException.INVALID_INPUT("사용자 ID");
        }
        return Number(user_id);
    }
}

export class TransferLeadershipDto {
    constructor(data) {
        this.lobby_id = this._validateLobbyId(data.lobby_id);
        this.current_leader_id = this._validateCurrentLeaderId(data.current_leader_id);
        this.target_user_id = this._validateTargetUserId(data.target_user_id);
    }

    _validateLobbyId(lobby_id) {
        if (!lobby_id || isNaN(Number(lobby_id)) || Number(lobby_id) <= 0) {
            throw PongException.INVALID_INPUT("로비 ID");
        }
        return Number(lobby_id);
    }

    _validateCurrentLeaderId(current_leader_id) {
        if (!current_leader_id || isNaN(Number(current_leader_id)) || Number(current_leader_id) <= 0) {
            throw PongException.INVALID_INPUT("현재 방장 ID");
        }
        return Number(current_leader_id);
    }

    _validateTargetUserId(target_user_id) {
        if (!target_user_id || isNaN(Number(target_user_id)) || Number(target_user_id) <= 0) {
            throw PongException.INVALID_INPUT("대상 사용자 ID");
        }
        return Number(target_user_id);
    }
}

export class ToggleReadyStateDto {
    constructor(data) {
        this.lobby_id = this._validateLobbyId(data.lobby_id);
        this.user_id = this._validateUserId(data.user_id);
    }

    _validateLobbyId(lobby_id) {
        if (!lobby_id || isNaN(Number(lobby_id)) || Number(lobby_id) <= 0) {
            throw PongException.INVALID_INPUT("로비 ID");
        }
        return Number(lobby_id);
    }

    _validateUserId(user_id) {
        if (!user_id || isNaN(Number(user_id)) || Number(user_id) <= 0) {
            throw PongException.INVALID_INPUT("사용자 ID");
        }
        return Number(user_id);
    }
}

export class CreateMatchDto {
    constructor(data) {
        this.lobby_id = this._validateLobbyId(data.lobby_id);
        this.user_id = this._validateUserId(data.user_id);
    }

    _validateLobbyId(lobby_id) {
        if (!lobby_id || isNaN(Number(lobby_id)) || Number(lobby_id) <= 0) {
            throw PongException.INVALID_INPUT("로비 ID");
        }
        return Number(lobby_id);
    }

    _validateUserId(user_id) {
        if (!user_id || isNaN(Number(user_id)) || Number(user_id) <= 0) {
            throw PongException.INVALID_INPUT("사용자 ID");
        }
        return Number(user_id);
    }
}

export class GetLobbyDto {
    constructor(data) {
        this.id = this._validateId(data.id);
    }

    _validateId(id) {
        if (!id || isNaN(Number(id)) || Number(id) <= 0) {
            throw PongException.INVALID_INPUT("로비 ID");
        }
        return Number(id);
    }
}

export class GetLobbiesDto {
    constructor(data) {
        this.page = this._validatePage(data.page);
        this.size = this._validateSize(data.size);
    }

    _validatePage(page) {
        const pageNum = Number(page) || 1;
        if (pageNum <= 0) {
            throw PongException.INVALID_INPUT("페이지 번호");
        }
        return pageNum;
    }

    _validateSize(size) {
        const sizeNum = Number(size) || 10;
        if (sizeNum <= 0 || sizeNum > 100) {
            throw PongException.INVALID_INPUT("페이지 크기");
        }
        return sizeNum;
    }
}

// Response DTOs
export class LobbyResponseDto {
    constructor(lobby) {
        this.id = lobby.id;
        this.tournament_id = lobby.tournament_id;
        this.max_player = lobby.max_player;
        this.lobby_status = lobby.lobby_status;
        this.creator_id = lobby.creator_id;
        this.created_at = lobby.created_at;
        this.updated_at = lobby.updated_at;
        this.tournament = lobby.tournament;
        this.players = lobby.lobby_players?.map(player => new LobbyPlayerResponseDto(player)) || [];
    }
}

export class LobbyPlayerResponseDto {
    constructor(player) {
        this.id = player.id;
        this.user_id = player.user_id;
        this.is_leader = player.is_leader;
        this.is_ready = player.is_ready;
        this.enabled = player.enabled;
        this.user = player.user;
        this.joined_at = player.created_at;
    }
}

export class LobbiesResponseDto {
    constructor(data) {
        this.total = data.total;
        this.page = data.page;
        this.size = data.size;
        this.lobbies = data.lobbies.map(lobby => new LobbyResponseDto(lobby));
    }
}

export class MatchResponseDto {
    constructor(data) {
        this.tournament_id = data.tournament_id;
        this.lobby_id = data.lobby_id;
        this.round = data.round;
        this.total_matches = data.total_matches;
        this.matches = data.matches;
        this.message = data.message;
        this.winner = data.winner;
    }
}