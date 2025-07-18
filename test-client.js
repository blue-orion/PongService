// testClient.js
import { io } from "socket.io-client";
import readline from "readline";

const PLAYER_ID = 2;
const TOURNAMENT_ID = 1;
const GAME_ID = 1;

const socket = io("http://localhost:3333/ws/game", {
	withCredentials: true,
	transports: ['websocket', 'polling'],
  auth: {
		gameId: 1,
    playerId: PLAYER_ID,
    tournamentId: TOURNAMENT_ID,
  },
});

socket.on("connect", () => {
  console.log("✅ 연결 성공 (소켓 ID):", socket.id);
  console.log("⌨️ 방향키를 입력하세요 (종료: Ctrl+C)");
});

socket.on("state", (state) => {
  console.clear();
  console.log("📨 게임 상태:", JSON.stringify(state, null, 2));
});

socket.on("role", ({ role }) => {
  console.log(`🙋 당신의 역할은: ${role.toUpperCase()}`);
});

socket.on("game_over", ({ winner, score }) => {
  console.log("🎮 게임 종료!");
  console.log("🏆 승자:", winner);
  console.log("📊 최종 점수:", score);
});

socket.on("disconnect", () => {
  console.log("❌ 연결이 끊어졌습니다.");
});

socket.on("connect_error", (err) => {
  console.error("❌ 연결 오류:", err.message);
});

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on("keypress", (str, key) => {
  if (key.ctrl && key.name === "c") {
    console.log("👋 종료합니다.");
    process.exit();
  }

  if (["up", "down"].includes(key.name)) {
    console.log(`📤 이동 명령 전송: ${key.name}`);
    socket.emit("message", {
      type: "move",
      direction: key.name,
    });
  }
});
