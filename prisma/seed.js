import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const TOURNAMENT_TYPES = ["LAST_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"];

const MAX_PLAYERS = {
  LAST_16: 16,
  QUARTERFINAL: 8,
  SEMIFINAL: 4,
  FINAL: 2,
};

// 유저 생성 generator
function* generateUsers(count = 10) {
  const usedNames = new Set();
  for (let i = 0; i < count; i++) {
    let username;
    do {
      username = faker.internet.username().toLowerCase();
    } while (usedNames.has(username));
    usedNames.add(username);

    yield {
      username,
      passwd: faker.internet.password(),
      nickname: faker.person.fullName(),
    };
  }
}

// 토너먼트 생성 generator
function* generateTournaments() {
  for (const type of TOURNAMENT_TYPES) {
    yield {
      tournament_type: type,
      tournament_status: "PENDING",
      round: 1,
    };
  }
}

// 로비 생성 generator (중복 방지)
function* generateLobbies(tournaments, availableUsers) {
  for (let i = 0; i < tournaments.length; i++) {
    const tournament = tournaments[i];
    const user = availableUsers[i];
    yield {
      tournament_id: tournament.id,
      creator_id: user.id,
      max_player: MAX_PLAYERS[tournament.tournament_type],
      lobby_status: "PENDING",
    };
  }
}

// 로비 플레이어 생성 generator
function* generateLobbyPlayers(lobbies, availableUsers, usersPerLobby = 2) {
  const usedUserIds = new Set();

  for (const lobby of lobbies) {
    const players = [];

    // 로비 인원 수만큼 유저 고르되, 중복 없도록
    for (const user of availableUsers) {
      if (usedUserIds.has(user.id)) continue;

      players.push({
        lobby_id: lobby.id,
        user_id: user.id,
        is_leader: players.length === 0, // 첫 번째 유저가 방장으로 들어감
      });

      usedUserIds.add(user.id);

      if (players.length >= usersPerLobby) break;
    }

    if (players.length < usersPerLobby) {
      console.warn(`Not enough unique users for lobby ${lobby.id}`);
      continue;
    }

    yield* players;
  }
}

async function main() {
  console.log("Seeding start...");

  // 삭제
  await prisma.lobbyPlayer.deleteMany();
  await prisma.lobby.deleteMany();
  await prisma.game.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.user.deleteMany();
  //
  // 1. 유저 생성
  // const userData = [...generateUsers(10)];
  // await prisma.user.createMany({ data: userData });
  // const users = await prisma.user.findMany();
  // console.log(`Created ${users.length} users`);

  // // 2. 토너먼트 생성
  // const tournamentData = [...generateTournaments()];
  // await prisma.tournament.createMany({ data: tournamentData });
  // const tournaments = await prisma.tournament.findMany();
  // console.log(`Created ${tournaments.length} tournaments`);

  // // 3. 로비 생성
  // const lobbyData = [...generateLobbies(tournaments, users)];
  // await prisma.lobby.createMany({ data: lobbyData });
  // const lobbies = await prisma.lobby.findMany();
  // console.log(`Created ${lobbies.length} lobbies`);

  // // 4. 로비 플레이어 생성
  // const lobbyPlayers = [...generateLobbyPlayers(lobbies, users, 2)];
  // await prisma.lobbyPlayer.createMany({ data: lobbyPlayers });
  // console.log(`Added ${lobbyPlayers.length} players to lobbies`);

  // const game = await prisma.game.create({
  //   data: {
  //     tournament_id: tournaments[0].id,
  //     player_one_id: users[0].id,
  //     player_two_id: users[1].id,
  //     player_one_score: 0,
  //     player_two_score: 0,
  //     round: 1,
  //     match: 1,
  //     game_status: "PENDING",
  //     enabled: true,
  //   },
  // });
  // console.log(`Created 1 games`);

  // console.log("Seed data created:", { game });
  console.log("Seeding complete");
}

main()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
