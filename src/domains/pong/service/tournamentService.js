import tournamentRepo from '#domains/pong/repo/tournamentRepo.js';

export class tournamentService {
  constructor() {
    /** @type { Map<number, Tournament> } */
    this.tournaments = new Map(); // tournamentId -> Tournament
    this.tournamentInits = new Map();
    /** @type { Map<number, Game> } */
    this.activeTournaments = new Map(); // tournamentId -> tournament

    /** @type { Map<number, NodeJS.Timeout> } */
    this.tournamentIntervals = new Map(); // tournamentId -> intervalId
  }

  addPlayer(tournament, socket, playerId) {
    const player = { id: playerId, socket };
    this.tournaments[tournamentId].addPlayer(player);
    // tournament.players.push(player);
    // tournament.activePlayers.push(player);
    return true;
  }

  async start(tournament) {
    const tournamentId = tournament.tournamentId;

    console.log('Try to start Tournament!');
    const shuffled = [...this.activePlayers].sort(() => Math.random() - 0.5);

    while (shuffled.length >= 2) {
      const left = shuffled.pop();
      const right = shuffled.pop();

      const gameData = await gameRepo.createGame(tournamentId, left.id, right.id, 1, 1);
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
          console.log('🏁 Tournament End!!!');
        } else {
          console.log(`🔁 ${this.tournament.tournament_type} Round End!`);
          console.log(`🚀 ${type} Round Start!`);
          this.start();
        }
      }
    }, 1000);
  }
}
