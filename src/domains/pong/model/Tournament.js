import Game from "#domains/pong/model/Game.js";
import gameRepo from "#domains/pong/repo/gameRepo.js";
import { GameStatus, TournamentStatus, TournamentType } from "@prisma/client";
import { gameService } from "#domains/pong/service/gameService.js";

export default class Tournament {
  /** @param { number } tournamentId - 해당되는 토너먼트 ID */
  constructor(tournamentId) {
    this.tournamentId = tournamentId;

    /** @type { Tournament } */
    this.tournament = null;
    /** @type { Game[] } */
    this.games = []; // 진행되는 게임 객체들
    /** @type {{id: number, socket: Socket}[]} */
    this.players = [];
    /** @type {{id: number, socket: Socket}[]} */
    this.activePlayers = [];
  }

  async init() {
    this.tournament = await gameRepo.loadTournament(this.tournamentId);
  }

  addPlayer(socket, playerId) {
    const player = { id: playerId, socket };
    this.players.push(player);
    this.activePlayers.push(player);
    return true;
  }

  isFull() {
    console.log("접속된 Player 수: ", this.players.length);
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

  async start() {
    console.log("Try to start Tournament!");
    const shuffled = [...this.activePlayers].sort(() => Math.random() - 0.5);

    while (shuffled.length >= 2) {
      const left = shuffled.pop();
      const right = shuffled.pop();

      const gameData = await gameRepo.createGame(this.tournamentId, left.id, right.id, 1, 1);
      const game = new Game(gameData.id, [left, right]);
      this.games.push(game);
      gameService.startGame(game);
    }

    const intervalId = setInterval(async () => {
      for (let i = this.games.length - 1; i >= 0; i--) {
        const game = this.games[i];
        const gameRecord = await gameRepo.loadGameState(game.id);

        if (gameRecord.game_status === GameStatus.COMPLETED) {
          const loserId = gameRecord.loser_id;
          this.activePlayers = this.activePlayers.filter((p) => p.id !== loserId);
          this.games.splice(i, 1);
        }
      }

      if (this.games.length === 0) {
        clearInterval(intervalId);
        let type = this.tournament.tournament_type;
        let status = this.tournament.tournament_status;

        if (type === TournamentType.LAST_16) type = TournamentType.QUARTERFINAL;
        else if (type === TournamentType.QUARTERFINAL) type = TournamentType.SEMIFINAL;
        else if (type === TournamentType.SEMIFINAL) type = TournamentType.FINAL;
        else if (type === TournamentType.FINAL) status = TournamentStatus.COMPLETED;

        await gameRepo.updateTournament(this.tournamentId, type, status);

        if (status === TournamentStatus.COMPLETED) {
          console.log("🏁 Tournament End!!!");
        } else {
          console.log(`🔁 ${this.tournament.tournament_type} Round End!`);
          console.log(`🚀 ${type} Round Start!`);
          this.start();
        }
      }
    }, 1000);
  }

  getInfo() {
    return {
      tournamentId: this.tournamentId,
      players: this.players,
    };
  }
}
