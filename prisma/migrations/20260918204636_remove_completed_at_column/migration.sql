/*
  Warnings:

  - You are about to drop the column `completedAt` on the `Export` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `Import` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `StockMovement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Export" DROP COLUMN "completedAt";

-- AlterTable
ALTER TABLE "Import" DROP COLUMN "completedAt";

-- AlterTable
ALTER TABLE "StockMovement" DROP COLUMN "completedAt";
