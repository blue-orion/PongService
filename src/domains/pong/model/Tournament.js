import Game from '#domains/pong/model/Game.js';
import gameRepo from '#domains/pong/repo/gameRepo.js';
import { gameService } from '#domains/pong/service/gameService.js';
import { GameStatus, TournamentStatus, TournamentType } from '@prisma/client';

export default class Tournament {
  /** @param { number } tournamentId - 해당되는 토너먼트 ID */
  constructor(tournamentData) {
    this.id = tournamentData.id;
    this.type = tournamentData.tournament_type;
    this.status = tournamentData.tournament_status;
    this.createdAt = tournamentData.created_at;
    this.updatedAt = tournamentData.updated_at;

    // 런타임 상태 (DB에 저장되지 않는 임시 상태)
    this.connectedPlayers = [];
    this.activeGames = [];

    /** @type {{id: number, socket: Socket}[]} */
    this.connectedPlayers = [];
    /** @type {{id: number, socket: Socket}[]} */
    this.activePlayers = [];
  }

  async init() {
    this.tournament = await gameRepo.loadTournament(this.tournamentId);
  }

  addPlayer(player) {
    this.connectedPlayers.push(player);
    this.activePlayers.push(player);
  }

  removePlayer(player) {
    this.connectedPlayers = this.connectedPlayers.filter((p) => p.id !== player.id);
  }

  eliminatePlayer(playerId) {
    this.activePlayers = this.activePlayers.filter((p) => p.id !== playerId);
  }

  removeGame(gameId) {
    this.activeGames = this.activeGames.filter((g) => g.id !== gameId);
  }

  isFull() {
    console.log('접속된 Player 수: ', this.connectedPlayers.length);
    const playerNumMap = {
      [TournamentType.LAST_16]: 16,
      [TournamentType.QUARTERFINAL]: 8,
      [TournamentType.SEMIFINAL]: 4,
      [TournamentType.FINAL]: 2,
    };
    const playerNum = playerNumMap[this.type];
    console.log(`Tournament Type: ${this.type}`);
    console.log(`Tournament Player number: ${playerNum}`);
    return this.connectedPlayers.length === playerNum;
  }

  isCompleted() {
    if (this.status === TournamentStatus.COMPLETED || this.activeGames.length === 0) return true;
    return false;
  }

  addGame(game) {
    this.activeGames.push(game);
  }

  updateStatus(status) {
    this.status = status;
  }

  updateType(type) {
    this.type = type;
  }

  getActiveGames() {
    return this.activeGames;
  }

  getShuffledPlayer() {
    const shuffled = [...this.activePlayers].sort(() => Math.random() - 0.5);
    return shuffled;
  }

  getInfo() {
    return {
      tournamentId: this.tournamentId,
      players: this.players,
    };
  }
}
