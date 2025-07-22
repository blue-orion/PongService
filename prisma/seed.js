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

// 게임 생성 generator
function* generateGames(tournaments, users) {
  for (let i = 0; i < 20; i++) {
    yield {
      tournament_id: tournaments[i % tournaments.length].id,
      player_one_id: users[i % users.length].id,
      player_two_id: users[(i + 1) % users.length].id,
      player_one_score: faker.number.int({ min: 0, max: 10 }),
      player_two_score: faker.number.int({ min: 0, max: 10 }),
      round: faker.number.int({ min: 1, max: 5 }),
      match: faker.number.int({ min: 1, max: 10 }),
      game_status: "PENDING",
      enabled: true,
    };
  }
}

// 로비 생성 generator (중복 방지)
function* generateLobbies(tournaments, users) {
  if (tournaments.length === 0 || users.length === 0) {
    throw new Error("Tournaments or users are missing. Cannot generate lobbies.");
  }

  for (let i = 0; i < 20; i++) {
    yield {
      tournament_id: tournaments[i % tournaments.length].id,
      creator_id: users[i % users.length].id,
      max_player: MAX_PLAYERS[tournaments[i % tournaments.length].tournament_type],
      lobby_status: "PENDING",
    };
  }
}

// 로비 플레이어 생성 generator
function* generateLobbyPlayers(lobbies, users) {
  for (let i = 0; i < 20; i++) {
    yield {
      lobby_id: lobbies[i % lobbies.length].id,
      user_id: users[i % users.length].id,
      is_leader: i % 2 === 0, // 짝수 번째 유저를 방장으로 설정
    };
  }
}

// 친구 관계 생성 generator
function* generateFriendships(users) {
  const usedPairs = new Set();

  for (let senderIndex = 0; senderIndex < users.length; senderIndex++) {
    for (let i = 1; i <= 3; i++) {
      // 각 유저가 최대 3명의 친구를 가질 수 있도록 설정
      const receiverIndex = (senderIndex + i) % users.length;

      // 중복된 관계 방지
      const pairKey = `${users[senderIndex].id}-${users[receiverIndex].id}`;
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);

      yield {
        sender_id: users[senderIndex].id,
        receiver_id: users[receiverIndex].id,
        status: "ACCEPTED", // 상태는 PENDING, ACCEPTED 등으로 설정 가능
      };
    }
  }
}

async function addFriendshipsForUser(userId, users) {
  const usedPairs = new Set();
  const friendships = [];

  for (let i = 0; i < 6; i++) {
    const friendIndex = (userId + i) % users.length; // 유저 리스트에서 친구 선택

    // 중복된 관계 방지
    const pairKey = `${userId}-${users[friendIndex].id}`;
    if (usedPairs.has(pairKey) || users[friendIndex].id === userId) continue;
    usedPairs.add(pairKey);

    friendships.push({
      sender_id: userId,
      receiver_id: users[friendIndex].id,
      status: "PENDING", // 상태를 PENDING으로 설정
    });
  }

  await prisma.friendship.createMany({ data: friendships });
  console.log(`Added ${friendships.length} PENDING friendships for user ${userId}`);
}
async function addFriendshipsForReceiver(receiverId, users) {
  const usedPairs = new Set();
  const friendships = [];

  for (let i = 0; i < 3; i++) {
    const senderIndex = (receiverId + i) % users.length; // 유저 리스트에서 발신자 선택

    // 중복된 관계 방지
    const pairKey = `${users[senderIndex].id}-${receiverId}`;
    if (usedPairs.has(pairKey) || users[senderIndex].id === receiverId) continue;
    usedPairs.add(pairKey);

    friendships.push({
      sender_id: users[senderIndex].id,
      receiver_id: receiverId,
      status: "PENDING", // 상태를 PENDING으로 설정
    });
  }

  await prisma.friendship.createMany({ data: friendships });
  console.log(`Added ${friendships.length} PENDING friendships for receiver ${receiverId}`);
}

async function main() {
  console.log("Seeding start...");

  // 참조 관계를 가진 테이블의 데이터를 먼저 삭제
  await prisma.game.deleteMany();
  await prisma.lobbyPlayer.deleteMany();
  await prisma.lobby.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.friendship.deleteMany();

  // 마지막으로 user 데이터를 삭제
  await prisma.user.deleteMany();

  // 1. 유저 생성
  const userData = [...generateUsers(20)];
  await prisma.user.createMany({ data: userData });
  const users = await prisma.user.findMany();
  console.log(`Created ${users.length} users`);

  // 2. 토너먼트 생성
  const tournamentData = [...generateTournaments()];
  await prisma.tournament.createMany({ data: tournamentData });
  const tournaments = await prisma.tournament.findMany();
  console.log(`Created ${tournaments.length} tournaments`);

  if (users.length === 0) {
    throw new Error("No users found. Ensure users are created before creating related data.");
  }

  if (tournaments.length === 0) {
    throw new Error("No tournaments found. Ensure tournaments are created before creating related data.");
  }

  // 3. 친구 관계 생성
  const friendshipData = [...generateFriendships(users)];
  await prisma.friendship.createMany({ data: friendshipData });
  const friendships = await prisma.friendship.findMany();
  console.log(`Created ${friendships.length} friendships`);

  // 4. 로비 생성
  const lobbyData = [...generateLobbies(tournaments, users)];
  await prisma.lobby.createMany({ data: lobbyData });
  const lobbies = await prisma.lobby.findMany();
  console.log(`Created ${lobbies.length} lobbies`);

  // 5. 로비 플레이어 생성
  const lobbyPlayers = [...generateLobbyPlayers(lobbies, users)];
  await prisma.lobbyPlayer.createMany({ data: lobbyPlayers });
  console.log(`Added ${lobbyPlayers.length} players to lobbies`);

  // 6. 게임 생성
  const gameData = [...generateGames(tournaments, users)];
  await prisma.game.createMany({ data: gameData });
  console.log(`Created ${gameData.length} games`);

  // 추가: 각 유저에 대해 친구 관계 추가
  for (const user of users) {
    await addFriendshipsForUser(user.id, users);
  }

  // console.log("Adding PENDING friendships for receiver 74...");

  // // 유저 데이터 가져오기
  // const users = await prisma.user.findMany();
  // const targetReceiverId = 74;

  // // 친구 관계 추가
  // await addFriendshipsForReceiver(targetReceiverId, users);

  // console.log("Friendships added successfully.");
}

main()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
