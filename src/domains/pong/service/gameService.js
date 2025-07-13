import Tournament from '#domains/pong/model/Tournament.js';
import gameRepo from '#domains/pong/repo/gameRepo.js';

export class GameService {
  // 클래스 멤버들:
  // - tournaments: 진행중인 토너먼트 객체 저장
  // - tournamentInits: 비동기적 연결 요청 시 동기화 보장
  // - activeGames: 각 토너먼트 내 게임 ID → Game 객체 저장
  // - gameIntervals: 게임 진행 중 setInterval 관리용
  //
  /** @constructor */
  constructor() {
    /** @type { Map<number, Game> } */
    this.activeGames = new Map(); // gameId -> Game

    /** @type { Map<number, NodeJS.Timeout> } */
    this.gameIntervals = new Map(); // gameId -> intervalId
  }

  // async newConnection(socket, tournamentId, playerId) {
  //   // TournamentId에 해당하는 토너먼트 정보 로드
  //   const tournament = await this.getOrConstructTournament(tournamentId);
  //
  //   // 해당 토너먼트에 유저 추가
  //   const status = tournament.addPlayer(socket, playerId);
  //
  //   // 유저가 모두 접속하면 게임 시작
  //   if (tournament.isFull()) {
  //     console.log('tournament start!!');
  //     tournament.start(); // Tournament 내부에서 Game 객체 생성 및 this.startGame 호출 가능
  //   } else console.log('waiting players ...');
  //   return status;
  // }

  // 새로운 유저 접속 시 토너먼트 로딩 동기화 보장
  // 접속 == 비동기적 이벤트
  // 비동기적으로 생성자 호출 시 여러 개의 객체가 생길 수 있음
  // async getOrConstructTournament(tournamentId) {
  //   // 성공적으로 DB에서 토너먼트 정보를 불러와 객체가 이미 존재
  //   if (this.tournaments.has(tournamentId)) {
  //     return this.tournaments.get(tournamentId);
  //   }
  //
  //   // 아직 객체를 DB에서 불러오는 중인 경우
  //   if (this.tournamentInits.has(tournamentId)) {
  //     return await this.tournamentInits.get(tournamentId);
  //   }
  //
  //   // 객체가 존재하지 않아 새롭게 생성해야 하는 경우
  //   const tournament = new Tournament(tournamentId);
  //   const initPromise = tournament.init().then(() => {
  //     this.tournaments.set(tournamentId, tournament);
  //     this.tournamentInits.delete(tournamentId);
  //     return tournament;
  //   });
  //
  //   this.tournamentInits.set(tournamentId, initPromise);
  //   return await initPromise;
  // }

  handleMove(gameId, role, direction) {
    const game = this.activeGames.get(gameId);
    if (!game) return;
    game.movePaddle(role, direction);
  }

  getState(gameId) {
    const game = this.activeGames.get(gameId);
    if (!game) return null;
    return game.getState();
  }

  stopGame(gameId) {
    const intervalId = this.gameIntervals.get(gameId);
    if (intervalId) {
      clearInterval(intervalId);
      this.gameIntervals.delete(gameId);
    }
  }

  // finish and startGame are service logic
  async finishGame(game) {
    const score = game.state.getScore();
    const winnerRole = score.left >= 10 ? 'left' : 'right';
    const winnerId = winnerRole === 'left' ? game.players[0].id : game.players[1].id;
    const loserId = winnerRole === 'left' ? game.players[1].id : game.players[0].id;

    await gameRepo.updateGameResult(game.id, score, winnerId, loserId);

    game.players.forEach((player) =>
      player.socket.emit('game_over', {
        winner: winnerRole,
        score,
      })
    );

    // 게임 데이터 정리
    this.activeGames.delete(game.id);
    this.stopGame(game.id);
  }

  startGame(game) {
    game.players[0].socket.emit('role', { role: 'left' });
    game.players[1].socket.emit('role', { role: 'right' });

    this.activeGames.set(game.id, game);

    const intervalId = setInterval(async () => {
      if (game.isGameOver()) {
        clearInterval(intervalId);
        await this.finishGame(game);
      } else {
        game.state.updateBall();
        const state = game.getState();
        game.players.forEach((player) => {
          player.socket.emit('state', state);
        });
      }
    }, 1000 / 60);

    this.gameIntervals.set(game.id, intervalId);
  }
}

export const gameService = new GameService();
