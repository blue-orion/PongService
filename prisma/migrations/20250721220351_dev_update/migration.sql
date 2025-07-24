-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "passwd" TEXT,
    "two_fa_secret" TEXT,
    "username" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "profile_image" TEXT,
    "refresh_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "total_wins" INTEGER NOT NULL DEFAULT 0,
    "total_losses" INTEGER NOT NULL DEFAULT 0,
    "win_rate" REAL NOT NULL DEFAULT 0,
    "friends" TEXT DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Friendship_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Friendship_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournament_type" TEXT NOT NULL,
    "tournament_status" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournament_id" INTEGER NOT NULL,
    "player_one_id" INTEGER NOT NULL,
    "player_two_id" INTEGER NOT NULL,
    "player_one_score" INTEGER,
    "player_two_score" INTEGER,
    "winner_id" INTEGER,
    "loser_id" INTEGER,
    "play_time" TEXT,
    "round" INTEGER NOT NULL,
    "match" INTEGER NOT NULL,
    "game_status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Game_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Game_player_one_id_fkey" FOREIGN KEY ("player_one_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Game_player_two_id_fkey" FOREIGN KEY ("player_two_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Game_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Game_loser_id_fkey" FOREIGN KEY ("loser_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lobby" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournament_id" INTEGER NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "max_player" INTEGER NOT NULL,
    "lobby_status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Lobby_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Lobby_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LobbyPlayer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lobby_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_ready" BOOLEAN NOT NULL DEFAULT false,
    "is_leader" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "LobbyPlayer_lobby_id_fkey" FOREIGN KEY ("lobby_id") REFERENCES "Lobby" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LobbyPlayer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "User_refresh_token_key" ON "User"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_sender_id_receiver_id_key" ON "Friendship"("sender_id", "receiver_id");
