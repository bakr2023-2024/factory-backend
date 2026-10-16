/*
  Warnings:

  - You are about to drop the column `laborerId` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `laborerId` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `loanAmount` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `loanedAt` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `seasonId` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `loanId` on the `LoanPayment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `LoanPayment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rateId,productionDayId]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rateId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rateId` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `Loan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rateId` to the `Loan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rateId` to the `LoanPayment` table without a default value. This is not possible if the table is not empty.
  - Made the column `paidAt` on table `Payment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_laborerId_fkey";

-- DropForeignKey
ALTER TABLE "Loan" DROP CONSTRAINT "Loan_laborerId_fkey";

-- DropForeignKey
ALTER TABLE "Loan" DROP CONSTRAINT "Loan_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "Loan" DROP CONSTRAINT "Loan_seasonId_fkey";

-- DropForeignKey
ALTER TABLE "LoanPayment" DROP CONSTRAINT "LoanPayment_loanId_fkey";

-- DropForeignKey
ALTER TABLE "LoanPayment" DROP CONSTRAINT "LoanPayment_paymentId_fkey";

-- DropIndex
DROP INDEX "Attendance_laborerId_productionDayId_key";

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "laborerId",
ADD COLUMN     "rateId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Loan" DROP COLUMN "laborerId",
DROP COLUMN "loanAmount",
DROP COLUMN "loanedAt",
DROP COLUMN "paymentId",
DROP COLUMN "seasonId",
ADD COLUMN     "amount" DECIMAL(12,3) NOT NULL,
ADD COLUMN     "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "rateId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "LoanPayment" DROP COLUMN "loanId",
DROP COLUMN "paymentId",
ADD COLUMN     "rateId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "paidAt" SET NOT NULL,
ALTER COLUMN "paidAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_rateId_productionDayId_key" ON "Attendance"("rateId", "productionDayId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_rateId_key" ON "Payment"("rateId");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_rateId_fkey" FOREIGN KEY ("rateId") REFERENCES "Rate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_rateId_fkey" FOREIGN KEY ("rateId") REFERENCES "Rate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_rateId_fkey" FOREIGN KEY ("rateId") REFERENCES "Rate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
