import prisma from '#shared/database/prisma.js';
import { GameStatus, TournamentStatus, TournamentType } from '@prisma/client';

async function main() {
  // 1. 유저 2명 생성
  const user1 = await prisma.user.create({
    data: {
      username: 'user1',
      passwd: 'password1',
      nickname: 'hyuntaek',
      enabled: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'user2',
      passwd: 'password2',
      nickname: 'babo멍청이',
      enabled: true,
    },
  });

  // 2. 토너먼트 1개 생성
  const tournament = await prisma.tournament.create({
    data: {
      tournament_type: 'FINAL',
      tournament_status: 'PENDING',
      enabled: true,
    },
  });

  // 3. 게임 1개 생성 (user1 vs user2, 해당 토너먼트에 소속)
  const game = await prisma.game.create({
    data: {
      tournament_id: tournament.id,
      player_one_id: user1.id,
      player_two_id: user2.id,
      player_one_score: 0,
      player_two_score: 0,
      round: 1,
      match: 1,
      game_status: 'PENDING',
      enabled: true,
    },
  });

  console.log('Seed data created:', { user1, user2, tournament, game });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
