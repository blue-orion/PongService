import Tournament from '#domains/pong/model/Tournament.js';
import tournamentRepo from '#domains/pong/repo/tournamentRepo.js';
import Game from '#domains/pong/model/Game.js';
import gameRepo from '#domains/pong/repo/gameRepo.js';
import { gameService } from '#domains/pong/service/gameService.js';
import { GameStatus, TournamentStatus, TournamentType } from '@prisma/client';

export class TournamentService {
  constructor() {
    /** @type { Map<number, Tournament> } */
    this.tournaments = new Map(); // tournamentId -> Tournament
    this.tournamentInits = new Map();
    /** @type { Map<number, Game> } */
    this.activeTournaments = new Map(); // tournamentId -> tournament

    /** @type { Map<number, NodeJS.Timeout> } */
    this.tournamentIntervals = new Map(); // tournamentId -> intervalId
  }

  async newConnection(socket, tournamentId, playerId) {
    // TournamentId에 해당하는 토너먼트 정보 로드
    const tournament = await this.getOrConstructTournament(tournamentId);

    // 해당 토너먼트에 유저 추가
    const player = { id: playerId, socket };
    tournament.addPlayer(player);

    // 유저가 모두 접속하면 게임 시작
    if (tournament.isFull()) {
      console.log('tournament start!!');
      this.start(tournamentId); // Tournament 내부에서 Game 객체 생성 및 this.startGame 호출 가능
    } else console.log('waiting players ...');
    return 'success';
  }

  // 새로운 유저 접속 시 토너먼트 로딩 동기화 보장
  // 접속 == 비동기적 이벤트
  // 비동기적으로 생성자 호출 시 여러 개의 객체가 생길 수 있음
  async getOrConstructTournament(tournamentId) {
    // 성공적으로 DB에서 토너먼트 정보를 불러와 객체가 이미 존재
    if (this.tournaments.has(tournamentId)) {
      return this.tournaments.get(tournamentId);
    }

    // 아직 객체를 DB에서 불러오는 중인 경우
    if (this.tournamentInits.has(tournamentId)) {
      return await this.tournamentInits.get(tournamentId);
    }

    // 객체가 존재하지 않아 새롭게 생성해야 하는 경우
    const initPromise = this.initializeTournament(tournamentId);
    this.tournamentInits.set(tournamentId, initPromise);

    const tournament = await initPromise;
    this.tournaments.set(tournamentId, tournament);
    this.tournamentInits.delete(tournamentId);

    return tournament;
  }

  async initializeTournament(tournamentId) {
    const tournamentData = await tournamentRepo.findById(tournamentId);
    if (!tournamentData) {
      throw new Error(`토너먼트 ${tournamentId}를 찾을 수 없습니다.`);
    }

    return new Tournament(tournamentData);
  }

  addPlayer(tournament, socket, playerId) {
    const player = { id: playerId, socket };
    this.tournaments[tournamentId].addPlayer(player);
    // tournament.players.push(player);
    // tournament.activePlayers.push(player);
    return true;
  }

  async start(tournamentId) {
    console.log('Try to start Tournament!');

    const tournament = await this.getOrConstructTournament(tournamentId);

    // 게임 생성 및 시작
    const shuffled = tournament.getShuffledPlayer();
    while (shuffled.length >= 2) {
      const left = shuffled.pop();
      const right = shuffled.pop();

      const gameData = await gameRepo.createGame(tournamentId, left.id, right.id, 1, 1);
      const game = new Game(gameData.id, [left, right]);
      // const game = gameService.createGame();
      tournament.addGame(game);
      gameService.startGame(game);
    }

    // 토너먼트 모니터링 시작
    const intervalId = setInterval(async () => {
      const tournament = this.tournaments.get(tournamentId);
      const activeGames = tournament.getActiveGames();

      for (const game of activeGames) {
        if (game.isGameOver()) {
          tournament.eliminatePlayer(game.loser_id);
          tournament.removeGame(gameId);
        }
      }

      if (!tournament || tournament.isCompleted()) {
        clearInterval(intervalId);

        let type = tournament.type;
        let status = tournament.status;

        if (type === TournamentType.LAST_16) type = TournamentType.QUARTERFINAL;
        else if (type === TournamentType.QUARTERFINAL) type = TournamentType.SEMIFINAL;
        else if (type === TournamentType.SEMIFINAL) type = TournamentType.FINAL;
        else if (type === TournamentType.FINAL) status = TournamentStatus.COMPLETED;

        await tournamentRepo.updateTournament(tournamentId, type, status);

        if (status === TournamentStatus.COMPLETED) {
          console.log('🏁 Tournament End!!!');
        } else {
          console.log(`🔁 ${tournament.type} Round End!`);
          console.log(`🚀 ${type} Round Start!`);
          tournament.updateType(type);
          this.start();
        }
      }
    }, 1000);
  }
}

export const tournamentService = new TournamentService();
