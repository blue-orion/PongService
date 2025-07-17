/*
  Warnings:

  - Added the required column `nickname` to the `User` table without a default value. This is not possible if the table is not empty.

*/
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
    "status" TEXT NOT NULL DEFAULT 'LOGGED_OUT',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "game_rating" INTEGER NOT NULL DEFAULT 1000
);
INSERT INTO "new_User" ("created_at", "enabled", "id", "passwd", "profile_image", "refresh_token", "two_fa_secret", "updated_at", "username") SELECT "created_at", "enabled", "id", "passwd", "profile_image", "refresh_token", "two_fa_secret", "updated_at", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");
CREATE UNIQUE INDEX "User_refresh_token_key" ON "User"("refresh_token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
