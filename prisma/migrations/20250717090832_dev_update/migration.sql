/*
  Warnings:

  - Added the required column `round` to the `Tournament` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournament_type" TEXT NOT NULL,
    "tournament_status" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Tournament" ("created_at", "enabled", "id", "tournament_status", "tournament_type", "updated_at") SELECT "created_at", "enabled", "id", "tournament_status", "tournament_type", "updated_at" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
