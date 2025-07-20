-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
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
INSERT INTO "new_Game" ("created_at", "enabled", "game_status", "id", "loser_id", "match", "play_time", "player_one_id", "player_one_score", "player_two_id", "player_two_score", "round", "tournament_id", "updated_at", "winner_id") SELECT "created_at", "enabled", "game_status", "id", "loser_id", "match", "play_time", "player_one_id", "player_one_score", "player_two_id", "player_two_score", "round", "tournament_id", "updated_at", "winner_id" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
