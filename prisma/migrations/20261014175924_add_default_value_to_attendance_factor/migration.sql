/*
  Warnings:

  - Made the column `factor` on table `Attendance` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Attendance" ALTER COLUMN "factor" SET NOT NULL,
ALTER COLUMN "factor" SET DEFAULT 1;
