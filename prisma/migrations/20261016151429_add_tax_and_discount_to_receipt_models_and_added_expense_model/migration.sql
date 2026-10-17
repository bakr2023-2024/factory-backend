/*
  Warnings:

  - You are about to drop the column `currentStock` on the `Variant` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('SUNDRIES', 'REPAIRS', 'BILLS');

-- AlterTable
ALTER TABLE "CustomerReturn" ADD COLUMN     "discountAdjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAdjustment" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Export" ADD COLUMN     "discountAdjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAdjustment" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Import" ADD COLUMN     "discountAdjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAdjustment" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SupplierReturn" ADD COLUMN     "discountAdjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAdjustment" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Variant" DROP COLUMN "currentStock";

-- CreateTable
CREATE TABLE "Expense" (
    "id" SERIAL NOT NULL,
    "productionDayId" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" "ExpenseType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_productionDayId_fkey" FOREIGN KEY ("productionDayId") REFERENCES "ProductionDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
