/*
  Warnings:

  - The values [IMPORT,EXPORT,PRODUCTION] on the enum `StockMovementType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StockMovementType_new" AS ENUM ('IMPORT_ITEM', 'EXPORT_ITEM', 'PRODUCTION_BATCH', 'CONSUMPTION', 'CUSTOMER_RETURN_ITEM', 'SUPPLIER_RETURN_ITEM');
ALTER TABLE "StockMovement" ALTER COLUMN "type" TYPE "StockMovementType_new" USING ("type"::text::"StockMovementType_new");
ALTER TYPE "StockMovementType" RENAME TO "StockMovementType_old";
ALTER TYPE "StockMovementType_new" RENAME TO "StockMovementType";
DROP TYPE "public"."StockMovementType_old";
COMMIT;
