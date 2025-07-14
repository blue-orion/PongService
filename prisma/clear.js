import prisma from '#shared/database/prisma.js';

async function clearDatabase() {
  // 자식 테이블부터 삭제 (예시: LobbyPlayer → Lobby → Game → Tournament → User)
  await prisma.lobbyPlayer.deleteMany({});
  await prisma.lobby.deleteMany({});
  await prisma.game.deleteMany({});
  await prisma.tournament.deleteMany({});
  await prisma.user.deleteMany({});
  // 필요시 추가 테이블도 여기에 나열
}

clearDatabase()
  .then(() => {
    console.log('모든 데이터 삭제 완료');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
