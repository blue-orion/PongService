import prisma from '#shared/database/prisma.js';
import { GameStatus, TournamentStatus, TournamentType } from '@prisma/client';

export async function saveGameState(state) {
	const user1 = await prisma.user.findUnique({ where: { id: 1 } });
	if (!user1) {
		await prisma.user.create({
			data: {
				username: 'Hyuntaek',
				passwd: 'temppassword',
			},
		}); // id = 1
	}
	const user2 = await prisma.user.findUnique({ where: { id: 2 } });
	if (!user2) {
		await prisma.user.create({
			data: {
				username: 'Taeho',
				passwd: 'temppassword',
			},
		}); // id = 2
	}
	const tournament1 = await prisma.tournament.findUnique({ where: { id: 1 } });
	if (!tournament1) {
		await prisma.tournament.create({
			data: {
				tournament_type: 'FINAL',
				tournament_status: 'PENDING',
			},
		}); // id = 1
	}

	if (await prisma.game.findMany({ where: { id: 1 } })) return;
	const game = await prisma.game.create({
		data: {
			tournament_id: 1,
			player_one_id: 1,
			player_two_id: 2,
			winner_id: 1,
			loser_id: 2,
			round: 0,
			match: 1,
			game_status: 'COMPLETED',
		},
	});
	console.log('Game state 저장됨:', game);
}

export async function loadGameState(gameId) {
	const game = await prisma.game.findUnique({
		where: { id: gameId },
	});
	console.log('Game state 불러옴:', game);
	return game;
}

export async function loadTournament(tournamentId) {
	console.log('Try to load tournament Id: ', tournamentId);
	const tournament = await prisma.tournament.findUnique({
		where: { id: tournamentId },
	});
	console.log('Tournament Loaded');
	return tournament;
}

export async function updateTournament(tournamentId, tournamentType, tournamentStatus) {
	const exists = await prisma.tournament.findUnique({ where: { id: tournamentId } });

	if (!exists) {
		console.error(`❌ [updateGame] Tournament ID ${tournamentId} not found in DB.`);
		return null;
	}

	return await prisma.tournament.update({
		where: { id: tournamentId },
		data: {
			tournament_status: tournamentStatus,
			tournament_type: tournamentType,
		},
	});
}

export async function createGame(tournamentId, playerOneId, playerTwoId, round = 1, match = 1) {
	// 1. Game 생성 (tournament_id 연결)
	const game = await prisma.game.create({
		data: {
			round,
			match,
			game_status: GameStatus.PENDING,
			tournament: {
				connect: { id: tournamentId },
			},
			player_one: {
				connect: { id: playerOneId },
			},
			player_two: {
				connect: { id: playerTwoId },
			},
		},
	});

	return game;
}

export async function updateGame(gameId, { leftScore, rightScore, winnerId, loserId }) {
	const exists = await prisma.game.findUnique({ where: { id: gameId } });

	if (!exists) {
		console.error(`❌ [updateGame] Game ID ${gameId} not found in DB.`);
		return null;
	}

	return await prisma.game.update({
		where: { id: gameId },
		data: {
			player_one_score: leftScore,
			player_two_score: rightScore,
			winner_id: winnerId,
			loser_id: loserId,
			game_status: GameStatus.COMPLETED,
		},
	});
}
