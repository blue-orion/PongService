import tournamentService from '#domain/pong/service/tournamentService.js';

export class pongService {
  constructor() {}

  async newConnection(socket, tournamentId, playerId) {
    // TournamentId에 해당하는 토너먼트 정보 로드
    const tournament = await this.getOrConstructTournament(tournamentId);

    // 해당 토너먼트에 유저 추가
    tournamentService.addPlayer(tournament, socket, playerId);

    // 유저가 모두 접속하면 게임 시작
    if (tournament[tournamentId].isFull()) {
      console.log('tournament start!!');
      tournamentService.start(tournament); // Tournament 내부에서 Game 객체 생성 및 this.startGame 호출 가능
    } else console.log('waiting players ...');
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
    const tournament = new Tournament(tournamentId);
    const initPromise = tournament.init().then(() => {
      this.tournaments.set(tournamentId, tournament);
      this.tournamentInits.delete(tournamentId);
      return tournament;
    });

    this.tournamentInits.set(tournamentId, initPromise);
    return await initPromise;
  }
}
