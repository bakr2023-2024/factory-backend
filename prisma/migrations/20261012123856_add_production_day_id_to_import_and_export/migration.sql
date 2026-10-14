/*
  Warnings:

  - Added the required column `productionDayId` to the `Export` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productionDayId` to the `Import` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Export" ADD COLUMN     "productionDayId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Import" ADD COLUMN     "productionDayId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Import" ADD CONSTRAINT "Import_productionDayId_fkey" FOREIGN KEY ("productionDayId") REFERENCES "ProductionDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Export" ADD CONSTRAINT "Export_productionDayId_fkey" FOREIGN KEY ("productionDayId") REFERENCES "ProductionDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
