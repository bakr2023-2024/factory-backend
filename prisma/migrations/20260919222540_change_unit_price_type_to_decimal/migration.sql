/*
  Warnings:

  - You are about to alter the column `unitPrice` on the `ExportItem` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(9,3)`.
  - You are about to alter the column `unitPrice` on the `ImportItem` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(9,3)`.
  - Made the column `unitPrice` on table `ExportItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `unitPrice` on table `ImportItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ExportItem" ALTER COLUMN "unitPrice" SET NOT NULL,
ALTER COLUMN "unitPrice" SET DEFAULT 1,
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(9,3);

-- AlterTable
ALTER TABLE "ImportItem" ALTER COLUMN "unitPrice" SET NOT NULL,
ALTER COLUMN "unitPrice" SET DEFAULT 1,
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(9,3);
