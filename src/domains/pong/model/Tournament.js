import Game from '#domains/pong/model/Game.js';
import gameRepo from '#domains/pong/repo/gameRepo.js';
import gameService from '#domains/pong/service/gameService.js';
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

  isFull() {
    console.log('접속된 Player 수: ', this.players.length);
    const type = this.tournament.tournament_type;
    const playerNumMap = {
      [TournamentType.LAST_16]: 16,
      [TournamentType.QUARTERFINAL]: 8,
      [TournamentType.SEMIFINAL]: 4,
      [TournamentType.FINAL]: 2,
    };
    const playerNum = playerNumMap[type];
    console.log(`Tournament Type: ${type}`);
    console.log(`Tournament Player number: ${playerNum}`);
    return this.players.length === playerNum;
  }

  getInfo() {
    return {
      tournamentId: this.tournamentId,
      players: this.players,
    };
  }
}
