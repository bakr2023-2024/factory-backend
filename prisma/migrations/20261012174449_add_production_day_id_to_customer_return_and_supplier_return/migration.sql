/*
  Warnings:

  - Added the required column `productionDayId` to the `CustomerReturn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productionDayId` to the `SupplierReturn` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CustomerReturn" ADD COLUMN     "productionDayId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SupplierReturn" ADD COLUMN     "productionDayId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "SupplierReturn" ADD CONSTRAINT "SupplierReturn_productionDayId_fkey" FOREIGN KEY ("productionDayId") REFERENCES "ProductionDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReturn" ADD CONSTRAINT "CustomerReturn_productionDayId_fkey" FOREIGN KEY ("productionDayId") REFERENCES "ProductionDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
