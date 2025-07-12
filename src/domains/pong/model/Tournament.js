import Game from './Game.js';
import { loadTournament, loadGameState, createGame, updateTournament } from '../repo/gameRepo.js';
import { GameStatus, TournamentStatus, TournamentType } from '@prisma/client';

export default class Tournament {
	// 클래스 멤버들:
	// - tournamentId: tournament_id 정보
	// - tournament: Tournament 인스턴스 (db 정보 저장)
	// - games: Game[] (진행되는 게임 객체 저장)
	// - players: Player[] (모든 연결된 플레이어)
	// - activePlayers: Player[] (게임에 참여 중인 플레이어)

	/** @param { number } tournamentId - 해당되는 토너먼트 ID */
	constructor(tournamentId) {
		this.tournamentId = tournamentId;

		/** @type { Tournament } */
		this.tournament = null;
		/** @type { Game } */
		this.games = []; // 진행되는 게임들의 game 객체 저장
		/** players에 저장되는 정보는 아래 구조를 가짐
		 * @type {{id: number, socket: Socket}[]} */
		this.players = [];
		/** @type {{id: number, socket: Socket}[]} */
		this.activePlayers = [];
	}

	// 비동기 초기화 분리
	async init() {
		this.tournament = await loadTournament(this.tournamentId);
	}

	// 유저 추가
	addPlayer(socket, playerId) {
		this.players.push({ id: playerId, socket: socket });
		this.activePlayers.push({ id: playerId, socket: socket });
		return true;
	}

	// 모든 유저가 접속하여 시작할 준비가 됐는지 판단
	isFull() {
		console.log('접속된 Player 수: ', this.players.length);
		const type = this.tournament.tournament_type;
		let playerNum = null;

		if (type === TournamentType.LAST_16) playerNum = 16;
		if (type === TournamentType.QUARTERFINAL) playerNum = 8;
		if (type === TournamentType.SEMIFINAL) playerNum = 4;
		if (type === TournamentType.FINAL) playerNum = 2;

		console.log(`Tournament Type: ${type}`);
		console.log(`Tournament Player number: ${playerNum}`);
		if (playerNum === this.players.length) return true;
		return false;
	}

	// 토너먼트 시작 로직
	async start() {
		console.log('Try to start Tournament!');

		// 실제 게임을 진행 할 플레이어 수에 따라 Game 객체 생성
		let playerNum = this.activePlayers.length;
		console.log('PlayerNum: ', playerNum);

		// 방 배정, 왼쪽, 오른쪽 모두 랜덤으로 설정
		while (playerNum) {
			const left = Math.floor(Math.random() * playerNum--);
			const right = Math.floor(Math.random() * playerNum--);
			const game = await createGame(this.tournamentId, this.activePlayers[left].id, this.activePlayers[right].id, 1, 1);
			this.games.push(new Game(game.id, [this.activePlayers[left], this.activePlayers[right]]));
		}

		// Game 객체를 모두 생성 한 이후 일괄적으로 게임 시작
		for (const game of this.games.values()) {
			game.startGame();
		}

		// 모든 게임이 끝났는지를 1초간격으로 DB 확인하여 파악
		const intervalId = setInterval(async () => {
			for (let i = 0; i < this.games.length; i++) {
				console.log('Game Id: ', this.games[i].id);
				const game = await loadGameState(this.games[i].id);
				console.log('Game Status == ', game.game_status);
				// 끝난 게임의 경우 Game 객체 제거 및 패자 activePlayers에서 제거
				if (game.game_status === GameStatus.COMPLETED) {
					const winnerId = game.winner_id;
					const loserId = game.loser_id;

					const index = this.activePlayers.findIndex((player) => player.id === loserId);
					if (index !== -1) {
						this.activePlayers.splice(index, 1);
					}
					this.games.splice(i, 1);
				}
			}
			// 모든 게임이 끝난 경우 토너먼트의 타입에 따라
			// 다음 경기 시작 혹은 완료
			if (this.games.length === 0) {
				clearInterval(intervalId);

				let type = this.tournament.tournament_type;
				let status = this.tournament.tournament_status;

				if (type === TournamentType.LAST_16) type = TournamentType.QUARTERFINAL;
				else if (type === TournamentType.QUARTERFINAL) type = TournamentType.SEMIFINAL;
				else if (type === TournamentType.SEMIFINAL) type = TournamentType.FINAL;
				else if (type === TournamentType.FINAL) status = TournamentStatus.COMPLETED;
				updateTournament(this.tournamentId, type, status);
				if (status === TournamentStatus.COMPLETED) {
					console.log('Tournament End!!!');
				} else {
					console.log(`${this.tournament.tournament_type} Round End!`);
					console.log(`${type} Round Start!`);
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
