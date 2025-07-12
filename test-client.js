// testClient.js
import { io } from "socket.io-client";
import readline from "readline";

// 🎮 사용자 설정
const PLAYER_ID = 1; // 플레이어 ID 설정
const TOURNAMENT_ID = 1; // 토너먼트 ID 설정

// 🚀 서버에 연결
const socket = io("ws://localhost:3003/ws/game", {
  transports: ["websocket"],
  query: {
    playerId: PLAYER_ID,
    tournamentId: TOURNAMENT_ID,
  },
});

// ✅ 연결 성공 시
socket.on("connect", () => {
  console.log("✅ 연결 성공 (소켓 ID):", socket.id);
  console.log("⌨️ 방향키를 입력하세요 (종료: Ctrl+C)");
});

// 📨 상태 업데이트 수신
socket.on("state", (state) => {
  console.clear();
  console.log("📨 게임 상태:", JSON.stringify(state, null, 2));
});

// 🎉 역할 부여
socket.on("role", ({ role }) => {
  console.log(`🙋 당신의 역할은: ${role.toUpperCase()}`);
});

// 🏁 게임 종료 수신
socket.on("game_over", ({ winner, score }) => {
  console.log("🎮 게임 종료!");
  console.log("🏆 승자:", winner);
  console.log("📊 최종 점수:", score);
});

// ❌ 연결 종료
socket.on("disconnect", () => {
  console.log("❌ 연결이 끊어졌습니다.");
});

// 🔥 오류 발생 시
socket.on("connect_error", (err) => {
  console.error("❌ 연결 오류:", err.message);
});

// ⌨️ 방향키 입력 감지 설정
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

// 🔽 방향키 입력 이벤트 핸들링
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
