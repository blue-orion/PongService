import { TournamentRepository } from "#domains/lobby/repo/tournamentRepo.js";

export class TournamentService {
  constructor(tournamentRepository = new TournamentRepository()) {
    this.tournamentRepository = tournamentRepository;
  }

  async getTournamentById(tournament_id) {
    return await this.tournamentRepository.findById(tournament_id);
  }

  async createTournament(type) {
    // 토너먼트 타입 유효성 검증
    const validTypes = ["LAST_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"];
    if (!validTypes.includes(type)) {
      throw new Error("유효하지 않은 토너먼트 타입입니다.");
    }

    return await this.tournamentRepository.create(type);
  }

  async startTournament(tournament_id) {
    const tournament = await this.tournamentRepository.findById(tournament_id);
    if (!tournament) throw new Error("해당 토너먼트를 찾을 수 없습니다.");

    if (tournament.tournament_status !== "PENDING") throw new Error("이미 시작된 토너먼트입니다.");

    return await this.tournamentRepository.updateStatus(tournament_id, "IN_PROGRESS");
  }

  async completeTournament(tournament_id) {
    const tournament = await this.tournamentRepository.findById(tournament_id);
    if (!tournament) throw new Error("해당 토너먼트를 찾을 수 없습니다.");

    return await this.tournamentRepository.updateStatus(tournament_id, "COMPLETED");
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
}
