/*
  Warnings:

  - A unique constraint covering the columns `[type,typeRef]` on the table `StockMovement` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_type_typeRef_key" ON "StockMovement"("type", "typeRef");
