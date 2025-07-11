-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "passwd" TEXT,
    "two_fa_secret" TEXT,
    "username" TEXT NOT NULL,
    "profile_image" TEXT,
    "refresh_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_User" ("created_at", "enabled", "id", "passwd", "profile_image", "refresh_token", "updated_at", "username") SELECT "created_at", "enabled", "id", "passwd", "profile_image", "refresh_token", "updated_at", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
