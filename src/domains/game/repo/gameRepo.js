import prisma from "#shared/database/prisma.js";

export async function saveGameState(state) {
	const user1 = await prisma.user.findUnique({ where: { id: 1 }});
	if (!user1) {
		await prisma.user.create({
			data: {
				username: 'Hyuntaek',
				passwd: 'temppassword',
			}
		}); // id = 1
	}
	const user2 = await prisma.user.findUnique({ where: { id: 2 }});
	if (!user2) {
		await prisma.user.create({
			data: {
				username: 'Taeho',
				passwd: 'temppassword',
			}
		}); // id = 2
	}
	const tournament1 = await prisma.tournament.findUnique({ where: { id: 1 }});
	if (!tournament1) {
		await prisma.tournament.create({
			data: {
				tournament_type: 'FINAL',
				tournament_status: 'PENDING'
			}
		}); // id = 1
	}

	if (await prisma.game.findMany({ where: { id : 1 }}))
		return ;
	const game = await prisma.game.create({
		data: {
			tournament_id: 1,
			player_one_id: 1,
			player_two_id: 2,
			winner_id: 1,
			loser_id: 2,
			round: 0,
			match: 1,
			game_status: "COMPLETED",
		},
	})
	console.log('Game state 저장됨:', game);
}
  
export async function loadGameState() {
	const game = await prisma.game.findMany({
		where: { id: 1 },
	});
	console.log('Game state 불러옴:', game);
	return game; // 예시용 dummy
}
