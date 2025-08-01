import websocketManager from "#shared/websocket/websocketManager.js";
import { gameController } from "#domains/game/controller/gameController.js";

const websocketHandlers = {
  gameWebSocketHandler: (io) => {
    const gameNamespace = io.of("/ws/game"); // 게임 네임스페이스 생성
    websocketManager.registerNamespace("game", gameNamespace);

    gameNamespace.on("connection", async (socket) => {
      const userId = socket.handshake.auth["playerId"];
      const result = await gameController.handleConnect(socket); // 클라이언트에서 보낸 사용자 ID

      if (result === false) {
        socket.disconnect("io client disconnect");
        return;
      }

      console.log(`Game WebSocket connected: ${userId}`);

      // 사용자 소켓 등록
      websocketManager.addUserSocket(Number(userId), "game", socket);

      socket.on("move", (raw) => {
        gameController.handleMoveEvent(socket, raw);
      });

      socket.on("disconnect", () => {
        websocketManager.removeUserSocket(userId, "game");
        gameController.handleDisconnect(socket);
        console.log(`Game WebSocket disconnected: ${userId}`);
      });
    });
  },

  lobbyWebSocketHandler: (io) => {
    const lobbyNamespace = io.of("/ws/lobby"); // 로비 네임스페이스 생성
    websocketManager.registerNamespace("lobby", lobbyNamespace);

    lobbyNamespace.on("connection", (socket) => {
      const { userId, lobbyId, username } = socket.handshake.auth;

      console.log(`Lobby WebSocket connected: ${userId} (lobby: ${lobbyId})`);

      // 사용자 소켓 등록
      websocketManager.addUserSocket(Number(userId), "lobby", socket);

      if (lobbyId && lobbyId !== "undefined") {
        socket.join(`lobby-${lobbyId}`);
        console.log(`User ${userId} joined room lobby-${lobbyId}`);

        // 로비에 새 사용자 입장 알림
        socket.to(`lobby-${lobbyId}`).emit("user:connected", {
          user_id: userId,
          lobby_id: lobbyId,
          username,
          message: `${username}가 로비에 접속했습니다.`,
        });
      }

      // 로비 변경 이벤트 처리
      socket.on("join-lobby", (data) => {
        const { lobby_id } = data;
        if (lobby_id) {
          socket.join(`lobby-${lobby_id}`);
          console.log(`User ${userId} joined room lobby-${lobby_id}`);
        }
      });

      // 로비 나가기 이벤트 처리
      socket.on("leave-lobby", (data) => {
        const { lobby_id } = data;
        if (lobby_id) {
          socket.leave(`lobby-${lobby_id}`);
          console.log(`User ${userId} left room lobby-${lobby_id}`);
        }
      });

      // 채팅 메시지 전송 이벤트 처리
      socket.on("chat:message", (data) => {
        const { lobby_id, message, username } = data;

        if (!lobby_id || !message || message.trim() === "") {
          socket.emit("chat:error", { error: "Invalid message data" });
          return;
        }

        // 메시지 길이 제한 (예: 500자)
        if (message.length > 500) {
          socket.emit("chat:error", { error: "Message too long" });
          return;
        }

        const chatData = {
          user_id: userId,
          username: username || `User${userId}`,
          message: message.trim(),
          lobby_id: lobby_id,
          timestamp: new Date().toISOString(),
        };

        // 같은 로비의 모든 사용자에게 메시지 브로드캐스트 (본인 포함)
        lobbyNamespace.to(`lobby-${lobby_id}`).emit("chat:message", chatData);

        console.log(`Chat message in lobby ${lobby_id} from user ${userId}: ${message}`);
      });

      // 사용자가 현재 타이핑 중임을 알리는 이벤트
      socket.on("chat:typing", (data) => {
        const { lobby_id, username } = data;

        if (!lobby_id) return;

        // 본인을 제외한 같은 로비의 사용자들에게 타이핑 상태 전송
        socket.to(`lobby-${lobby_id}`).emit("chat:typing", {
          user_id: userId,
          username: username || `User${userId}`,
          lobby_id: lobby_id,
        });
      });

      // 사용자가 타이핑을 중단했음을 알리는 이벤트
      socket.on("chat:stop-typing", (data) => {
        const { lobby_id, username } = data;

        if (!lobby_id) return;

        // 본인을 제외한 같은 로비의 사용자들에게 타이핑 중단 상태 전송
        socket.to(`lobby-${lobby_id}`).emit("chat:stop-typing", {
          user_id: userId,
          username: username || `User${userId}`,
          lobby_id: lobby_id,
        });
      });

      socket.on("disconnect", () => {
        websocketManager.removeUserSocket(userId, "lobby");
        console.log(`Lobby WebSocket disconnected: ${userId}`);

        // 로비에서 사용자 퇴장 알림
        if (lobbyId && lobbyId !== "undefined") {
          socket.to(`lobby-${lobbyId}`).emit("user:disconnected", {
            user_id: userId,
            lobby_id: lobbyId,
            username: userName,
            message: `${userName}가 로비에서 나갔습니다.`,
          });
        }
      });
    });
  },

  friendWebSocketHandler: (io) => {
    const friendNamespace = io.of("/ws/friend"); // 친구 네임스페이스 생성
    websocketManager.registerNamespace("friend", friendNamespace);

    friendNamespace.on("connection", (socket) => {
      const userId = socket.handshake.auth["userId"];
      console.log(`Friend WebSocket connected: ${userId}`);

      websocketManager.addUserSocket(Number(userId), "friend", socket);

      socket.on("disconnect", () => {
        websocketManager.removeUserSocket(Number(userId), "friend");
        console.log(`Friend WebSocket disconnected: ${userId}`);
      });
    });
  },
};

export default websocketHandlers;
