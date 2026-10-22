/*
  Warnings:

  - A unique constraint covering the columns `[itemId,unitWeight,type]` on the table `Variant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StorageType" AS ENUM ('BOX', 'BASKET', 'JAR', 'BAG');

-- DropIndex
DROP INDEX "Variant_itemId_unitWeight_key";

-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "type" "StorageType" NOT NULL DEFAULT 'BOX';

-- CreateIndex
CREATE UNIQUE INDEX "Variant_itemId_unitWeight_type_key" ON "Variant"("itemId", "unitWeight", "type");
