-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lobby" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournament_id" INTEGER NOT NULL,
    "creator_id" INTEGER NOT NULL DEFAULT 1,
    "max_player" INTEGER NOT NULL,
    "lobby_status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Lobby_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Lobby" ("created_at", "enabled", "id", "lobby_status", "max_player", "tournament_id", "updated_at") SELECT "created_at", "enabled", "id", "lobby_status", "max_player", "tournament_id", "updated_at" FROM "Lobby";
DROP TABLE "Lobby";
ALTER TABLE "new_Lobby" RENAME TO "Lobby";
CREATE TABLE "new_LobbyPlayer" (
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
INSERT INTO "new_LobbyPlayer" ("created_at", "enabled", "id", "lobby_id", "updated_at", "user_id") SELECT "created_at", "enabled", "id", "lobby_id", "updated_at", "user_id" FROM "LobbyPlayer";
DROP TABLE "LobbyPlayer";
ALTER TABLE "new_LobbyPlayer" RENAME TO "LobbyPlayer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
