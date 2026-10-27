/*
  Warnings:

  - The `type` column on the `Variant` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[itemId,unitWeight]` on the table `Variant` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Variant_itemId_unitWeight_type_key";

-- AlterTable
ALTER TABLE "Variant" DROP COLUMN "type",
ADD COLUMN     "type" TEXT;

-- DropEnum
DROP TYPE "StorageType";

-- CreateIndex
CREATE UNIQUE INDEX "Variant_itemId_unitWeight_key" ON "Variant"("itemId", "unitWeight");
