/*
  Warnings:

  - Made the column `typeRef` on table `StockMovement` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "StockMovement" ALTER COLUMN "typeRef" SET NOT NULL;
