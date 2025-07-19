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

// 친구 관계 생성 generator
function* generateFriendships(users, count = 15) {
  const usedPairs = new Set();
  let generated = 0;

  while (generated < count && generated < (users.length * (users.length - 1)) / 2) {
    const sender = faker.helpers.arrayElement(users);
    const receiver = faker.helpers.arrayElement(users);

    // 자기 자신과 친구가 될 수 없음
    if (sender.id === receiver.id) continue;

    // 중복 방지 (A->B와 B->A는 같은 관계)
    const pairKey = [sender.id, receiver.id].sort().join("-");
    if (usedPairs.has(pairKey)) continue;

    usedPairs.add(pairKey);

    // 친구 요청 상태를 랜덤하게 결정
    const status = faker.helpers.arrayElement(["PENDING", "ACCEPTED"]);

    yield {
      sender_id: sender.id,
      receiver_id: receiver.id,
      status: status,
    };

    generated++;
  }
}

// 토너먼트 생성 generator
function* generateTournaments() {
  for (const type of TOURNAMENT_TYPES) {
    yield {
      tournament_type: type,
      tournament_status: "PENDING",
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
  console.log("🚀 Seeding start...\n");

  // 기존 데이터 삭제 (필요한 경우 주석 해제)
  console.log("🗑️  Cleaning existing data...");
  await prisma.friendship.deleteMany();
  await prisma.lobbyPlayer.deleteMany();
  await prisma.lobby.deleteMany();
  await prisma.game.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Existing data cleaned\n");

  // 1. 유저 생성
  console.log("👥 Creating users...");
  const userData = [...generateUsers(2)]; // 친구 관계를 위해 더 많은 유저 생성
  await prisma.user.createMany({ data: userData });
  const users = await prisma.user.findMany();
  console.log(`✅ Created ${users.length} users\n`);

  // 2. 친구 관계 생성
  console.log("🤝 Creating friendships...");
  const friendshipData = [...generateFriendships(users, 1)];
  await prisma.friendship.createMany({ data: friendshipData });
  const friendships = await prisma.friendship.findMany();
  console.log(`✅ Created ${friendships.length} friendships\n`);

  // 친구 관계 통계 출력
  const pendingFriends = await prisma.friendship.count({
    where: { status: "PENDING" },
  });
  const acceptedFriends = await prisma.friendship.count({
    where: { status: "ACCEPTED" },
  });

  console.log("📊 Friendship Statistics:");
  console.log(`   - Pending requests: ${pendingFriends}`);
  console.log(`   - Accepted friends: ${acceptedFriends}`);
  console.log(`   - Total relationships: ${friendships.length}\n`);

  // 3. 토너먼트 생성
  console.log("🏆 Creating tournaments...");
  const tournamentData = [...generateTournaments()];
  await prisma.tournament.createMany({ data: tournamentData });
  const tournaments = await prisma.tournament.findMany();
  console.log(`✅ Created ${tournaments.length} tournaments\n`);

  // 4. 로비 생성
  console.log("🏛️  Creating lobbies...");
  const lobbyData = [...generateLobbies(tournaments, users)];
  await prisma.lobby.createMany({ data: lobbyData });
  const lobbies = await prisma.lobby.findMany();
  console.log(`✅ Created ${lobbies.length} lobbies\n`);

  // 5. 로비 플레이어 생성
  console.log("🎮 Adding players to lobbies...");
  const lobbyPlayers = [...generateLobbyPlayers(lobbies, users, 2)];
  await prisma.lobbyPlayer.createMany({ data: lobbyPlayers });
  console.log(`✅ Added ${lobbyPlayers.length} players to lobbies\n`);

  // 6. 게임 생성 (샘플)
  console.log("🎯 Creating sample games...");
  const game = await prisma.game.create({
    data: {
      tournament_id: tournaments[0].id,
      player_one_id: users[0].id,
      player_two_id: users[1].id,
      player_one_score: faker.number.int({ min: 0, max: 10 }),
      player_two_score: faker.number.int({ min: 0, max: 10 }),
      round: 1,
      match: 1,
      game_status: "COMPLETED",
      enabled: true,
    },
  });
  console.log(`✅ Created 1 sample game\n`);

  // 7. 친구 관계 샘플 출력
  console.log("🔍 Sample friendship data:");
  const sampleFriendships = await prisma.friendship.findMany({
    take: 5,
    include: {
      sender: { select: { username: true, nickname: true } },
      receiver: { select: { username: true, nickname: true } },
    },
  });

  sampleFriendships.forEach((friendship, index) => {
    console.log(
      `   ${index + 1}. ${friendship.sender.username} → ${friendship.receiver.username} (${friendship.status})`
    );
  });

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Summary:");
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Friendships: ${friendships.length}`);
  console.log(`   - Tournaments: ${tournaments.length}`);
  console.log(`   - Lobbies: ${lobbies.length}`);
  console.log(`   - Lobby Players: ${lobbyPlayers.length}`);
  console.log(`   - Games: 1`);
}

main()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
