// import WebSocket from 'ws';
// const ws = new WebSocket('ws://localhost:3003/ws/game');

import { io } from "socket.io-client";

const socket = io("ws://localhost:3003/ws/game", {
  query: { playerId: 2 },
});

socket.on("connect", () => {
  console.log("✅ 연결 성공");
  console.log(socket.id);
  socket.emit("message", {
    type: "new",
    msg: "Hi Server!",
  });
});

socket.on("state", (msg) => {
  console.log("📨 받은 메시지:", msg);
});

socket.on("disconnect", () => {
  console.log("❌ 연결 종료");
});

socket.on("error", (err) => {
  console.error("❌ 오류 발생:", err.message);
});

import readline from "readline";

// 터미널 입력을 받도록 설정
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on("keypress", (str, key) => {
  // 방향키 입력 처리
  if (key.name === "up") {
    console.log("위 방향키 입력");
    socket.emit("message", {
      type: "move",
      msg: "up",
    });
  } else if (key.name === "down") {
    console.log("아래 방향키 입력");
    socket.emit("message", {
      type: "move",
      msg: "down",
    });
  } else if (key.name === "left") {
    console.log("왼쪽 방향키 입력");
    socket.emit("message", {
      type: "move",
      msg: "left",
    });
  } else if (key.name === "right") {
    console.log("오른쪽 방향키 입력");
    socket.emit("message", {
      type: "move",
      msg: "right",
    });
  } else if (key.ctrl && key.name === "c") {
    // Ctrl+C 입력 시 프로그램 종료
    process.exit();
  }
});

console.log("방향키를 눌러보세요 (종료하려면 Ctrl+C)");
