import { TournamentRepository } from "#domains/lobby/repo/tournamentRepo.js";
import { LobbyRepository } from "#domains/lobby/repo/lobbyRepo.js";
import PongException from "#shared/exception/pongException.js";
import { TournamentStatus } from "@prisma/client";

export class TournamentService {
  constructor(tournamentRepository = new TournamentRepository(), lobbyRepository = new LobbyRepository()) {
    this.tournamentRepository = tournamentRepository;
    this.lobbyRepository = lobbyRepository;
  }

  async getTournamentById(tournament_id) {
    return await this.tournamentRepository.findById(tournament_id);
  }

  async createTournament(type) {
    // 토너먼트 타입 유효성 검증
    const validTypes = ["LAST_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"];
    if (!validTypes.includes(type)) {
      throw PongException.INVALID_TOURNAMENT_TYPE;
    }

    return await this.tournamentRepository.create(type);
  }

  async startTournament(tournament_id) {
    const tournament = await this.tournamentRepository.findById(tournament_id);
    if (!tournament) throw new Error("해당 토너먼트를 찾을 수 없습니다.");

    if (tournament.tournament_status !== TournamentStatus.PENDING) throw new Error("이미 시작된 토너먼트입니다.");

    return await this.tournamentRepository.updateStatus(tournament_id, TournamentStatus.IN_PROGRESS);
  }

  async completeTournament(tournament_id) {
    const tournament = await this.tournamentRepository.findById(tournament_id);
    if (!tournament) throw new Error("해당 토너먼트를 찾을 수 없습니다.");

    return await this.tournamentRepository.updateStatus(tournament_id, TournamentStatus.COMPLETED);
  }

  // 토너먼트 타입에 따른 최대 플레이어 수 계산
  getMaxPlayersByType(tournament_type) {
    const playerCounts = {
      LAST_16: 16,
      QUARTERFINAL: 8,
      SEMIFINAL: 4,
      FINAL: 2,
    };
    return playerCounts[tournament_type] || 16;
  }

  // 토너먼트 타입과 라운드에 따른 최대 플레이어 수 계산
  getMaxPlayersByRound(tournament_type, round) {
    const initialPlayers = this.getMaxPlayersByType(tournament_type);
    // 각 라운드마다 플레이어 수가 절반으로 줄어듦
    return Math.max(2, initialPlayers / Math.pow(2, round - 1));
  }

  // 토너먼트 타입에 따른 최대 라운드 수 계산
  getMaxRoundsByType(tournament_type) {
    const roundCounts = {
      LAST_16: 4,    // 16강 -> 8강 -> 4강 -> 결승
      QUARTERFINAL: 3, // 8강 -> 4강 -> 결승
      SEMIFINAL: 2,   // 4강 -> 결승
      FINAL: 1,       // 결승
    };
    return roundCounts[tournament_type] || 4;
  }

  async incrementTournamentRound(tournament_id) {
    const tournament = await this.tournamentRepository.findById(tournament_id);
    if (!tournament) throw new Error("해당 토너먼트를 찾을 수 없습니다.");

    return await this.tournamentRepository.incrementRound(tournament_id);
  }

  async checkAndIncrementRoundIfAllGamesCompleted(tournament_id) {
    const tournament = await this.tournamentRepository.findById(tournament_id);
    if (!tournament) throw new Error("해당 토너먼트를 찾을 수 없습니다.");

    // 현재 라운드의 모든 게임이 완료되었는지 확인
    const currentRound = tournament.round;
    const currentRoundGames = tournament.games.filter(game => game.round === currentRound);
    
    if (currentRoundGames.length === 0) {
      console.log(`[TournamentService] No games found for round ${currentRound}`);
      return { tournament, isCompleted: false };
    }

    const completedGames = currentRoundGames.filter(game => game.game_status === 'COMPLETED');
    
    console.log(`[TournamentService] Round ${currentRound}: ${completedGames.length}/${currentRoundGames.length} games completed`);
    
    // 모든 게임이 완료되었으면 라운드 증가 또는 토너먼트 완료
    if (completedGames.length === currentRoundGames.length) {
      console.log(`[TournamentService] All games in round ${currentRound} completed.`);
      
      const maxRounds = this.getMaxRoundsByType(tournament.tournament_type);
      
      // 최대 라운드에 도달했으면 토너먼트 완료
      if (currentRound >= maxRounds) {
        console.log(`[TournamentService] Tournament ${tournament_id} completed!`);
        const completedTournament = await this.completeTournament(tournament_id);
        return { tournament: completedTournament, isCompleted: true };
      } else {
        // 아직 라운드가 남아있으면 라운드 증가
        console.log(`[TournamentService] Incrementing round to ${currentRound + 1}`);
        const updatedTournament = await this.tournamentRepository.incrementRound(tournament_id);
        
        // 새로운 라운드에 맞는 최대 플레이어 수 계산
        const newMaxPlayers = this.getMaxPlayersByRound(tournament.tournament_type, currentRound + 1);
        console.log(`[TournamentService] Calculated new max players: ${newMaxPlayers} for round ${currentRound + 1}`);
        
        // 해당 토너먼트의 로비 찾기 및 최대 인원 업데이트
        console.log(`[TournamentService] Tournament lobbies:`, tournament.lobbies);
        if (tournament.lobbies && tournament.lobbies.length > 0) {
          const lobby = tournament.lobbies[0]; // 첫 번째 로비 (일반적으로 토너먼트당 하나의 로비)
          await this.lobbyRepository.updateMaxPlayer(lobby.id, newMaxPlayers);
          console.log(`[TournamentService] Updated lobby ${lobby.id} max_player to ${newMaxPlayers}`);
        } else {
          console.log(`[TournamentService] No lobbies found for tournament ${tournament_id}`);
        }
        
        return { tournament: updatedTournament, isCompleted: false };
      }
    }
    
    return { tournament, isCompleted: false };
  }
}
