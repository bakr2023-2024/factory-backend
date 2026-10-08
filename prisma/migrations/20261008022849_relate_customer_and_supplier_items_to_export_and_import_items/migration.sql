/*
  Warnings:

  - You are about to drop the column `variantId` on the `CustomerReturnItem` table. All the data in the column will be lost.
  - You are about to drop the column `variantId` on the `SupplierReturnItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[exportItemId]` on the table `CustomerReturnItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customerReturnId,exportItemId]` on the table `CustomerReturnItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[importItemId]` on the table `SupplierReturnItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[supplierReturnId,importItemId]` on the table `SupplierReturnItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `exportItemId` to the `CustomerReturnItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `importItemId` to the `SupplierReturnItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CustomerReturnItem" DROP CONSTRAINT "CustomerReturnItem_variantId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierReturnItem" DROP CONSTRAINT "SupplierReturnItem_variantId_fkey";

-- DropIndex
DROP INDEX "CustomerReturnItem_customerReturnId_variantId_key";

-- DropIndex
DROP INDEX "SupplierReturnItem_supplierReturnId_variantId_key";

-- AlterTable
ALTER TABLE "CustomerReturnItem" DROP COLUMN "variantId",
ADD COLUMN     "exportItemId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SupplierReturnItem" DROP COLUMN "variantId",
ADD COLUMN     "importItemId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CustomerReturnItem_exportItemId_key" ON "CustomerReturnItem"("exportItemId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerReturnItem_customerReturnId_exportItemId_key" ON "CustomerReturnItem"("customerReturnId", "exportItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierReturnItem_importItemId_key" ON "SupplierReturnItem"("importItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierReturnItem_supplierReturnId_importItemId_key" ON "SupplierReturnItem"("supplierReturnId", "importItemId");

-- AddForeignKey
ALTER TABLE "SupplierReturnItem" ADD CONSTRAINT "SupplierReturnItem_importItemId_fkey" FOREIGN KEY ("importItemId") REFERENCES "ImportItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReturnItem" ADD CONSTRAINT "CustomerReturnItem_exportItemId_fkey" FOREIGN KEY ("exportItemId") REFERENCES "ExportItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
