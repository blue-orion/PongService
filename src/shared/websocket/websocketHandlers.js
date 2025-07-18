const websocketHandlers = {
  userSocketMap: new Map(),

  gameWebSocketHandler: (io) => {
    const gameNamespace = io.of("/game"); // 게임 네임스페이스 생성

    gameNamespace.on("connection", (socket) => {
      const userId = socket.handshake.query["user-id"];
      const gameId = socket.handshake.query["game-id"];

      console.log(`Game WebSocket connected: ${userId} (game: ${gameId})`);

      if (userId) {
        websocketHandlers.userSocketMap.set(userId, socket);
      }

      if (gameId) {
        socket.join(`game-${gameId}`);
        console.log(`User ${userId} joined room game-${gameId}`);
      }

      socket.on("disconnect", () => {
        console.log(`Game WebSocket disconnected: ${userId}`);
        if (userId) {
          websocketHandlers.userSocketMap.delete(userId);
          if (userId) {
            websocketHandlers.userSocketMap.delete(userId);
          }
        }
      });

      socket.on("error", (error) => {
        console.error(`Game socket error for user ${userId}:`, error);
      });
    });
  },

  lobbyWebSocketHandler: (io) => {
    const lobbyNamespace = io.of("/lobby"); // 로비 네임스페이스 생성
    // const lobbyController = new LobbyController();

    lobbyNamespace.on("connection", (socket) => {
      const userId = socket.handshake.query["user-id"];
      const lobbyId = socket.handshake.query["lobby-id"];

      console.log(`Lobby WebSocket connected: ${userId} (lobby: ${lobbyId})`);

      if (userId) {
        websocketHandlers.userSocketMap.set(userId, socket);
      }

      if (lobbyId) {
        socket.join(`lobby-${lobbyId}`);
        console.log(`User ${userId} joined room lobby-${lobbyId}`);
      }

      socket.on("disconnect", () => {
        console.log(`Lobby WebSocket disconnected: ${userId}`);
      });

      socket.on("error", (error) => {
        console.error(`Socket error for user ${userId}:`, error);
      });
    });
  },
};

export default websocketHandlers;
