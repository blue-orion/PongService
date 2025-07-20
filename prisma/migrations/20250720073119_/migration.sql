-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
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
    "total_loses" INTEGER NOT NULL DEFAULT 0,
    "win_rate" REAL NOT NULL DEFAULT 0,
    "friends" TEXT DEFAULT '[]'
);
INSERT INTO "new_User" ("created_at", "enabled", "id", "nickname", "passwd", "profile_image", "refresh_token", "status", "total_loses", "total_wins", "two_fa_secret", "updated_at", "username", "win_rate") SELECT "created_at", "enabled", "id", "nickname", "passwd", "profile_image", "refresh_token", "status", "total_loses", "total_wins", "two_fa_secret", "updated_at", "username", "win_rate" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");
CREATE UNIQUE INDEX "User_refresh_token_key" ON "User"("refresh_token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
